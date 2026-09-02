"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, LockKeyhole, Mail, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Reservation = { id: string; giftName: string; guestName: string; guestEmail: string; reservedAt: string };

export default function OrganizerPage() {
  const [code, setCode] = useState("");
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function openPanel(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/organizador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as { reservations?: Reservation[]; total?: number; error?: string };
      if (!response.ok || !data.reservations) throw new Error(data.error ?? "Não foi possível abrir.");
      setReservations(data.reservations);
      setTotal(data.total ?? 0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf7f1] px-5 py-8 text-[#391a22] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7d1f37] hover:underline"><ArrowLeft className="size-4" /> Voltar para a lista</a>
        <header className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#9b722c]">Acesso reservado</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold">Área do organizador</h1>
            <p className="mt-2 text-base text-[#725f63]">Acompanhe os presentes escolhidos e os dados dos convidados.</p>
          </div>
          {reservations && <Button type="button" variant="outline" onClick={() => void openPanel()} disabled={loading} className="rounded-full border-[#cdb8ab] bg-white"><RefreshCw className={loading ? "animate-spin" : ""} /> Atualizar</Button>}
        </header>

        {!reservations ? (
          <form onSubmit={openPanel} className="mt-10 max-w-lg rounded-[2rem] border border-[#dfd0c6] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-[#f4e7e0] text-[#7d1f37]"><LockKeyhole className="size-5" /></div>
            <label htmlFor="access-code" className="text-sm font-semibold">Código do organizador</label>
            <Input id="access-code" type="password" value={code} onChange={(event) => setCode(event.target.value)} required autoComplete="current-password" className="mt-2 h-11 rounded-xl" />
            {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
            <Button type="submit" disabled={loading} className="mt-5 h-11 rounded-full bg-[#7d1f37] px-6 text-white hover:bg-[#64172b]">{loading ? "Verificando…" : "Entrar"}</Button>
          </form>
        ) : (
          <section className="mt-10">
            <div className="mb-5 rounded-2xl border border-[#dfd0c6] bg-white p-5">
              <p className="text-sm text-[#806e72]">Andamento da lista</p>
              <p className="mt-1 font-serif text-3xl font-semibold">{reservations.length} de {total} presentes escolhidos</p>
            </div>
            {reservations.length === 0 ? (
              <div className="rounded-2xl border border-[#dfd0c6] bg-white p-8 text-center text-[#725f63]">Nenhum presente foi reservado ainda.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {reservations.map((reservation) => (
                  <article key={reservation.id} className="rounded-2xl border border-[#dfd0c6] bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#9b722c]">{reservation.giftName}</p>
                    <p className="mt-4 flex items-center gap-2 font-serif text-xl font-semibold"><UserRound className="size-4 text-[#7d1f37]" /> {reservation.guestName}</p>
                    <a href={`mailto:${reservation.guestEmail}`} className="mt-2 flex items-center gap-2 break-all text-sm text-[#725f63] hover:text-[#7d1f37] hover:underline"><Mail className="size-4 shrink-0" /> {reservation.guestEmail}</a>
                    <p className="mt-4 text-xs text-[#9a878b]">Reservado em {new Date(reservation.reservedAt).toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" })}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
