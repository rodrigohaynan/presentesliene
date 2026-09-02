import { hasOrganizerSession } from "@/lib/admin-auth";
import { GIFT_ICONS, type GiftIcon, type GiftItem } from "@/lib/party-data";
import {
  createGift,
  deleteGift,
  deleteGiftImage,
  releaseGiftReservation,
  saveGiftImage,
  updateGift,
} from "@/lib/party-store";
import { captureProductImageFromUrl } from "@/lib/product-image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function parseGift(body: Record<string, unknown>, requireId: boolean) {
  const id = clean(body.id, 100);
  const name = clean(body.name, 120);
  const description = clean(body.description, 500);
  const priceHint = clean(body.priceHint, 100);
  const icon = clean(body.icon, 30) as GiftIcon;
  const imageKey = typeof body.imageKey === "string" ? body.imageKey.trim() : "";
  const suggestionImageKey = typeof body.suggestionImageKey === "string" ? body.suggestionImageKey.trim() : "";
  const suggestionUrlInput = clean(body.suggestionUrl, 1000);
  const order = Number(body.order);
  const captureSuggestionImage = body.captureSuggestionImage === true;

  if (requireId && !id) return { error: "Item inválido." } as const;
  if (name.length < 2) return { error: "Informe o nome do presente." } as const;
  if (!GIFT_ICONS.includes(icon)) return { error: "Ícone inválido." } as const;
  const imageKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (imageKey && !imageKeyPattern.test(imageKey)) {
    return { error: "A referência da imagem do presente é inválida." } as const;
  }
  if (suggestionImageKey && !imageKeyPattern.test(suggestionImageKey)) {
    return { error: "A referência da imagem automática do presente é inválida." } as const;
  }

  let suggestionUrl: string | undefined;
  if (suggestionUrlInput) {
    const candidate = /^https?:\/\//i.test(suggestionUrlInput)
      ? suggestionUrlInput
      : `https://${suggestionUrlInput}`;
    try {
      const url = new URL(candidate);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { error: "O link de sugestão precisa usar http ou https." } as const;
      }
      suggestionUrl = url.toString();
    } catch {
      return { error: "Informe um link de sugestão válido." } as const;
    }
  }

  return {
    captureSuggestionImage:
      Boolean(suggestionUrl) &&
      !imageKey &&
      (captureSuggestionImage || !suggestionImageKey),
    gift: {
      ...(requireId ? { id } : {}),
      name,
      description,
      priceHint,
      icon,
      imageKey: imageKey || undefined,
      suggestionImageKey: suggestionImageKey || undefined,
      suggestionUrl,
      order: Number.isFinite(order) ? Math.max(1, Math.round(order)) : 1,
    },
  } as const;
}

async function authorized() {
  return hasOrganizerSession();
}

async function captureSuggestionImageIfRequested<T extends Omit<GiftItem, "id"> | GiftItem>(
  gift: T,
  shouldCapture: boolean,
): Promise<{ gift: T; capturedImageKey?: string; imageCaptured: boolean; imageCaptureWarning?: string }> {
  if (!shouldCapture || !gift.suggestionUrl || gift.imageKey) return { gift, imageCaptured: false };

  try {
    const captured = await captureProductImageFromUrl(gift.suggestionUrl);
    const suggestionImageKey = await saveGiftImage(captured.blob);
    return {
      gift: { ...gift, suggestionImageKey } as T,
      capturedImageKey: suggestionImageKey,
      imageCaptured: true,
    };
  } catch (error) {
    return {
      gift,
      imageCaptured: false,
      imageCaptureWarning:
        error instanceof Error
          ? error.message
          : "Não foi possível capturar automaticamente a imagem do anúncio.",
    };
  }
}

export async function POST(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Não autorizado." }, { status: 401 });
  let capturedImageKey: string | undefined;
  try {
    const parsed = parseGift((await request.json()) as Record<string, unknown>, false);
    if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

    const prepared = await captureSuggestionImageIfRequested(parsed.gift, parsed.captureSuggestionImage);
    capturedImageKey = prepared.capturedImageKey;
    const gift = await createGift(prepared.gift);
    capturedImageKey = undefined;
    return Response.json(
      {
        gift,
        imageCaptured: prepared.imageCaptured,
        imageCaptureWarning: prepared.imageCaptureWarning,
      },
      { status: 201 },
    );
  } catch {
    if (capturedImageKey) await deleteGiftImage(capturedImageKey).catch(() => undefined);
    return Response.json({ error: "Não foi possível adicionar o presente." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Não autorizado." }, { status: 401 });
  let capturedImageKey: string | undefined;
  try {
    const parsed = parseGift((await request.json()) as Record<string, unknown>, true);
    if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

    const prepared = await captureSuggestionImageIfRequested(parsed.gift as GiftItem, parsed.captureSuggestionImage);
    capturedImageKey = prepared.capturedImageKey;
    const gift = await updateGift(prepared.gift);
    if (!gift) {
      if (capturedImageKey) await deleteGiftImage(capturedImageKey).catch(() => undefined);
      return Response.json({ error: "Presente não encontrado." }, { status: 404 });
    }
    capturedImageKey = undefined;
    return Response.json({
      gift,
      imageCaptured: prepared.imageCaptured,
      imageCaptureWarning: prepared.imageCaptureWarning,
    });
  } catch {
    if (capturedImageKey) await deleteGiftImage(capturedImageKey).catch(() => undefined);
    return Response.json({ error: "Não foi possível editar o presente." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Não autorizado." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return Response.json({ error: "Item inválido." }, { status: 400 });
  try {
    const result = await deleteGift(id);
    if (result === "not-found") return Response.json({ error: "Presente não encontrado." }, { status: 404 });
    if (result === "reserved") {
      return Response.json(
        { error: "Esse presente já foi reservado. Libere a reserva antes de excluir." },
        { status: 409 },
      );
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Não foi possível excluir o presente." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = (await request.json()) as { id?: unknown; action?: unknown };
    const id = clean(body.id, 100);
    if (!id || body.action !== "release") {
      return Response.json({ error: "Ação inválida." }, { status: 400 });
    }
    const released = await releaseGiftReservation(id);
    if (!released) return Response.json({ error: "Reserva não encontrada." }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Não foi possível liberar a reserva." }, { status: 503 });
  }
}
