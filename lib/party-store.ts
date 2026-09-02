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
const GIFT_IMAGE_PREFIX = "gift-images/";

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

export function normalizeAttendeeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

export type DuplicateAttendee = {
  submittedName: string;
  existingName: string;
  contactName: string;
  rsvpId: string;
};

export async function findDuplicateAttendees(
  attendees: RsvpAttendee[],
  excludeRsvpId?: string,
): Promise<DuplicateAttendee[]> {
  const rsvps = await getAllRsvps();
  const existing = new Map<string, { name: string; contactName: string; rsvpId: string }>();

  for (const rsvp of rsvps) {
    if (rsvp.id === excludeRsvpId) continue;
    for (const attendee of rsvp.attendees) {
      const key = normalizeAttendeeName(attendee.name);
      if (key && !existing.has(key)) {
        existing.set(key, {
          name: attendee.name,
          contactName: rsvp.contactName,
          rsvpId: rsvp.id,
        });
      }
    }
  }

  const duplicates: DuplicateAttendee[] = [];
  const submitted = new Map<string, string>();
  for (const attendee of attendees) {
    const key = normalizeAttendeeName(attendee.name);
    if (!key) continue;

    const match = existing.get(key);
    if (match) {
      duplicates.push({
        submittedName: attendee.name,
        existingName: match.name,
        contactName: match.contactName,
        rsvpId: match.rsvpId,
      });
      continue;
    }

    const repeatedInSubmission = submitted.get(key);
    if (repeatedInSubmission) {
      duplicates.push({
        submittedName: attendee.name,
        existingName: repeatedInSubmission,
        contactName: "esta mesma confirmação",
        rsvpId: "current",
      });
    } else {
      submitted.set(key, attendee.name);
    }
  }

  return duplicates;
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

export async function saveGiftImage(image: Blob): Promise<string> {
  await ensurePartyInitialized();
  const imageKey = randomUUID();
  await store().set(`${GIFT_IMAGE_PREFIX}${imageKey}`, image, {
    metadata: { contentType: image.type || "image/webp" },
  });
  return imageKey;
}

export async function getGiftImage(
  imageKey: string,
): Promise<{ data: Blob; contentType: string } | null> {
  await ensurePartyInitialized();
  const result = (await store().getWithMetadata(`${GIFT_IMAGE_PREFIX}${imageKey}`, {
    type: "blob",
  })) as { data: Blob; metadata?: { contentType?: string } } | null;
  if (!result) return null;
  return {
    data: result.data,
    contentType: result.metadata?.contentType || result.data.type || "image/webp",
  };
}

export async function deleteGiftImage(imageKey: string): Promise<void> {
  if (!imageKey) return;
  await ensurePartyInitialized();
  await store().delete(`${GIFT_IMAGE_PREFIX}${imageKey}`);
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

  if (current.imageKey && current.imageKey !== gift.imageKey) {
    await deleteGiftImage(current.imageKey);
  }

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
  if (current.imageKey) await deleteGiftImage(current.imageKey);
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

export async function updateRsvp(input: {
  id: string;
  contactName: string;
  whatsapp: string;
  attendees: RsvpAttendee[];
}): Promise<RsvpSubmission | null> {
  await ensurePartyInitialized();
  const key = `${RSVP_PREFIX}${input.id}`;
  const current = await getJSON<RsvpSubmission>(key);
  if (!current) return null;

  const updated: RsvpSubmission = {
    ...current,
    contactName: input.contactName,
    whatsapp: input.whatsapp,
    attendees: input.attendees,
  };
  await store().setJSON(key, updated);
  return updated;
}

export async function deleteRsvp(id: string): Promise<boolean> {
  await ensurePartyInitialized();
  const key = `${RSVP_PREFIX}${id}`;
  const current = await getJSON<RsvpSubmission>(key);
  if (!current) return false;
  await store().delete(key);
  return true;
}

export async function getAllRsvps(): Promise<RsvpSubmission[]> {
  await ensurePartyInitialized();
  const rsvps = await listJSON<RsvpSubmission>(RSVP_PREFIX);
  return rsvps.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
