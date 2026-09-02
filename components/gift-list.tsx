"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Flower2, Gem, Gift, Heart, MapPinned, ShoppingBag, Sparkles, Star, Ticket, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import type { GiftItem } from "@/lib/party-data";

const icons = { book: BookOpen, flower: Flower2, gem: Gem, gift: Gift, heart: Heart, map: MapPinned, "shopping-bag": ShoppingBag, sparkles: Sparkles, star: Star, ticket: Ticket, utensils: Utensils };

export function GiftList() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GiftItem | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadGifts = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/gifts", { cache: "no-store" });
      if (!response.ok) throw new Error("load failed");
      const data = (await response.json()) as { gifts: GiftItem[] };
      setGifts(data.gifts);
    } catch {
      if (!quiet) toast.error("Não foi possível carregar os presentes.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGifts();
    const interval = window.setInterval(() => void loadGifts(true), 30_000);
    const onVisibility = () => document.visibilityState === "visible" && void loadGifts(true);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadGifts]);

  const availableLabel = useMemo(() => {
    if (loading) return "Carregando sugestões";
    if (gifts.length === 1) return "1 sugestão disponível";
    return `${gifts.length} sugestões disponíveis`;
  }, [gifts.length, loading]);

  async function reserveGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId: selected.id, name, contact }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status === 409 || response.status === 404) {
          setGifts((items) => items.filter((item) => item.id !== selected.id));
          setSelected(null);
        }
        throw new Error(data.error ?? "Não foi possível confirmar.");
      }
      setGifts((items) => items.filter((item) => item.id !== selected.id));
      setSelected(null);
      setName("");
      setContact("");
      toast.success("Presente reservado! A surpresa continua protegida até o dia 11.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#9b722c]">Se quiser presentear</p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#391a22] sm:text-4xl">Sugestões de presentes</h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-[#725f63]">A presença é o mais importante. A lista abaixo é apenas uma ajuda para quem quiser escolher algo que combine com a Liene.</p>
        </div>
        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f3ead8] px-4 py-2 text-sm font-semibold text-[#6b4a18]">
          <span className="size-2 rounded-full bg-[#b88a3b]" />{availableLabel}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-[1.6rem] bg-[#eee4d9]" />)}
        </div>
      ) : gifts.length === 0 ? (
        <div className="rounded-[2rem] border border-[#dac9bd] bg-white/80 px-6 py-14 text-center shadow-sm">
          <Gift className="mx-auto mb-4 size-10 text-[#8a263d]" />
          <h3 className="font-serif text-2xl font-semibold text-[#391a22]">Todos os presentes foram escolhidos</h3>
          <p className="mx-auto mt-2 max-w-xl text-base leading-7 text-[#725f63]">Que alegria! Sua presença na festa já será um presente especial.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift, index) => {
            const Icon = icons[gift.icon as keyof typeof icons] ?? Gift;
            return (
              <article key={gift.id} className="group flex min-h-64 flex-col overflow-hidden rounded-[1.6rem] border border-[#dfd0c6] bg-white/90 shadow-[0_10px_35px_rgba(74,35,41,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#c9a568] hover:shadow-[0_18px_45px_rgba(74,35,41,0.12)]">
                {gift.imageKey ? (
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f7eee7]">
                    <img key={gift.imageKey} src={`/api/gift-images/${encodeURIComponent(gift.imageKey)}`} alt={`Imagem sugerida de ${gift.name}`} className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.025]" />
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold tabular-nums text-[#8a6d61] shadow-sm">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  {!gift.imageKey && (
                    <div className="mb-5 flex items-start justify-between">
                      <span className="grid size-12 place-items-center rounded-2xl bg-[#f7eee7] text-[#8a263d] transition group-hover:bg-[#8a263d] group-hover:text-white"><Icon className="size-5" aria-hidden="true" /></span>
                      <span className="text-sm font-semibold tabular-nums text-[#b19487]">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                  )}
                <h3 className="font-serif text-xl font-semibold text-[#391a22]">{gift.name}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-6 text-[#725f63]">{gift.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eee4de] pt-4">
                  <span className="text-sm font-semibold text-[#8c6b34]">{gift.priceHint}</span>
                  <Button type="button" onClick={() => setSelected(gift)} className="h-10 rounded-full bg-[#7d1f37] px-5 text-white hover:bg-[#64172b]">Escolher</Button>
                </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="rounded-[1.5rem] border-[#dec9bd] bg-[#fffdf9] p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#391a22]">Vou dar: {selected?.name}</DialogTitle>
            <DialogDescription className="text-base leading-6 text-[#725f63]">Deixe seu nome para confirmar. Assim que reservar, este item sairá da lista para os próximos convidados.</DialogDescription>
          </DialogHeader>
          <form onSubmit={reserveGift} className="mt-2 space-y-4">
            <div className="space-y-2">
              <label htmlFor="guest-name" className="text-sm font-semibold text-[#4d3036]">Seu nome</label>
              <Input id="guest-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} autoComplete="name" placeholder="Como a Liene conhece você?" required className="h-11 rounded-xl border-[#d8c5b8] bg-white" />
            </div>
            <div className="space-y-2">
              <label htmlFor="guest-contact" className="text-sm font-semibold text-[#4d3036]">WhatsApp ou contato <span className="font-normal text-[#8f7c80]">(opcional)</span></label>
              <Input id="guest-contact" value={contact} onChange={(event) => setContact(event.target.value)} maxLength={80} autoComplete="tel" placeholder="(67) 99999-9999" className="h-11 rounded-xl border-[#d8c5b8] bg-white" />
            </div>
            <p className="text-sm leading-5 text-[#806e72]">Seu contato ficará visível somente no painel protegido do organizador.</p>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={submitting} className="h-11 w-full rounded-full bg-[#7d1f37] px-6 text-white hover:bg-[#64172b] sm:w-auto">{submitting ? "Confirmando…" : "Confirmar minha escolha"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Toaster richColors closeButton position="top-center" />
    </>
  );
}
