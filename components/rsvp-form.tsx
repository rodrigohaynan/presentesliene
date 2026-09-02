"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Baby, CheckCircle2, Plus, Trash2, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import type { AttendeeCategory } from "@/lib/party-data";

type AttendeeDraft = { name: string; category: AttendeeCategory };
type DuplicateInfo = {
  submittedName: string;
  existingName: string;
  contactName: string;
  rsvpId: string;
};

export function RsvpForm() {
  const [contactName, setContactName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [attendees, setAttendees] = useState<AttendeeDraft[]>([{ name: "", category: "adult" }]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [rsvpNote, setRsvpNote] = useState("Informe todas as pessoas que irão com você e marque cada uma como adulto ou criança.");

  useEffect(() => {
    fetch("/api/party", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { party?: { rsvpNote?: string } }) => {
        if (data.party?.rsvpNote) setRsvpNote(data.party.rsvpNote);
      })
      .catch(() => undefined);
  }, []);

  const attendeeSummary = useMemo(() => ({
    total: attendees.filter((item) => item.name.trim().length >= 2).length,
    adults: attendees.filter((item) => item.name.trim().length >= 2 && item.category === "adult").length,
    children: attendees.filter((item) => item.name.trim().length >= 2 && item.category === "child").length,
  }), [attendees]);

  function updateAttendee(index: number, patch: Partial<AttendeeDraft>) {
    setAttendees((items) => items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function addAttendee() {
    if (attendees.length >= 12) return;
    setAttendees((items) => [...items, { name: "", category: "adult" }]);
  }

  function removeAttendee(index: number) {
    if (attendees.length === 1) return;
    setAttendees((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  async function sendConfirmation(allowDuplicate = false): Promise<{ cancelled: boolean }> {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactName, whatsapp, attendees, allowDuplicate }),
    });
    const data = (await response.json()) as {
      error?: string;
      code?: string;
      duplicates?: DuplicateInfo[];
    };

    if (response.status === 409 && data.code === "duplicate-name" && data.duplicates?.length) {
      const lines = data.duplicates.map((item) => {
        if (item.rsvpId === "current") {
          return `• ${item.submittedName}: o nome aparece duas vezes nesta mesma confirmação.`;
        }
        return `• ${item.submittedName}: pessoa com nome igual foi adicionada por ${item.contactName}.`;
      });
      const proceed = window.confirm(
        `ATENÇÃO — NOME DUPLICADO\n\n${lines.join("\n")}\n\nSe forem pessoas diferentes com o mesmo nome, toque em OK para confirmar mesmo assim. Caso contrário, toque em Cancelar e corrija a lista.`,
      );
      if (!proceed) return { cancelled: true } as const;
      return sendConfirmation(true);
    }

    if (!response.ok) throw new Error(data.error ?? "Não foi possível confirmar.");
    return { cancelled: false } as const;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await sendConfirmation();
      if (result.cancelled) return;
      setConfirmed(true);
      toast.success("Presença confirmada com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <section id="confirmar-presenca" className="border-y border-[#dfd0c6] bg-[#f5ece6]">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center sm:px-8 lg:py-16">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#7d1f37] text-white"><CheckCircle2 className="size-7" /></div>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-[#9b722c]">Tudo certo</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[#391a22] sm:text-4xl">Presença confirmada!</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#725f63]">Os nomes informados já aparecem no painel do organizador, separados entre adultos e crianças. Nos vemos na festa!</p>
          <Button type="button" variant="outline" onClick={() => {
            setConfirmed(false);
            setContactName("");
            setWhatsapp("");
            setAttendees([{ name: "", category: "adult" }]);
          }} className="mt-6 rounded-full border-[#cdb8ab] bg-white">Enviar outra confirmação</Button>
        </div>
        <Toaster richColors closeButton position="top-center" />
      </section>
    );
  }

  return (
    <section id="confirmar-presenca" className="border-y border-[#dfd0c6] bg-[#f5ece6]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-10 lg:py-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9b722c]">Confirmação de presença</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-[#391a22]">Quem vai celebrar com a Liene?</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-[#725f63]">{rsvpNote}</p>
          <div className="mt-6 space-y-3 text-sm text-[#654f54]">
            <p className="flex items-center gap-3"><UsersRound className="size-5 text-[#7d1f37]" /> Você pode adicionar até 12 pessoas na mesma confirmação.</p>
            <p className="flex items-center gap-3"><Baby className="size-5 text-[#7d1f37]" /> Toda criança cadastrada abaixo entra normalmente na contagem de pessoas confirmadas.</p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-[2rem] border border-[#dfd0c6] bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rsvp-contact-name" className="text-sm font-semibold text-[#4d3036]">Quem está fazendo a confirmação?</label>
              <Input id="rsvp-contact-name" value={contactName} onChange={(event) => setContactName(event.target.value)} minLength={2} maxLength={80} required autoComplete="name" placeholder="Nome do responsável" className="mt-2 h-11 rounded-xl" />
              <p className="mt-1.5 text-xs leading-5 text-[#8b787c]">Este nome identifica o responsável pelo contato. Ele só entra na contagem se também for incluído na lista de pessoas abaixo.</p>
            </div>
            <div>
              <label htmlFor="rsvp-whatsapp" className="text-sm font-semibold text-[#4d3036]">WhatsApp para contato</label>
              <Input id="rsvp-whatsapp" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} minLength={8} maxLength={30} required inputMode="tel" autoComplete="tel" placeholder="(67) 99999-9999" className="mt-2 h-11 rounded-xl" />
            </div>
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl border border-[#ead8ca] bg-[#fff8f0] p-4 text-sm leading-6 text-[#6f555a]">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#9b722c]" />
            <p><strong>Importante:</strong> somente os nomes cadastrados em “Pessoas confirmadas” abaixo entram no total da festa. Marque cada um como adulto ou criança.</p>
          </div>

          <div className="mt-6 border-t border-[#eee4de] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-xl font-semibold text-[#391a22]">Pessoas confirmadas</p>
                <p className="mt-1 text-sm text-[#806e72]">Nome + adulto ou criança</p>
              </div>
              <Button type="button" variant="outline" onClick={addAttendee} disabled={attendees.length >= 12} className="rounded-full border-[#cdb8ab] bg-[#fffaf5]"><Plus className="size-4" /> Adicionar</Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-[#eee8dc] px-3 py-1.5 text-[#6b5634]">{attendeeSummary.total} pessoa(s)</span>
              <span className="rounded-full bg-[#eee8dc] px-3 py-1.5 text-[#6b5634]">{attendeeSummary.adults} adulto(s)</span>
              <span className="rounded-full bg-[#f4e7e0] px-3 py-1.5 text-[#7d1f37]">{attendeeSummary.children} criança(s)</span>
            </div>

            <div className="mt-4 space-y-3">
              {attendees.map((attendee, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-[#e4d6cd] bg-[#fffdf9] p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                  <div>
                    <label htmlFor={`attendee-${index}`} className="text-xs font-bold uppercase tracking-[0.12em] text-[#806e72]">Pessoa {index + 1}</label>
                    <Input id={`attendee-${index}`} value={attendee.name} onChange={(event) => updateAttendee(index, { name: event.target.value })} minLength={2} maxLength={80} required placeholder="Nome completo" className="mt-2 h-10 rounded-xl bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => updateAttendee(index, { category: "adult" })} className={`h-10 rounded-xl border px-3 text-sm font-semibold transition ${attendee.category === "adult" ? "border-[#7d1f37] bg-[#7d1f37] text-white" : "border-[#d9c8bd] bg-white text-[#654f54] hover:bg-[#f8f0ea]"}`}><UserRound className="mr-1.5 inline size-4" />Adulto</button>
                    <button type="button" onClick={() => updateAttendee(index, { category: "child" })} className={`h-10 rounded-xl border px-3 text-sm font-semibold transition ${attendee.category === "child" ? "border-[#7d1f37] bg-[#7d1f37] text-white" : "border-[#d9c8bd] bg-white text-[#654f54] hover:bg-[#f8f0ea]"}`}><Baby className="mr-1.5 inline size-4" />Criança</button>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeAttendee(index)} disabled={attendees.length === 1} className="h-10 rounded-xl px-3 text-[#8a263d] hover:bg-[#f4e7e0]" aria-label={`Remover pessoa ${index + 1}`}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="mt-6 h-12 w-full rounded-full bg-[#7d1f37] text-base font-bold text-white hover:bg-[#64172b]">{submitting ? "Confirmando…" : "Confirmar presença"}</Button>
        </form>
      </div>
      <Toaster richColors closeButton position="top-center" />
    </section>
  );
}
