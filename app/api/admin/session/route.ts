import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createOrganizerToken,
  getOrganizerSessionRole,
  isAdminPasswordConfigured,
  isBirthdayPasswordConfigured,
  isOrganizerAccessConfigured,
  verifyOrganizerPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getOrganizerSessionRole();
  return Response.json({
    authenticated: role !== null,
    role,
    configured: await isOrganizerAccessConfigured(),
    adminConfigured: isAdminPasswordConfigured(),
    birthdayConfigured: await isBirthdayPasswordConfigured(),
  });
}

export async function POST(request: Request) {
  if (!(await isOrganizerAccessConfigured())) {
    return Response.json(
      { error: "Defina ADMIN_PASSWORD no Netlify antes de usar o painel." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  const role = await verifyOrganizerPassword(password);
  if (!role) {
    return Response.json({ error: "Senha inválida." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, await createOrganizerToken(role), adminCookieOptions());
  return Response.json({ authenticated: true, role });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", { ...adminCookieOptions(), maxAge: 0 });
  return Response.json({ authenticated: false, role: null });
}
