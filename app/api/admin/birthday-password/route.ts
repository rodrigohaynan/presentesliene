import {
  getOrganizerSessionRole,
  hasManagedBirthdayPassword,
  isBirthdayPasswordConfigured,
  setBirthdayPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  return (await getOrganizerSessionRole()) === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Somente o administrador pode gerenciar esta senha." }, { status: 403 });
  }
  return Response.json({
    configured: await isBirthdayPasswordConfigured(),
    managedByPanel: await hasManagedBirthdayPassword(),
  });
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Somente o administrador pode criar ou trocar esta senha." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      password?: unknown;
      confirmPassword?: unknown;
    };
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (password !== confirmPassword) {
      return Response.json({ error: "As senhas não coincidem." }, { status: 400 });
    }

    const result = await setBirthdayPassword(password);
    return Response.json({ ok: true, configured: true, managedByPanel: true, updatedAt: result.updatedAt });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível salvar a senha." },
      { status: 400 },
    );
  }
}
