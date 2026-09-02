import { createRsvp } from "@/lib/party-store";
import type { AttendeeCategory } from "@/lib/party-data";

export const dynamic = "force-dynamic";

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      contactName?: unknown;
      whatsapp?: unknown;
      attendees?: unknown;
    };

    const contactName = clean(body.contactName, 80);
    const whatsapp = clean(body.whatsapp, 30);
    if (contactName.length < 2) {
      return Response.json({ error: "Informe um nome para contato." }, { status: 400 });
    }
    if (whatsapp.length < 8) {
      return Response.json({ error: "Informe um WhatsApp para contato." }, { status: 400 });
    }
    if (!Array.isArray(body.attendees) || body.attendees.length < 1 || body.attendees.length > 12) {
      return Response.json({ error: "Informe de 1 a 12 pessoas na confirmação." }, { status: 400 });
    }

    const attendees = body.attendees.map((item) => {
      const entry = item as { name?: unknown; category?: unknown };
      return {
        name: clean(entry.name, 80),
        category: entry.category as AttendeeCategory,
      };
    });

    if (attendees.some((item) => item.name.length < 2 || !["adult", "child"].includes(item.category))) {
      return Response.json({ error: "Revise o nome e a categoria de cada pessoa." }, { status: 400 });
    }

    const rsvp = await createRsvp({ contactName, whatsapp, attendees });
    return Response.json({ ok: true, rsvp }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Não foi possível confirmar a presença agora. Tente novamente." },
      { status: 503 },
    );
  }
}
