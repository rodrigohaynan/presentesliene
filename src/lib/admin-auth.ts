import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "liene_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

export type OrganizerRole = "admin" | "birthday";

function configuredPassword(role: OrganizerRole) {
  const value = role === "admin" ? process.env.ADMIN_PASSWORD : process.env.ANIVERSARIANTE_PASSWORD;
  return value?.trim() ?? "";
}

export function isAdminPasswordConfigured() {
  return configuredPassword("admin").length >= 8;
}

export function isBirthdayPasswordConfigured() {
  const birthday = configuredPassword("birthday");
  const admin = configuredPassword("admin");
  return birthday.length >= 8 && birthday !== admin;
}

export function isOrganizerAccessConfigured() {
  return isAdminPasswordConfigured() || isBirthdayPasswordConfigured();
}

function fixedDigest(value: string) {
  return createHash("sha256").update(value).digest();
}

function safePasswordMatch(candidate: string, expected: string) {
  if (!expected || expected.length < 8) return false;
  return timingSafeEqual(fixedDigest(candidate), fixedDigest(expected));
}

export function verifyOrganizerPassword(candidate: string): OrganizerRole | null {
  if (safePasswordMatch(candidate, configuredPassword("admin"))) return "admin";
  if (safePasswordMatch(candidate, configuredPassword("birthday"))) return "birthday";
  return null;
}

// Compatibilidade com rotas antigas do painel.
export function verifyAdminPassword(candidate: string) {
  return verifyOrganizerPassword(candidate) === "admin";
}

function sign(role: OrganizerRole, expiry: string) {
  return createHmac("sha256", configuredPassword(role))
    .update(`${role}.${expiry}`)
    .digest("base64url");
}

export function createOrganizerToken(role: OrganizerRole) {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS);
  return `${role}.${expiry}.${sign(role, expiry)}`;
}

// Compatibilidade com rotas antigas do painel.
export function createAdminToken() {
  return createOrganizerToken("admin");
}

function verifyOrganizerToken(token: string): OrganizerRole | null {
  const [roleValue, expiry, signature] = token.split(".");
  if (roleValue !== "admin" && roleValue !== "birthday") return null;

  const role: OrganizerRole = roleValue;
  if (!expiry || !signature || !/^\d+$/.test(expiry)) return null;
  if (Number(expiry) <= Math.floor(Date.now() / 1000)) return null;
  if (configuredPassword(role).length < 8) return null;

  const expected = sign(role, expiry);
  return timingSafeEqual(fixedDigest(signature), fixedDigest(expected)) ? role : null;
}

export async function getOrganizerSessionRole(): Promise<OrganizerRole | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return token ? verifyOrganizerToken(token) : null;
}

export async function hasOrganizerSession() {
  return (await getOrganizerSessionRole()) !== null;
}

export async function hasAdminSession() {
  return (await getOrganizerSessionRole()) === "admin";
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
