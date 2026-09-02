import { createRsvp, findDuplicateAttendees } from "@/lib/party-store";
import type { AttendeeCategory, RsvpAttendee } from "@/lib/party-data";

export const dynamic = "force-dynamic";

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function parseAttendees(value: unknown): RsvpAttendee[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) return null;

  const attendees = value.map((item) => {
    const entry = item as { name?: unknown; category?: unknown };
    return {
      name: clean(entry.name, 80),
      category: entry.category as AttendeeCategory,
    };
  });

  if (attendees.some((item) => item.name.length < 2 || !["adult", "child"].includes(item.category))) {
    return null;
  }

  return attendees;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      contactName?: unknown;
      whatsapp?: unknown;
      attendees?: unknown;
      allowDuplicate?: unknown;
    };

    const contactName = clean(body.contactName, 80);
    const whatsapp = clean(body.whatsapp, 30);
    if (contactName.length < 2) {
      return Response.json({ error: "Informe o nome de quem está fazendo a confirmação." }, { status: 400 });
    }
    if (whatsapp.length < 8) {
      return Response.json({ error: "Informe um WhatsApp para contato." }, { status: 400 });
    }

    const attendees = parseAttendees(body.attendees);
    if (!attendees) {
      return Response.json({ error: "Revise os nomes e marque cada pessoa como adulto ou criança." }, { status: 400 });
    }

    if (body.allowDuplicate !== true) {
      const duplicates = await findDuplicateAttendees(attendees);
      if (duplicates.length > 0) {
        return Response.json(
          {
            code: "duplicate-name",
            error: "Já existe pessoa com nome igual na lista de presença.",
            duplicates,
          },
          { status: 409 },
        );
      }
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
