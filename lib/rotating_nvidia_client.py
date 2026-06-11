"""
RotatingNvidiaClient - Production-grade API key rotation system for NVIDIA NIM.

Features:
- Multi-key pool with priority ordering (free → paid)
- Reactive failover on 429/401/403
- Proactive rotation before rate limits hit
- Cooldown + exponential backoff when all keys exhausted
- Streaming-safe retry with partial response discard
- Full observability (masked key logging, per-key counters)

Environment variables:
    NVIDIA_KEY_FREE - Free tier API key
    NVIDIA_KEY_PAID_1 to NVIDIA_KEY_PAID_4 - Paid fallback keys
    NVIDIA_BASE_URL - (optional) Override base URL
    NVIDIA_MODEL - (optional) Model identifier, default: meta/llama3-70b

Usage:
    client = RotatingNvidiaClient()
    response = client.chat_completion(messages=[{"role": "user", "content": "Hello"}])
"""

import os
import time
import json
import logging
import threading
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Iterator, Any, Union
from enum import Enum

import requests

# ---------------------------------------------------------------------------
# Setup logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("RotatingNvidiaClient")


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------
class RotationReason(Enum):
    RATE_LIMIT = "429"
    PROACTIVE = "proactive"
    DEAD_KEY = "dead_key"
    COOLDOWN = "cooldown"


@dataclass
class KeyState:
    """Tracks the runtime state of a single API key."""
    key: str
    name: str
    limit_per_minute: int
    requests_window: deque = field(default_factory=lambda: deque(maxlen=1000))
    total_requests: int = 0
    cooldown_until: float = 0.0
    is_dead: bool = False
    last_error: Optional[str] = None

    @property
    def masked(self) -> str:
        """Return masked key showing only last 4 characters."""
        if len(self.key) <= 4:
            return "****"
        return "*" * (len(self.key) - 4) + self.key[-4:]

    def requests_in_window(self, window_seconds: int = 60) -> int:
        """Count requests within the sliding window."""
        cutoff = time.time() - window_seconds
        while self.requests_window and self.requests_window[0] < cutoff:
            self.requests_window.popleft()
        return len(self.requests_window)

    def record_request(self):
        """Log a new request timestamp."""
        self.requests_window.append(time.time())
        self.total_requests += 1

    def is_in_cooldown(self) -> bool:
        return time.time() < self.cooldown_until

    def put_on_cooldown(self, seconds: int = 60):
        """Put this key on cooldown."""
        self.cooldown_until = time.time() + seconds
        logger.info(f"Key {self.name} ({self.masked}) on cooldown for {seconds}s")

    def mark_dead(self, reason: str):
        """Permanently disable this key for the session."""
        self.is_dead = True
        self.last_error = reason
        logger.warning(f"Key {self.name} ({self.masked}) marked DEAD: {reason}")


