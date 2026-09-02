import { fetchBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return await fetchBackend("/api/surpresa");
  } catch {
    return Response.json(
      { error: "Não foi possível preparar a surpresa agora." },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
