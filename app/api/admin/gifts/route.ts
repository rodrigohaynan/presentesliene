import { hasOrganizerSession } from "@/lib/admin-auth";
import { GIFT_ICONS, type GiftIcon, type GiftItem } from "@/lib/party-data";
import { createGift, deleteGift, releaseGiftReservation, updateGift } from "@/lib/party-store";

export const dynamic = "force-dynamic";

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function parseGift(body: Record<string, unknown>, requireId: boolean) {
  const id = clean(body.id, 100);
  const name = clean(body.name, 120);
  const description = clean(body.description, 500);
  const priceHint = clean(body.priceHint, 100);
  const icon = clean(body.icon, 30) as GiftIcon;
  const imageKey = typeof body.imageKey === "string" ? body.imageKey.trim() : "";
  const order = Number(body.order);

  if (requireId && !id) return { error: "Item inválido." } as const;
  if (name.length < 2) return { error: "Informe o nome do presente." } as const;
  if (!GIFT_ICONS.includes(icon)) return { error: "Ícone inválido." } as const;
  if (imageKey && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(imageKey)) {
    return { error: "A referência da imagem do presente é inválida." } as const;
  }

  return {
    gift: {
      ...(requireId ? { id } : {}),
      name,
      description,
      priceHint,
      icon,
      imageKey: imageKey || undefined,
      order: Number.isFinite(order) ? Math.max(1, Math.round(order)) : 1,
    },
  } as const;
}

async function authorized() {
  return hasOrganizerSession();
}

export async function POST(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const parsed = parseGift((await request.json()) as Record<string, unknown>, false);
    if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
    const gift = await createGift(parsed.gift);
    return Response.json({ gift }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível adicionar o presente." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const parsed = parseGift((await request.json()) as Record<string, unknown>, true);
    if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
    const gift = await updateGift(parsed.gift as GiftItem);
    if (!gift) return Response.json({ error: "Presente não encontrado." }, { status: 404 });
    return Response.json({ gift });
  } catch {
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