# ---------------------------------------------------------------------------
# Main client
# ---------------------------------------------------------------------------
class RotatingNvidiaClient:
    """
    Robust NVIDIA NIM client with automatic API key rotation,
    rate-limit handling, and proactive failover.
    """

    DEFAULT_BASE_URL = "https://integrate.api.nvidia.com"
    DEFAULT_MODEL = "meta/llama3-70b"
    DEFAULT_FREE_RPM = 40
    DEFAULT_PAID_RPM = 200  # Adjust based on your paid tier

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        free_rpm: int = DEFAULT_FREE_RPM,
        paid_rpm: int = DEFAULT_PAID_RPM,
        proactive_threshold: float = 0.85,
        cooldown_seconds: int = 60,
        max_backoff_seconds: int = 300,
        connection_timeout: int = 30,
        read_timeout: int = 120,
    ):
        """
        Args:
            base_url: NVIDIA API base URL (override with env var NVIDIA_BASE_URL)
            model: Model identifier (override with env var NVIDIA_MODEL)
            free_rpm: Requests per minute for free key
            paid_rpm: Requests per minute for paid keys
            proactive_threshold: Fraction of limit before proactive rotation (0.0-1.0)
            cooldown_seconds: Seconds to cooldown a key after 429
            max_backoff_seconds: Max exponential backoff when all keys exhausted
            connection_timeout: HTTP connection timeout in seconds
            read_timeout: HTTP read timeout in seconds
        """
        self.base_url = base_url or os.getenv("NVIDIA_BASE_URL", self.DEFAULT_BASE_URL)
        self.model = model or os.getenv("NVIDIA_MODEL", self.DEFAULT_MODEL)
        self.proactive_threshold = proactive_threshold
        self.cooldown_seconds = cooldown_seconds
        self.max_backoff_seconds = max_backoff_seconds
        self.connection_timeout = connection_timeout
        self.read_timeout = read_timeout

        # Thread-safe lock for key rotation
        self._lock = threading.RLock()

        # Initialize key pool
        self._keys: List[KeyState] = []
        self._init_key_pool(free_rpm, paid_rpm)

        # Session stats
        self._rotation_history: List[Dict] = []
        self._session_start = time.time()

        # Backoff state
        self._current_backoff = 30
        self._consecutive_failures = 0

    # ------------------------------------------------------------------
    # Key pool initialization
    # ------------------------------------------------------------------
    def _init_key_pool(self, free_rpm: int, paid_rpm: int):
        """Load keys from environment and build ordered pool."""
        env_keys = [
            ("NVIDIA_KEY_FREE", free_rpm, "free"),
            ("NVIDIA_KEY_PAID_1", paid_rpm, "paid-1"),
            ("NVIDIA_KEY_PAID_2", paid_rpm, "paid-2"),
            ("NVIDIA_KEY_PAID_3", paid_rpm, "paid-3"),
            ("NVIDIA_KEY_PAID_4", paid_rpm, "paid-4"),
        ]

        for env_name, rpm, label in env_keys:
            key = os.getenv(env_name)
            if key:
                self._keys.append(KeyState(key=key, name=label, limit_per_minute=rpm))
                logger.info(f"Loaded key [{label}] limit={rpm}/min")
            else:
                logger.warning(f"Missing env var: {env_name}")

        if not self._keys:
            raise RuntimeError(
                "No NVIDIA API keys found. Set at least NVIDIA_KEY_FREE."
            )

    # ------------------------------------------------------------------
    # Key selection
    # ------------------------------------------------------------------
    def _select_key(self) -> Optional[KeyState]:
        """
        Select the best available key.
        Order: First non-cooldown, non-dead key. Skip proactive-threshold keys.
        Returns None if all keys exhausted.
        """
        with self._lock:
            for key_state in self._keys:
                if key_state.is_dead:
                    continue
                if key_state.is_in_cooldown():
                    continue

                # Proactive check: if this key is near its limit, skip it
                recent = key_state.requests_in_window(60)
                threshold = int(key_state.limit_per_minute * self.proactive_threshold)
                if recent >= threshold:
                    logger.info(
                        f"Key {key_state.name} proactive skip: {recent}/{key_state.limit_per_minute} "
                        f"(threshold={threshold})"
                    )
                    continue

                return key_state

            return None

    # ------------------------------------------------------------------
    # Core API call with retry/rotation
    # ------------------------------------------------------------------
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        stream: bool = False,
        **extra_kwargs
    ) -> Union[Dict, Iterator[str]]:
        """
        Send a chat completion request with automatic key rotation.

        Args:
            messages: List of {"role": "...", "content": "..."}
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            stream: If True, returns an iterator over SSE chunks
            **extra_kwargs: Additional params passed to the API

        Returns:
            Dict with completion response (non-streaming)
            OR Iterator[str] yielding SSE data (streaming)
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
            **extra_kwargs,
        }

        if stream:
            return self._call_streaming(payload)
        else:
            return self._call_non_streaming(payload)

    def _call_non_streaming(self, payload: Dict) -> Dict:
        """Handle non-streaming request with retry logic."""
        last_exception: Optional[Exception] = None

        while True:
            key_state = self._select_key()

            if key_state is None:
                # All keys exhausted → backoff
                self._wait_with_backoff()
                continue

            key_state.record_request()

            url = f"{self.base_url}/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {key_state.key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }

            try:
                resp = requests.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=(self.connection_timeout, self.read_timeout),
                )

                if resp.status_code == 200:
                    self._consecutive_failures = 0
                    return resp.json()

                elif resp.status_code == 429:
                    logger.warning(f"429 on key {key_state.name} ({key_state.masked})")
                    key_state.put_on_cooldown(self.cooldown_seconds)
                    last_exception = RuntimeError(f"429 rate limit on {key_state.name}")
                    self._maybe_rotate(key_state, RotationReason.RATE_LIMIT)
                    continue

                elif resp.status_code in (401, 403):
                    logger.error(f"{resp.status_code} on key {key_state.name} ({key_state.masked})")
                    key_state.mark_dead(f"HTTP {resp.status_code}")
                    self._maybe_rotate(key_state, RotationReason.DEAD_KEY)
                    continue

                else:
                    resp.raise_for_status()

            except requests.exceptions.Timeout:
                logger.warning(f"Timeout on key {key_state.name}, retrying...")
                last_exception = requests.exceptions.Timeout("Request timed out")
                continue

            except requests.exceptions.ConnectionError as e:
                logger.error(f"Connection error: {e}")
                last_exception = e
                self._maybe_rotate(key_state, RotationReason.COOLDOWN)
                continue

        # Should not reach here, but just in case
        if last_exception:
            raise last_exception
        raise RuntimeError("All API keys exhausted")

    def _call_streaming(self, payload: Dict) -> Iterator[str]:
        """
        Handle streaming request with safe retry.
        If a rate limit hits mid-stream, the partial response is discarded
        and the full request is replayed on the next key.
        """
        # Accumulate partial chunks for potential replay
        buffer: List[str] = []
        attempt = 0
        max_attempts = len(self._keys) * 2 + 1

        while attempt < max_attempts:
            key_state = self._select_key()
            if key_state is None:
                self._wait_with_backoff()
                attempt += 1
                continue

            key_state.record_request()

            url = f"{self.base_url}/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {key_state.key}",
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            }

            try:
                with requests.post(
                    url,
                    headers=headers,
                    json=payload,
                    stream=True,
                    timeout=(self.connection_timeout, self.read_timeout * 2),
                ) as resp:
                    resp.raise_for_status()

                    for line in resp.iter_lines(decode_unicode=True):
                        if not line:
                            continue
                        # SSE lines start with "data: "
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                return
                            buffer.append(data)
                            yield data

                    # Stream completed successfully
                    self._consecutive_failures = 0
                    return

            except requests.exceptions.ChunkedEncodingError:
                # Mid-stream failure → discard partial, replay on next key
                logger.warning(f"Stream interrupted on key {key_state.name}, replaying...")
                key_state.put_on_cooldown(self.cooldown_seconds)
                self._maybe_rotate(key_state, RotationReason.RATE_LIMIT)
                buffer = []  # Discard partial
                attempt += 1
                continue

            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:
                    logger.warning(f"429 mid-stream on key {key_state.name}")
                    key_state.put_on_cooldown(self.cooldown_seconds)
                    self._maybe_rotate(key_state, RotationReason.RATE_LIMIT)
                    buffer = []
                    attempt += 1
                    continue
                elif e.response.status_code in (401, 403):
                    key_state.mark_dead(f"HTTP {e.response.status_code}")
                    self._maybe_rotate(key_state, RotationReason.DEAD_KEY)
                    attempt += 1
                    continue
                else:
                    raise

            except Exception as e:
                logger.error(f"Streaming error: {e}")
                attempt += 1
                continue

        raise RuntimeError(f"Streaming failed after {max_attempts} attempts across all keys")

    # ------------------------------------------------------------------
    # Rotation + backoff helpers
    # ------------------------------------------------------------------
    def _maybe_rotate(self, old_key: KeyState, reason: RotationReason, new_key: Optional[KeyState] = None):
        """Log rotation event and update state."""
        new = new_key or self._select_key()
        new_masked = new.masked if new else "NONE"

        event = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "old_key": old_key.masked,
            "new_key": new_masked,
            "reason": reason.value,
            "old_key_name": old_key.name,
        }
        self._rotation_history.append(event)
        logger.info(f"ROTATION: {old_key.name}({old_key.masked}) → {new_masked if new else 'NONE'}, reason={reason.value}")

        self._consecutive_failures += 1

    def _wait_with_backoff(self):
        """Wait with exponential backoff when all keys are exhausted."""
        wait = min(self._current_backoff, self.max_backoff_seconds)
        logger.warning(f"All keys exhausted. Backing off {wait}s...")
        time.sleep(wait)
        self._current_backoff = min(self._current_backoff * 2, self.max_backoff_seconds)

    # ------------------------------------------------------------------
    # Observability
    # ------------------------------------------------------------------
    def get_stats(self) -> Dict:
        """Return current session stats for all keys."""
        with self._lock:
            now = time.time()
            return {
                "session_duration_sec": int(now - self._session_start),
                "total_rotations": len(self._rotation_history),
                "keys": [
                    {
                        "name": k.name,
                        "masked": k.masked,
                        "total_requests": k.total_requests,
                        "requests_last_60s": k.requests_in_window(60),
                        "limit": k.limit_per_minute,
                        "is_dead": k.is_dead,
                        "in_cooldown": k.is_in_cooldown(),
                        "cooldown_remaining": max(0, int(k.cooldown_until - now)),
                    }
                    for k in self._keys
                ],
                "recent_rotations": self._rotation_history[-10:],
            }

    def print_stats(self):
        """Pretty-print stats to logs."""
        stats = self.get_stats()
        logger.info("=" * 60)
        logger.info(f"Session duration: {stats['session_duration_sec']}s | Total rotations: {stats['total_rotations']}")
        for k in stats["keys"]:
            status = "DEAD" if k["is_dead"] else ("COOLDOWN" if k["in_cooldown"] else "ACTIVE")
            logger.info(
                f"  [{k['name']}] {k['masked']} | {k['requests_last_60s']}/{k['limit']} rpm | "
                f"total={k['total_requests']} | status={status}"
            )
        logger.info("=" * 60)


# ---------------------------------------------------------------------------
# Convenience: singleton global instance (lazy-init so env vars are ready)
# ---------------------------------------------------------------------------
_CLIENT_INSTANCE: Optional[RotatingNvidiaClient] = None


def get_client() -> RotatingNvidiaClient:
    """Get or create the singleton client instance."""
    global _CLIENT_INSTANCE
    if _CLIENT_INSTANCE is None:
        _CLIENT_INSTANCE = RotatingNvidiaClient()
    return _CLIENT_INSTANCE


def nvidia_chat(messages, **kwargs):
    """One-shot convenience function."""
    return get_client().chat_completion(messages=messages, **kwargs)


def nvidia_chat_stream(messages, **kwargs):
    """One-shot streaming convenience function."""
    return get_client().chat_completion(messages=messages, stream=True, **kwargs)


# ---------------------------------------------------------------------------
# Optional: CLI test / health check
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys

    # Health check: print stats without making any API calls
    if "--stats" in sys.argv:
        client = RotatingNvidiaClient()
        client.print_stats()
        sys.exit(0)

    # Simple test query
    client = RotatingNvidiaClient()
    try:
        resp = client.chat_completion(
            messages=[{"role": "user", "content": "Say 'API key rotation is working' and nothing else."}]
        )
        print(json.dumps(resp, indent=2))
    except Exception as e:
        logger.error(f"Test failed: {e}")
        sys.exit(1)
