"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, Navigation } from "lucide-react";
import type { PartyConfig } from "@/lib/party-data";

function formatDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function PartyInvitation() {
  const [party, setParty] = useState<PartyConfig | null>(null);

  useEffect(() => {
    fetch("/api/party", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { party: PartyConfig }) => setParty(data.party))
      .catch(() => setParty(null));
  }, []);

  const dateLabel = useMemo(() => (party ? formatDate(party.date) : "10 de setembro de 2026"), [party]);

  return (
    <section id="convite" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9b722c]">Você é nosso convidado</p>
          <h2 className="mt-3 max-w-xl font-serif text-4xl font-semibold leading-tight text-[#391a22] sm:text-5xl">
            Vamos celebrar os <span className="text-[#8a263d]">{party?.age ?? 31} anos da {party?.hostName ?? "Liene"}</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#6d585d]">
            {party?.invitationText ?? `Vamos celebrar juntos os ${party?.age ?? 31} anos da ${party?.hostName ?? "Liene"}. Confirme sua presença e venha fazer parte desse momento especial!`}
          </p>
          <a
            href="#confirmar-presenca"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#7d1f37] px-6 text-sm font-bold text-white shadow-lg shadow-[#7d1f37]/15 transition hover:bg-[#64172b] focus:outline-none focus:ring-2 focus:ring-[#7d1f37]/40"
          >
            Confirmar presença
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-[1.6rem] border border-[#dfd0c6] bg-white p-5 shadow-sm">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#f4e7e0] text-[#7d1f37]"><CalendarDays className="size-5" /></span>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#9b722c]">Data</p>
            <p className="mt-1 font-serif text-xl font-semibold capitalize text-[#391a22]">{dateLabel}</p>
          </article>

          <article className="rounded-[1.6rem] border border-[#dfd0c6] bg-white p-5 shadow-sm">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#f4e7e0] text-[#7d1f37]"><Clock3 className="size-5" /></span>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#9b722c]">Horário</p>
            <p className="mt-1 font-serif text-xl font-semibold text-[#391a22]">{party?.time || "A definir"}</p>
            {!party?.time && <p className="mt-1 text-sm text-[#806e72]">O organizador pode informar pelo painel.</p>}
          </article>

          <article className="rounded-[1.6rem] border border-[#dfd0c6] bg-white p-5 shadow-sm sm:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f4e7e0] text-[#7d1f37]"><MapPin className="size-5" /></span>
              {party?.mapsUrl && (
                <a
                  href={party.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#d7c2b5] bg-[#fffaf5] px-4 py-2 text-xs font-bold text-[#7d1f37] transition hover:bg-[#f7eee7]"
                >
                  <Navigation className="size-3.5" /> Abrir mapa
                </a>
              )}
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#9b722c]">Local</p>
            <p className="mt-1 font-serif text-xl font-semibold text-[#391a22]">{party?.locationName || "A definir"}</p>
            <p className="mt-2 text-sm leading-6 text-[#806e72]">{party?.address || "O endereço poderá ser preenchido pelo organizador no painel."}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
