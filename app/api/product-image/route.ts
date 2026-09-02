import { captureProductImageFromUrl } from "@/lib/product-image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeProductUrl(value: string) {
  const input = value.trim().slice(0, 1000);
  if (!input) return "";
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
}

export async function GET(request: Request) {
  const rawUrl = new URL(request.url).searchParams.get("url") ?? "";
  const productUrl = normalizeProductUrl(rawUrl);
  if (!productUrl) {
    return new Response("Link não informado.", { status: 400 });
  }

  try {
    const captured = await captureProductImageFromUrl(productUrl);
    return new Response(await captured.blob.arrayBuffer(), {
      headers: {
        "Content-Type": captured.blob.type || "image/jpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Imagem do anúncio indisponível.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
