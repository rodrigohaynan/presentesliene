import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_GIFTS,
  DEFAULT_PARTY_CONFIG,
  type GiftItem,
  type GiftReservation,
  type PartyConfig,
  type RsvpAttendee,
  type RsvpSubmission,
} from "@/lib/party-data";

const STORE_NAME = "liene-31-party";
const INITIALIZED_KEY = "meta/initialized-v2";
const PARTY_KEY = "party/config";
const GIFT_PREFIX = "gifts/";
const RESERVATION_PREFIX = "gift-reservations/";
const RSVP_PREFIX = "rsvps/";

function store() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

async function getJSON<T>(key: string): Promise<T | null> {
  return (await store().get(key, { type: "json" })) as T | null;
}

async function listJSON<T>(prefix: string): Promise<T[]> {
  const { blobs } = await store().list({ prefix });
  const values = await Promise.all(blobs.map((blob) => getJSON<T>(blob.key)));
  return values.filter((value) => value !== null) as T[];
}

export async function ensurePartyInitialized() {
  const marker = await getJSON<{ initializedAt: string }>(INITIALIZED_KEY);
  if (marker) return;

  const currentConfig = await getJSON<PartyConfig>(PARTY_KEY);
  if (!currentConfig) {
    await store().setJSON(PARTY_KEY, DEFAULT_PARTY_CONFIG, { onlyIfNew: true });
  }

  const existingGifts = await store().list({ prefix: GIFT_PREFIX });
  if (existingGifts.blobs.length === 0) {
    for (const gift of DEFAULT_GIFTS) {
      await store().setJSON(`${GIFT_PREFIX}${gift.id}`, gift, { onlyIfNew: true });
    }
  }

  await store().setJSON(
    INITIALIZED_KEY,
    { initializedAt: new Date().toISOString() },
    { onlyIfNew: true },
  );
}

export async function getPartyConfig(): Promise<PartyConfig> {
  await ensurePartyInitialized();
  return (await getJSON<PartyConfig>(PARTY_KEY)) ?? DEFAULT_PARTY_CONFIG;
}

export async function savePartyConfig(config: PartyConfig) {
  await ensurePartyInitialized();
  await store().setJSON(PARTY_KEY, config);
  return config;
}

export async function getAllGifts(): Promise<GiftItem[]> {
  await ensurePartyInitialized();
  const gifts = await listJSON<GiftItem>(GIFT_PREFIX);
  return gifts.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "pt-BR"));
}

export async function getGiftReservation(giftId: string): Promise<GiftReservation | null> {
  return getJSON<GiftReservation>(`${RESERVATION_PREFIX}${giftId}`);
}

export async function getAllGiftReservations(): Promise<GiftReservation[]> {
  await ensurePartyInitialized();
  const reservations = await listJSON<GiftReservation>(RESERVATION_PREFIX);
  return reservations.sort((a, b) => b.reservedAt.localeCompare(a.reservedAt));
}

export async function getAvailableGifts(): Promise<GiftItem[]> {
  const gifts = await getAllGifts();
  const reservations = await getAllGiftReservations();
  const reservedIds = new Set(reservations.map((reservation) => reservation.giftId));
  return gifts.filter((gift) => !reservedIds.has(gift.id));
}

export async function reserveGift(
  giftId: string,
  guestName: string,
  guestContact: string,
): Promise<{ ok: true; reservation: GiftReservation } | { ok: false; reason: "not-found" | "reserved" }> {
  await ensurePartyInitialized();
  const gift = await getJSON<GiftItem>(`${GIFT_PREFIX}${giftId}`);
  if (!gift) return { ok: false, reason: "not-found" };

  const reservation: GiftReservation = {
    id: randomUUID(),
    giftId,
    giftName: gift.name,
    guestName,
    guestContact,
    reservedAt: new Date().toISOString(),
  };

  const result = await store().setJSON(`${RESERVATION_PREFIX}${giftId}`, reservation, {
    onlyIfNew: true,
  });

  if (!result.modified) return { ok: false, reason: "reserved" };
  return { ok: true, reservation };
}

export async function createGift(input: Omit<GiftItem, "id">): Promise<GiftItem> {
  await ensurePartyInitialized();
  const gift: GiftItem = { ...input, id: randomUUID() };
  await store().setJSON(`${GIFT_PREFIX}${gift.id}`, gift, { onlyIfNew: true });
  return gift;
}

export async function updateGift(gift: GiftItem): Promise<GiftItem | null> {
  await ensurePartyInitialized();
  const key = `${GIFT_PREFIX}${gift.id}`;
  const current = await getJSON<GiftItem>(key);
  if (!current) return null;
  await store().setJSON(key, gift);

  const reservation = await getGiftReservation(gift.id);
  if (reservation && reservation.giftName !== gift.name) {
    await store().setJSON(`${RESERVATION_PREFIX}${gift.id}`, { ...reservation, giftName: gift.name });
  }

  return gift;
}

export async function deleteGift(giftId: string): Promise<"deleted" | "not-found" | "reserved"> {
  await ensurePartyInitialized();
  const giftKey = `${GIFT_PREFIX}${giftId}`;
  const current = await getJSON<GiftItem>(giftKey);
  if (!current) return "not-found";
  if (await getGiftReservation(giftId)) return "reserved";
  await store().delete(giftKey);
  return "deleted";
}

export async function releaseGiftReservation(giftId: string): Promise<boolean> {
  await ensurePartyInitialized();
  const key = `${RESERVATION_PREFIX}${giftId}`;
  const current = await getJSON<GiftReservation>(key);
  if (!current) return false;
  await store().delete(key);
  return true;
}

export async function createRsvp(input: {
  contactName: string;
  whatsapp: string;
  attendees: RsvpAttendee[];
}): Promise<RsvpSubmission> {
  await ensurePartyInitialized();
  const submission: RsvpSubmission = {
    id: randomUUID(),
    contactName: input.contactName,
    whatsapp: input.whatsapp,
    attendees: input.attendees,
    createdAt: new Date().toISOString(),
  };
  await store().setJSON(`${RSVP_PREFIX}${submission.id}`, submission, { onlyIfNew: true });
  return submission;
}

export async function getAllRsvps(): Promise<RsvpSubmission[]> {
  await ensurePartyInitialized();
  const rsvps = await listJSON<RsvpSubmission>(RSVP_PREFIX);
  return rsvps.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
