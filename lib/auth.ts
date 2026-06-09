import { supabase } from "./db";
import { jwtVerify, SignJWT } from "jose";

const raw = process.env.JWT_SECRET || "shadow-dev-secret-32chars-min!";
const key = Buffer.from(raw, "utf-8");

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
    .sign(key);
}

async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, key);
    return { valid: true, userId: payload.userId };
  } catch { return { valid: false }; }
}

export { makeNonce as generateNonce, verifySIWS, createSession, verifySession };
