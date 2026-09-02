"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Gift, LockKeyhole, PartyPopper, UsersRound } from "lucide-react";
import { GiftList } from "@/components/gift-list";
import { PartyInvitation } from "@/components/party-invitation";
import { RsvpForm } from "@/components/rsvp-form";
import type { PartyConfig } from "@/lib/party-data";

function formatHeroDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

export default function Home() {
  const [party, setParty] = useState<PartyConfig | null>(null);

  useEffect(() => {
    fetch("/api/party", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { party: PartyConfig }) => setParty(data.party))
      .catch(() => setParty(null));
  }, []);

  const hostName = party?.hostName ?? "Liene";
  const age = party?.age ?? 31;
  const dateLabel = useMemo(() => formatHeroDate(party?.date ?? "2026-09-10"), [party?.date]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf7f1] text-[#391a22]">
      <section className="relative border-b border-[#dfd0c6] bg-[#f7efe6]">
        <div className="absolute inset-0 birthday-pattern opacity-50" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:px-10 lg:py-12">
          <div className="order-2 max-w-2xl pb-2 lg:order-1 lg:py-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cfae72] bg-white/70 px-4 py-2 text-sm font-bold uppercase tracking-[0.13em] text-[#7c5b27] backdrop-blur"><CalendarDays className="size-4" />{dateLabel}</span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#8a6f73]"><PartyPopper className="size-4" />{age} anos</span>
            </div>
            <p className="mb-3 font-serif text-xl italic text-[#9b722c]">Uma celebração feita com carinho</p>
            <h1 className="max-w-xl font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#61172c] sm:text-6xl lg:text-7xl">{hostName} faz <span className="text-[#b88a3b]">{age}</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#654f54]">Você é nosso convidado para celebrar esse novo ciclo. Confirme sua presença e, se desejar, escolha uma sugestão de presente.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#confirmar-presenca" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#7d1f37] px-6 text-sm font-bold text-white shadow-lg shadow-[#7d1f37]/15 transition hover:bg-[#64172b]"><UsersRound className="size-4" /> Confirmar presença</a>
              <a href="#presentes" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#d2bdb0] bg-white/80 px-6 text-sm font-bold text-[#7d1f37] transition hover:bg-white"><Gift className="size-4" /> Ver presentes</a>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-2xl border border-[#ddcbbf] bg-white/65 p-4 backdrop-blur"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#8a263d]" /><p className="text-sm leading-6 text-[#654f54]">Na confirmação, informe cada pessoa e marque se é adulto ou criança.</p></div>
              <div className="flex gap-3 rounded-2xl border border-[#ddcbbf] bg-white/65 p-4 backdrop-blur"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-[#8a263d]" /><p className="text-sm leading-6 text-[#654f54]">Os dados dos convidados e das escolhas ficam protegidos no painel do organizador.</p></div>
            </div>
          </div>
          <div className="order-1 mx-auto w-full max-w-xl lg:order-2">
            <div className="relative rounded-[2.2rem] border border-white/70 bg-white/50 p-2.5 shadow-[0_30px_80px_rgba(92,31,48,0.19)]">
              <div className="absolute -left-4 top-10 hidden rounded-2xl bg-[#7d1f37] px-5 py-3 text-sm font-semibold text-white shadow-xl sm:block">Vamos comemorar! ✦</div>
              <img src="/images/liene-31.webp" alt="Liene usando um vestido vinho em um evento especial" className="aspect-[4/4.35] w-full rounded-[1.75rem] object-cover object-[center_22%]" />
              <div className="absolute bottom-6 right-6 rounded-full border border-white/50 bg-[#fff9ef]/90 px-4 py-2 font-serif text-lg font-semibold text-[#7d1f37] shadow-lg backdrop-blur">{hostName} • {age} anos</div>
            </div>
          </div>
        </div>
      </section>

      <PartyInvitation />
      <RsvpForm />

      <section id="presentes" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <GiftList />
      </section>

      <footer className="border-t border-[#dfd0c6] bg-[#4b1725] px-5 py-8 text-[#f8eee6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-serif text-xl font-semibold">{hostName} • {age} anos</p><p className="mt-1 text-sm text-[#d9c3c8]">O melhor presente é celebrar esse momento juntos.</p></div>
          <a href="/surpresa" className="w-fit rounded-full border border-[#a97583] px-4 py-2 text-sm font-semibold transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">A surpresa abre em 11 de setembro</a>
        </div>
      </footer>
    </main>
  );
}
