import { getStore } from "@netlify/blobs";
import { createHmac, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "liene_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;
const STORE_NAME = "liene-31-party";
const BIRTHDAY_PASSWORD_KEY = "security/birthday-password-v1";

export type OrganizerRole = "admin" | "birthday";

type ManagedBirthdayPassword = {
  salt: string;
  hash: string;
  updatedAt: string;
};

function accessStore() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

function configuredPassword(role: OrganizerRole) {
  const value = role === "admin" ? process.env.ADMIN_PASSWORD : process.env.ANIVERSARIANTE_PASSWORD;
  return value?.trim() ?? "";
}

async function getManagedBirthdayPassword(): Promise<ManagedBirthdayPassword | null> {
  try {
    return (await accessStore().get(BIRTHDAY_PASSWORD_KEY, { type: "json" })) as ManagedBirthdayPassword | null;
  } catch {
    return null;
  }
}

export async function hasManagedBirthdayPassword() {
  return (await getManagedBirthdayPassword()) !== null;
}

export function isAdminPasswordConfigured() {
  return configuredPassword("admin").length >= 8;
}

export async function isBirthdayPasswordConfigured() {
  if (await hasManagedBirthdayPassword()) return true;
  const birthday = configuredPassword("birthday");
  const admin = configuredPassword("admin");
  return birthday.length >= 8 && birthday !== admin;
}

export async function isOrganizerAccessConfigured() {
  return isAdminPasswordConfigured() || (await isBirthdayPasswordConfigured());
}

function fixedDigest(value: string) {
  return createHash("sha256").update(value).digest();
}

function safePasswordMatch(candidate: string, expected: string) {
  if (!expected || expected.length < 8) return false;
  return timingSafeEqual(fixedDigest(candidate), fixedDigest(expected));
}

function deriveManagedHash(password: string, salt: string) {
  return scryptSync(password, salt, 32).toString("base64url");
}

function safeHashMatch(candidateHash: string, expectedHash: string) {
  return timingSafeEqual(fixedDigest(candidateHash), fixedDigest(expectedHash));
}

async function verifyBirthdayPassword(candidate: string) {
  const managed = await getManagedBirthdayPassword();
  if (managed) {
    const candidateHash = deriveManagedHash(candidate, managed.salt);
    return safeHashMatch(candidateHash, managed.hash);
  }
  return safePasswordMatch(candidate, configuredPassword("birthday"));
}

export async function verifyOrganizerPassword(candidate: string): Promise<OrganizerRole | null> {
  if (safePasswordMatch(candidate, configuredPassword("admin"))) return "admin";
  if (await verifyBirthdayPassword(candidate)) return "birthday";
  return null;
}

// Compatibilidade com rotas antigas do painel: valida somente a senha do administrador.
export function verifyAdminPassword(candidate: string) {
  return safePasswordMatch(candidate, configuredPassword("admin"));
}

export async function setBirthdayPassword(password: string) {
  const normalized = password.trim();
  if (normalized.length < 8) {
    throw new Error("A senha do aniversariante deve ter pelo menos 8 caracteres.");
  }
  if (normalized.length > 128) {
    throw new Error("A senha do aniversariante é muito longa.");
  }
  if (safePasswordMatch(normalized, configuredPassword("admin"))) {
    throw new Error("A senha do aniversariante deve ser diferente da senha do administrador.");
  }

  const salt = randomBytes(16).toString("base64url");
  const record: ManagedBirthdayPassword = {
    salt,
    hash: deriveManagedHash(normalized, salt),
    updatedAt: new Date().toISOString(),
  };
  await accessStore().setJSON(BIRTHDAY_PASSWORD_KEY, record);
  return { updatedAt: record.updatedAt };
}

async function signingSecret(role: OrganizerRole) {
  if (role === "admin") {
    const admin = configuredPassword("admin");
    return admin.length >= 8 ? `admin:${admin}` : "";
  }

  const managed = await getManagedBirthdayPassword();
  if (managed) return `birthday-managed:${managed.hash}`;

  const birthday = configuredPassword("birthday");
  return birthday.length >= 8 ? `birthday-env:${birthday}` : "";
}

async function sign(role: OrganizerRole, expiry: string) {
  const secret = await signingSecret(role);
  if (!secret) return "";
  return createHmac("sha256", secret)
    .update(`${role}.${expiry}`)
    .digest("base64url");
}

export async function createOrganizerToken(role: OrganizerRole) {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS);
  return `${role}.${expiry}.${await sign(role, expiry)}`;
}

// Compatibilidade com rotas antigas do painel.
export function createAdminToken() {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS);
  const secret = `admin:${configuredPassword("admin")}`;
  const signature = createHmac("sha256", secret)
    .update(`admin.${expiry}`)
    .digest("base64url");
  return `admin.${expiry}.${signature}`;
}

async function verifyOrganizerToken(token: string): Promise<OrganizerRole | null> {
  const [roleValue, expiry, signature] = token.split(".");
  if (roleValue !== "admin" && roleValue !== "birthday") return null;

  const role: OrganizerRole = roleValue;
  if (!expiry || !signature || !/^\d+$/.test(expiry)) return null;
  if (Number(expiry) <= Math.floor(Date.now() / 1000)) return null;

  const expected = await sign(role, expiry);
  if (!expected) return null;
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
