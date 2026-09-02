"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Gift, LockKeyhole, PartyPopper } from "lucide-react";

type SurpriseResponse = { unlocked: false; revealAt: string } | { unlocked: true; reservations: { giftName: string; guestName: string }[] };

export default function SurprisePage() {
  const [data, setData] = useState<SurpriseResponse | null>(null);

  useEffect(() => {
    fetch("/api/surpresa", { cache: "no-store" }).then((response) => response.json()).then((result: SurpriseResponse) => setData(result));
  }, []);

  return (
    <main className="min-h-screen bg-[#4b1725] px-5 py-8 text-[#fff8f0] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#efd9c7] hover:text-white hover:underline"><ArrowLeft className="size-4" /> Voltar ao convite</a>
        <section className="mt-14 rounded-[2.2rem] border border-white/15 bg-white/[0.07] p-7 text-center shadow-2xl backdrop-blur sm:p-12">
          {!data ? <p className="text-[#ead5d9]">Preparando a surpresa…</p> : !data.unlocked ? (
            <>
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f4dcb2] text-[#6a1a30]"><LockKeyhole className="size-7" /></div>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-[#e0b765]">Segredo protegido</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Ainda não, Liene…</h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#ead5d9]">As escolhas estão guardadas com carinho. Esta surpresa só será revelada a partir de 11 de setembro de 2026.</p>
            </>
          ) : (
            <>
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f4dcb2] text-[#6a1a30]"><PartyPopper className="size-7" /></div>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-[#e0b765]">Feliz aniversário</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">A surpresa é sua, Liene!</h1>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[#ead5d9]">Cada escolha abaixo foi feita por alguém que quis celebrar seus 31 anos com carinho.</p>
              <div className="mt-9 grid gap-3 text-left sm:grid-cols-2">
                {data.reservations.map((item) => (
                  <article key={`${item.giftName}-${item.guestName}`} className="rounded-2xl border border-white/15 bg-white/10 p-5">
                    <Gift className="mb-4 size-5 text-[#e0b765]" />
                    <p className="font-serif text-xl font-semibold">{item.giftName}</p>
                    <p className="mt-2 text-sm text-[#dfc8ce]">Com carinho, {item.guestName}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
