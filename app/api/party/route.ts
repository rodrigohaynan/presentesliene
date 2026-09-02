import { getPartyConfig } from "@/lib/party-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(
      { party: await getPartyConfig() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível carregar os dados da festa agora." },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
