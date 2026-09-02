import { hasAdminSession } from "@/lib/admin-auth";
import { deleteGiftImage, saveGiftImage } from "@/lib/party-store";

export const dynamic = "force-dynamic";

const IMAGE_KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 1_500_000;

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json({ error: "Use uma imagem JPG, PNG ou WEBP." }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "A imagem deve ter no máximo 1,5 MB após a otimização." }, { status: 400 });
    }

    const imageKey = await saveGiftImage(file);
    return Response.json({ imageKey }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível enviar a imagem do presente." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const imageKey = new URL(request.url).searchParams.get("key")?.trim() ?? "";
  if (!IMAGE_KEY_RE.test(imageKey)) {
    return Response.json({ error: "Imagem inválida." }, { status: 400 });
  }

  try {
    await deleteGiftImage(imageKey);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Não foi possível remover a imagem temporária." }, { status: 503 });
  }
}
