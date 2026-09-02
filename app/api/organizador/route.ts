import { fetchBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return await fetchBackend("/api/organizador", {
      method: "POST",
      body: await request.text(),
    });
  } catch {
    return Response.json(
      { error: "Não foi possível abrir a área do organizador." },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
