import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminToken,
  hasAdminSession,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    authenticated: await hasAdminSession(),
    configured: isAdminPasswordConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return Response.json(
      { error: "Defina ADMIN_PASSWORD no Netlify antes de usar o painel." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  if (!verifyAdminPassword(password)) {
    return Response.json({ error: "Senha inválida." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, createAdminToken(), adminCookieOptions());
  return Response.json({ authenticated: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", { ...adminCookieOptions(), maxAge: 0 });
  return Response.json({ authenticated: false });
}
