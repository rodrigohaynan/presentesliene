import { hasAdminSession } from "@/lib/admin-auth";
import { savePartyConfig } from "@/lib/party-store";
import type { PartyConfig } from "@/lib/party-data";

export const dynamic = "force-dynamic";

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function PUT(request: Request) {
  if (!(await hasAdminSession())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<PartyConfig>;
    const age = Number(body.age);
    const config: PartyConfig = {
      eventTitle: clean(body.eventTitle, 100) || "Aniversário da Liene",
      hostName: clean(body.hostName, 80) || "Liene",
      age: Number.isFinite(age) && age > 0 && age < 130 ? Math.round(age) : 31,
      date: clean(body.date, 10),
      time: clean(body.time, 5),
      locationName: clean(body.locationName, 120),
      address: clean(body.address, 220),
      mapsUrl: clean(body.mapsUrl, 500),
      invitationText: clean(body.invitationText, 600),
      rsvpNote: clean(body.rsvpNote, 400),
    };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(config.date)) {
      return Response.json({ error: "Informe uma data válida." }, { status: 400 });
    }
    if (config.time && !/^\d{2}:\d{2}$/.test(config.time)) {
      return Response.json({ error: "Informe um horário válido." }, { status: 400 });
    }
    if (config.mapsUrl && !/^https?:\/\//i.test(config.mapsUrl)) {
      return Response.json({ error: "O link do mapa precisa começar com http:// ou https://." }, { status: 400 });
    }

    return Response.json({ party: await savePartyConfig(config) });
  } catch {
    return Response.json({ error: "Não foi possível salvar os dados da festa." }, { status: 503 });
  }
}
