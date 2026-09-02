const BACKEND_ORIGIN = process.env.RESERVATIONS_BACKEND_ORIGIN
  ?? "https://lista-liene-31.rodrigo-haynan.chatgpt.site";

export async function fetchBackend(path: string, init?: RequestInit) {
  const response = await fetch(new URL(path, BACKEND_ORIGIN), {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Resposta inesperada do serviço de reservas.");
  }

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
