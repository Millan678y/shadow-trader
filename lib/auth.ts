import { supabase } from "./db";
import { jwtVerify, SignJWT } from "jose";

// NOTE: Set JWT_SECRET env var before deploying
const JWT_SECRET=proces...CRET ||
  "shadow-dev-secret-32-chars-here-abc123";

function makeNonce() { return crypto.randomUUID(); }

async function verifySIWS(msg, pubkey) {
  if (!msg || !pubkey) return { valid: false };
  try {
    const { data } = await supabase
      .from("users")
      .upsert({ wallet_address: pubkey, last_active_at: new Date().toISOString() }, { onConflict: "wallet_address" })
      .select("id")
      .single();
    return { valid: true, userId: data?.id };
  } catch { return { valid: false }; }
}

async function createSession(userId) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { valid: true, userId: payload.userId };
  } catch { return { valid: false }; }
}

export { makeNonce as generateNonce, verifySIWS, createSession, verifySession };
