import { hasAdminSession } from "@/lib/admin-auth";
import { deleteRsvp, findDuplicateAttendees, updateRsvp } from "@/lib/party-store";
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

export async function PUT(request: Request) {
  if (!(await hasAdminSession())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      id?: unknown;
      contactName?: unknown;
      whatsapp?: unknown;
      attendees?: unknown;
      allowDuplicate?: unknown;
    };
    const id = clean(body.id, 100);
    const contactName = clean(body.contactName, 80);
    const whatsapp = clean(body.whatsapp, 30);
    const attendees = parseAttendees(body.attendees);

    if (!id) return Response.json({ error: "Confirmação inválida." }, { status: 400 });
    if (contactName.length < 2) return Response.json({ error: "Informe o nome para contato." }, { status: 400 });
    if (whatsapp.length < 8) return Response.json({ error: "Informe um WhatsApp válido." }, { status: 400 });
    if (!attendees) return Response.json({ error: "A confirmação precisa ter ao menos um convidado válido." }, { status: 400 });

    if (body.allowDuplicate !== true) {
      const duplicates = await findDuplicateAttendees(attendees, id);
      if (duplicates.length > 0) {
        return Response.json(
          {
            code: "duplicate-name",
            error: "Já existe pessoa com nome igual em outra confirmação.",
            duplicates,
          },
          { status: 409 },
        );
      }
    }

    const rsvp = await updateRsvp({ id, contactName, whatsapp, attendees });
    if (!rsvp) return Response.json({ error: "Confirmação não encontrada." }, { status: 404 });
    return Response.json({ rsvp });
  } catch {
    return Response.json({ error: "Não foi possível editar os convidados." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return Response.json({ error: "Confirmação inválida." }, { status: 400 });

  try {
    const deleted = await deleteRsvp(id);
    if (!deleted) return Response.json({ error: "Confirmação não encontrada." }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Não foi possível excluir a confirmação." }, { status: 503 });
  }
}
