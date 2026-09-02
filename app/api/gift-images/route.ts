import { getGiftImage } from "@/lib/party-store";

export const dynamic = "force-dynamic";

const IMAGE_KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const imageKey = new URL(request.url).searchParams.get("key")?.trim() ?? "";
  if (!IMAGE_KEY_RE.test(imageKey)) {
    return new Response("Imagem inválida.", { status: 400 });
  }

  try {
    const image = await getGiftImage(imageKey);
    if (!image) return new Response("Imagem não encontrada.", { status: 404 });

    return new Response(image.data, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Não foi possível carregar a imagem.", { status: 503 });
  }
}
