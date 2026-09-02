import { fetchBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return await fetchBackend("/api/gifts");
  } catch {
    return Response.json(
      { error: "Não foi possível carregar a lista agora." },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

export async function POST(request: Request) {
  try {
    return await fetchBackend("/api/gifts", {
      method: "POST",
      body: await request.text(),
    });
  } catch {
    return Response.json(
      { error: "Não foi possível confirmar sua escolha. Tente novamente." },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
