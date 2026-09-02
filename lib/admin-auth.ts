import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "liene_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function configuredPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

export function isAdminPasswordConfigured() {
  return configuredPassword().length >= 8;
}

function fixedDigest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function verifyAdminPassword(candidate: string) {
  const expected = configuredPassword();
  if (!expected || expected.length < 8) return false;
  return timingSafeEqual(fixedDigest(candidate), fixedDigest(expected));
}

function sign(expiry: string) {
  return createHmac("sha256", configuredPassword()).update(expiry).digest("base64url");
}

export function createAdminToken() {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS);
  return `${expiry}.${sign(expiry)}`;
}

function verifyAdminToken(token: string) {
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature || !/^\d+$/.test(expiry)) return false;
  if (Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
  const expected = sign(expiry);
  return timingSafeEqual(fixedDigest(signature), fixedDigest(expected));
}

export async function hasAdminSession() {
  if (!isAdminPasswordConfigured()) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : false;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
