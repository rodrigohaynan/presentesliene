"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Baby,
  CheckCircle2,
  Edit3,
  Gift,
  ImagePlus,
  KeyRound,
  LockKeyhole,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import {
  GIFT_ICONS,
  type AttendeeCategory,
  type GiftIcon,
  type GiftItem,
  type GiftReservation,
  type PartyConfig,
  type RsvpSubmission,
} from "@/lib/party-data";

type OrganizerRole = "admin" | "birthday";

type DashboardData = {
  role: OrganizerRole;
  party: PartyConfig;
  gifts: GiftItem[];
  reservations: GiftReservation[];
  rsvps: RsvpSubmission[];
};

type Tab = "resumo" | "presencas" | "presentes" | "festa";
type GiftDraft = Omit<GiftItem, "id"> & { id?: string; captureSuggestionImage?: boolean };
type DuplicateInfo = {
  submittedName: string;
  existingName: string;
  contactName: string;
  rsvpId: string;
  matchType?: "exact" | "first-name";
};

const emptyGift = (order = 1): GiftDraft => ({
  name: "",
  description: "",
  priceHint: "",
  icon: "gift",
  imageKey: undefined,
  suggestionImageKey: undefined,
  suggestionUrl: undefined,
  captureSuggestionImage: false,
  order,
});

const iconLabels: Record<GiftIcon, string> = {
  book: "Livro",
  flower: "Beleza",
  gem: "Joia",
  gift: "Presente",
  heart: "Coração",
  map: "Passeio",
  "shopping-bag": "Bolsa/Compras",
  sparkles: "Moda",
  star: "Estrela",
  ticket: "Ingresso",
  utensils: "Gastronomia",
};

export default function OrganizerPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [birthdayConfigured, setBirthdayConfigured] = useState(false);
  const [role, setRole] = useState<OrganizerRole | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<Tab>("resumo");
  const [partyDraft, setPartyDraft] = useState<PartyConfig | null>(null);
  const [savingParty, setSavingParty] = useState(false);
  const [birthdayPassword, setBirthdayPassword] = useState("");
  const [birthdayPasswordConfirm, setBirthdayPasswordConfirm] = useState("");
  const [savingBirthdayPassword, setSavingBirthdayPassword] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftDraft | null>(null);
  const [savingGift, setSavingGift] = useState(false);
  const [editingRsvp, setEditingRsvp] = useState<RsvpSubmission | null>(null);
  const [savingRsvp, setSavingRsvp] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (response.status === 401) {
        setAuthenticated(false);
        setRole(null);
        setData(null);
        return;
      }
      const result = (await response.json()) as DashboardData & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível carregar o painel.");
      setData(result);
      setRole(result.role);
      setPartyDraft(result.party);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated: boolean; configured: boolean; birthdayConfigured: boolean; role: OrganizerRole | null }) => {
        setConfigured(result.configured);
        setBirthdayConfigured(result.birthdayConfigured);
        setAuthenticated(result.authenticated);
        setRole(result.role);
        if (result.authenticated) void loadDashboard();
      })
      .finally(() => setAuthChecked(true));
  }, [loadDashboard]);

  const reservationByGift = useMemo(
    () => new Map((data?.reservations ?? []).map((reservation) => [reservation.giftId, reservation])),
    [data?.reservations],
  );

  const attendance = useMemo(() => {
    const attendees = (data?.rsvps ?? []).flatMap((rsvp) => rsvp.attendees);
    return {
      total: attendees.length,
      adults: attendees.filter((item) => item.category === "adult").length,
      children: attendees.filter((item) => item.category === "child").length,
    };
  }, [data?.rsvps]);

  function openGiftEditor(draft: GiftDraft) {
    setEditingGift(draft);
  }

  useEffect(() => {
    if (!editingGift) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingGift]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { error?: string; role?: OrganizerRole };
      if (!response.ok || !result.role) throw new Error(result.error ?? "Não foi possível entrar.");
      setAuthenticated(true);
      setRole(result.role);
      setPassword("");
      await loadDashboard();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setRole(null);
    setData(null);
    setEditingRsvp(null);
    setEditingGift(null);
  }

  async function saveParty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!partyDraft || savingParty) return;
    setSavingParty(true);
    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partyDraft),
      });
      const result = (await response.json()) as { party?: PartyConfig; error?: string };
      if (!response.ok || !result.party) throw new Error(result.error ?? "Não foi possível salvar.");
      setData((current) => (current ? { ...current, party: result.party! } : current));
      setPartyDraft(result.party);
      toast.success("Dados da festa atualizados.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSavingParty(false);
    }
  }

  async function saveBirthdayAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role !== "admin" || savingBirthdayPassword) return;
    if (birthdayPassword.length < 8) {
      toast.error("A senha do aniversariante deve ter pelo menos 8 caracteres.");
      return;
    }
    if (birthdayPassword !== birthdayPasswordConfirm) {
      toast.error("As senhas do aniversariante não coincidem.");
      return;
    }

    setSavingBirthdayPassword(true);
    try {
      const response = await fetch("/api/admin/birthday-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: birthdayPassword, confirmPassword: birthdayPasswordConfirm }),
      });
      const result = (await response.json()) as { error?: string; configured?: boolean };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar a senha.");
      setBirthdayConfigured(true);
      setBirthdayPassword("");
      setBirthdayPasswordConfirm("");
      toast.success("Senha do aniversariante criada/atualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a senha.");
    } finally {
      setSavingBirthdayPassword(false);
    }
  }

  async function saveGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingGift || savingGift) return;
    setSavingGift(true);
    try {
      const response = await fetch("/api/admin/gifts", {
        method: editingGift.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingGift),
      });
      const result = (await response.json()) as {
        gift?: GiftItem;
        error?: string;
        imageCaptured?: boolean;
        imageCaptureWarning?: string;
      };
      if (!response.ok || !result.gift) throw new Error(result.error ?? "Não foi possível salvar o presente.");
      if (result.imageCaptureWarning) {
        toast.warning(`Presente salvo, mas a foto do link não foi capturada: ${result.imageCaptureWarning}`);
      } else if (result.imageCaptured) {
        toast.success(`${editingGift.id ? "Presente atualizado" : "Presente adicionado"}. Imagem do anúncio capturada automaticamente.`);
      } else {
        toast.success(editingGift.id ? "Presente atualizado." : "Presente adicionado.");
      }
      setEditingGift(null);
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o presente.");
    } finally {
      setSavingGift(false);
    }
  }

  async function deleteGiftItem(gift: GiftItem) {
    if (!window.confirm(`Excluir “${gift.name}” da lista?`)) return;
    try {
      const response = await fetch(`/api/admin/gifts?id=${encodeURIComponent(gift.id)}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível excluir.");
      toast.success("Presente excluído.");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir.");
    }
  }

  async function releaseReservation(gift: GiftItem) {
    if (!window.confirm(`Liberar novamente o presente “${gift.name}”? A reserva atual será removida.`)) return;
    try {
      const response = await fetch("/api/admin/gifts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gift.id, action: "release" }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível liberar.");
      toast.success("Presente liberado novamente.");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível liberar.");
    }
  }

  async function performRsvpSave(allowDuplicate = false): Promise<"saved" | "cancelled"> {
    if (!editingRsvp) return "cancelled";
    const response = await fetch("/api/admin/rsvps", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editingRsvp, allowDuplicate }),
    });
    const result = (await response.json()) as {
      rsvp?: RsvpSubmission;
      error?: string;
      code?: string;
      duplicates?: DuplicateInfo[];
    };

    if (response.status === 409 && result.code === "duplicate-name" && result.duplicates?.length) {
      const lines = result.duplicates.map((item) => {
        if (item.matchType === "first-name") {
          return item.rsvpId === "current"
            ? `• ${item.submittedName}: possível duplicidade com ${item.existingName} nesta confirmação (mesmo primeiro nome).`
            : `• ${item.submittedName}: possível duplicidade. Já existe ${item.existingName}, adicionado(a) por ${item.contactName}.`;
        }
        return item.rsvpId === "current"
          ? `• ${item.submittedName}: aparece duas vezes nesta confirmação.`
          : `• ${item.submittedName}: pessoa com nome igual foi adicionada por ${item.contactName}.`;
      });
      const proceed = window.confirm(
        `ATENÇÃO — POSSÍVEL DUPLICIDADE\n\n${lines.join("\n")}\n\nSe forem pessoas diferentes, toque em OK para salvar mesmo assim.`,
      );
      if (!proceed) return "cancelled";
      return performRsvpSave(true);
    }

    if (!response.ok || !result.rsvp) throw new Error(result.error ?? "Não foi possível editar os convidados.");
    return "saved";
  }

  async function saveRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRsvp || savingRsvp) return;
    setSavingRsvp(true);
    try {
      const outcome = await performRsvpSave();
      if (outcome === "cancelled") return;
      toast.success("Convidados atualizados.");
      setEditingRsvp(null);
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível editar os convidados.");
    } finally {
      setSavingRsvp(false);
    }
  }

  async function deleteRsvpItem(rsvp: RsvpSubmission) {
    const names = rsvp.attendees.map((item) => item.name).join(", ");
    if (!window.confirm(`Excluir esta confirmação e remover da contagem: ${names}?`)) return;
    try {
      const response = await fetch(`/api/admin/rsvps?id=${encodeURIComponent(rsvp.id)}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível excluir.");
      if (editingRsvp?.id === rsvp.id) setEditingRsvp(null);
      toast.success("Confirmação excluída e convidados removidos da contagem.");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir.");
    }
  }

  if (!authChecked) {
    return <main className="grid min-h-screen place-items-center bg-[#fbf7f1] text-[#391a22]"><RefreshCw className="size-7 animate-spin text-[#7d1f37]" /></main>;
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#fbf7f1] px-5 py-8 text-[#391a22] sm:px-8">
        <div className="mx-auto max-w-4xl">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7d1f37] hover:underline"><ArrowLeft className="size-4" /> Voltar ao convite</a>
          <section className="mt-12 max-w-lg rounded-[2rem] border border-[#dfd0c6] bg-white p-6 shadow-sm sm:p-8">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#f4e7e0] text-[#7d1f37]"><LockKeyhole className="size-5" /></div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.17em] text-[#9b722c]">Acesso reservado</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold">Painel da festa</h1>
            <p className="mt-3 text-base leading-7 text-[#725f63]">Administrador e aniversariante acessam o mesmo painel com senhas diferentes. O aniversariante pode gerenciar a festa, mas não vê quem escolheu cada presente.</p>

            {!configured ? (
              <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-bold">Falta configurar uma senha de acesso.</p>
                <p className="mt-1">Configure <strong>ADMIN_PASSWORD</strong> no Netlify para liberar o administrador. Depois, o próprio administrador poderá criar a senha do aniversariante pelo painel.</p>
              </div>
            ) : (
              <form onSubmit={login} className="mt-7">
                <label htmlFor="admin-password" className="text-sm font-semibold">Senha de acesso</label>
                <Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="mt-2 h-11 rounded-xl" />
                {loginError && <p className="mt-3 text-sm font-medium text-red-700">{loginError}</p>}
                <Button type="submit" disabled={loggingIn} className="mt-5 h-11 rounded-full bg-[#7d1f37] px-6 text-white hover:bg-[#64172b]"><KeyRound className="size-4" /> {loggingIn ? "Entrando…" : "Entrar"}</Button>
                {!birthdayConfigured && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">Ainda não existe senha ativa para o aniversariante. Entre como <strong>Administrador</strong> e crie a senha em <strong>Dados da festa → Acesso do aniversariante</strong>.</p>}
              </form>
            )}
          </section>
        </div>
        <Toaster richColors closeButton position="top-center" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f2ed] text-[#391a22]">
      <header className="sticky top-0 z-20 border-b border-[#dfd0c6] bg-[#fbf7f1]/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#9b722c]">Painel privado</p>
            <h1 className="font-serif text-2xl font-semibold">{role === "birthday" ? "Aniversariante" : "Admin"} • Liene 31</h1>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void loadDashboard()} disabled={loading} className="rounded-full border-[#cdb8ab] bg-white"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Atualizar</span></Button>
            <Button type="button" variant="outline" onClick={() => void logout()} className="rounded-full border-[#cdb8ab] bg-white"><LogOut className="size-4" /><span className="hidden sm:inline">Sair</span></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7d1f37] hover:underline"><ArrowLeft className="size-4" /> Ver convite público</a>

        <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {([
            ["resumo", "Resumo"],
            ["presencas", "Presenças"],
            ["presentes", "Presentes"],
            ["festa", "Dados da festa"],
          ] as [Tab, string][]).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${tab === value ? "bg-[#7d1f37] text-white" : "border border-[#d7c6bb] bg-white text-[#654f54] hover:bg-[#fffaf5]"}`}>{label}</button>
          ))}
        </nav>

        {!data ? (
          <div className="mt-10 grid min-h-60 place-items-center rounded-[2rem] border border-[#dfd0c6] bg-white"><RefreshCw className="size-7 animate-spin text-[#7d1f37]" /></div>
        ) : tab === "resumo" ? (
          <section className="mt-7">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<UsersRound className="size-5" />} label="Pessoas confirmadas" value={attendance.total} />
              <StatCard icon={<UserRound className="size-5" />} label="Adultos" value={attendance.adults} />
              <StatCard icon={<Baby className="size-5" />} label="Crianças" value={attendance.children} />
              <StatCard icon={<Gift className="size-5" />} label="Presentes reservados" value={`${data.reservations.length}/${data.gifts.length}`} />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <article className="rounded-[1.7rem] border border-[#dfd0c6] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-[0.13em] text-[#9b722c]">Últimas confirmações</p><h2 className="mt-1 font-serif text-2xl font-semibold">Presenças</h2></div><UsersRound className="size-6 text-[#7d1f37]" /></div>
                <div className="mt-5 space-y-3">
                  {data.rsvps.length === 0 ? <p className="text-sm text-[#806e72]">Ainda não há confirmações.</p> : data.rsvps.slice(0, 5).map((rsvp) => (
                    <div key={rsvp.id} className="rounded-2xl bg-[#faf5f1] p-4">
                      <div className="flex items-center justify-between gap-3"><p className="font-semibold">Contato: {rsvp.contactName}</p><span className="text-xs text-[#8f7c80]">{rsvp.attendees.length} pessoa(s)</span></div>
                      <p className="mt-1 text-sm text-[#806e72]">{rsvp.whatsapp}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {rsvp.attendees.map((attendee, index) => <AttendeeBadge key={`${rsvp.id}-summary-${index}`} attendee={attendee} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[1.7rem] border border-[#dfd0c6] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-[0.13em] text-[#9b722c]">Últimas escolhas</p><h2 className="mt-1 font-serif text-2xl font-semibold">Presentes</h2></div><Gift className="size-6 text-[#7d1f37]" /></div>
                <div className="mt-5 space-y-3">
                  {data.reservations.length === 0 ? <p className="text-sm text-[#806e72]">Nenhum presente reservado ainda.</p> : data.reservations.slice(0, 5).map((reservation) => (
                    <div key={reservation.id} className="rounded-2xl bg-[#faf5f1] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9b722c]">{reservation.giftName}</p>
                      {role === "admin" ? (
                        <>
                          <p className="mt-1 font-semibold">{reservation.guestName}</p>
                          {reservation.guestContact && <p className="mt-1 text-sm text-[#806e72]">{reservation.guestContact}</p>}
                        </>
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-[#6f6063]">Reservado • identidade protegida</p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        ) : tab === "presencas" ? (
          <section className="mt-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#9b722c]">Lista privada</p><h2 className="mt-1 font-serif text-3xl font-semibold">Convidados confirmados</h2><p className="mt-2 text-sm text-[#806e72]">Você pode corrigir nomes, trocar adulto/criança, remover uma pessoa da confirmação ou excluir a confirmação inteira.</p></div>
              <div className="flex gap-2 text-sm"><span className="rounded-full bg-white px-4 py-2 font-semibold">{attendance.adults} adultos</span><span className="rounded-full bg-white px-4 py-2 font-semibold">{attendance.children} crianças</span></div>
            </div>

            {editingRsvp && (
              <RsvpEditor
                draft={editingRsvp}
                onChange={setEditingRsvp}
                onCancel={() => setEditingRsvp(null)}
                onSubmit={saveRsvp}
                saving={savingRsvp}
              />
            )}

            {data.rsvps.length === 0 ? (
              <div className="rounded-[1.7rem] border border-[#dfd0c6] bg-white p-10 text-center text-[#806e72]">Ainda não há confirmações de presença.</div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.rsvps.map((rsvp) => (
                  <article key={rsvp.id} className="rounded-[1.7rem] border border-[#dfd0c6] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9b722c]">Responsável pelo contato</p><p className="mt-1 font-serif text-xl font-semibold">{rsvp.contactName}</p><p className="mt-1 text-sm text-[#806e72]">WhatsApp: {rsvp.whatsapp}</p></div>
                      <span className="rounded-full bg-[#f3ead8] px-3 py-1 text-xs font-bold text-[#6b4a18]">{rsvp.attendees.length} pessoa(s)</span>
                    </div>
                    <div className="mt-4 space-y-2 border-t border-[#eee4de] pt-4">
                      {rsvp.attendees.map((attendee, index) => (
                        <div key={`${rsvp.id}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#faf5f1] px-3 py-2.5">
                          <span className="font-medium">{attendee.name}</span>
                          <CategoryBadge category={attendee.category} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#eee4de] pt-4">
                      <p className="text-xs text-[#9a878b]">Confirmado em {formatDateTime(rsvp.createdAt)}</p>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setEditingRsvp({ ...rsvp, attendees: rsvp.attendees.map((item) => ({ ...item })) })} className="h-9 rounded-full border-[#d7c6bb] bg-white text-xs"><Edit3 className="size-3.5" /> Editar</Button>
                        <Button type="button" variant="ghost" onClick={() => void deleteRsvpItem(rsvp)} className="h-9 rounded-full text-xs text-red-700 hover:bg-red-50 hover:text-red-800"><Trash2 className="size-3.5" /> Excluir</Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : tab === "presentes" ? (
          <section className="mt-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#9b722c]">Gerenciamento</p><h2 className="mt-1 font-serif text-3xl font-semibold">Lista de presentes</h2><p className="mt-2 text-sm text-[#806e72]">Você pode enviar foto e adicionar um link de sugestão de compra para cada presente.</p></div>
              <Button type="button" onClick={() => openGiftEditor(emptyGift(data.gifts.length + 1))} className="rounded-full bg-[#7d1f37] text-white hover:bg-[#64172b]"><Plus className="size-4" /> Adicionar presente</Button>
            </div>


            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {data.gifts.map((gift) => {
                const reservation = reservationByGift.get(gift.id);
                return (
                  <article key={gift.id} className="overflow-hidden rounded-[1.6rem] border border-[#dfd0c6] bg-white shadow-sm">
                    <OrganizerGiftCardImage gift={gift} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f3ead8] px-2.5 py-1 text-xs font-bold text-[#6b4a18]">#{gift.order}</span>{reservation ? <span className="rounded-full bg-[#e5f4ea] px-2.5 py-1 text-xs font-bold text-[#24623a]">Reservado</span> : <span className="rounded-full bg-[#f4e7e0] px-2.5 py-1 text-xs font-bold text-[#7d1f37]">Disponível</span>}</div><h3 className="mt-3 font-serif text-xl font-semibold">{gift.name}</h3><p className="mt-2 text-sm leading-6 text-[#806e72]">{gift.description}</p><p className="mt-2 text-sm font-semibold text-[#8c6b34]">{gift.priceHint}</p>{gift.suggestionUrl && <a href={gift.suggestionUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-bold text-[#7d1f37] hover:underline">Abrir link de sugestão ↗</a>}</div>
                        <Button type="button" variant="outline" onClick={() =>
                          openGiftEditor({
                            ...gift,
                            captureSuggestionImage:
                              Boolean(gift.suggestionUrl) && !gift.imageKey && !gift.suggestionImageKey,
                          })
                        } aria-label={`Editar ${gift.name}`} className="h-9 shrink-0 gap-1.5 rounded-full border-[#d7c6bb] bg-white px-3"><Edit3 className="size-4" /><span>Editar</span></Button>
                      </div>
                      {reservation && (
                        <div className="mt-4 rounded-2xl bg-[#f8f3ef] p-4">
                          {role === "admin" ? (
                            <>
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9b722c]">Escolhido por</p>
                              <p className="mt-1 font-semibold">{reservation.guestName}</p>
                              {reservation.guestContact && <p className="mt-1 text-sm text-[#806e72]">{reservation.guestContact}</p>}
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9b722c]">Reserva confirmada</p>
                              <p className="mt-1 text-sm leading-6 text-[#806e72]">Quem escolheu este presente fica oculto para o acesso do aniversariante.</p>
                            </>
                          )}
                          <Button type="button" variant="outline" onClick={() => void releaseReservation(gift)} className="mt-3 h-9 rounded-full border-[#d7c6bb] bg-white text-xs">Liberar reserva</Button>
                        </div>
                      )}
                      <div className="mt-4 flex justify-end">
                        <Button type="button" variant="ghost" onClick={() => void deleteGiftItem(gift)} className="rounded-full text-red-700 hover:bg-red-50 hover:text-red-800"><Trash2 className="size-4" /> Excluir</Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mt-7">
            <div className="mb-5"><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#9b722c]">Convite público</p><h2 className="mt-1 font-serif text-3xl font-semibold">Dados da festa</h2><p className="mt-2 text-sm text-[#806e72]">O que você salvar aqui aparece no convite sem precisar editar o código.</p></div>
            {partyDraft && (
              <div className="space-y-5">
                <form onSubmit={saveParty} className="max-w-4xl rounded-[1.8rem] border border-[#dfd0c6] bg-white p-5 shadow-sm sm:p-7">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Título"><Input value={partyDraft.eventTitle} onChange={(event) => setPartyDraft({ ...partyDraft, eventTitle: event.target.value })} maxLength={100} className="h-11 rounded-xl" /></Field>
                    <Field label="Nome"><Input value={partyDraft.hostName} onChange={(event) => setPartyDraft({ ...partyDraft, hostName: event.target.value })} maxLength={80} className="h-11 rounded-xl" /></Field>
                    <Field label="Data"><Input type="date" value={partyDraft.date} onChange={(event) => setPartyDraft({ ...partyDraft, date: event.target.value })} className="h-11 rounded-xl" /></Field>
                    <Field label="Horário"><Input type="time" value={partyDraft.time} onChange={(event) => setPartyDraft({ ...partyDraft, time: event.target.value })} className="h-11 rounded-xl" /></Field>
                    <Field label="Local"><Input value={partyDraft.locationName} onChange={(event) => setPartyDraft({ ...partyDraft, locationName: event.target.value })} maxLength={120} placeholder="Ex.: Salão de Festas ..." className="h-11 rounded-xl" /></Field>
                    <Field label="Idade"><Input type="number" min={1} max={129} value={partyDraft.age} onChange={(event) => setPartyDraft({ ...partyDraft, age: Number(event.target.value) })} className="h-11 rounded-xl" /></Field>
                    <div className="sm:col-span-2"><Field label="Endereço"><Input value={partyDraft.address} onChange={(event) => setPartyDraft({ ...partyDraft, address: event.target.value })} maxLength={220} placeholder="Rua, número, bairro, cidade" className="h-11 rounded-xl" /></Field></div>
                    <div className="sm:col-span-2"><Field label="Link do Google Maps"><Input type="url" value={partyDraft.mapsUrl} onChange={(event) => setPartyDraft({ ...partyDraft, mapsUrl: event.target.value })} maxLength={500} placeholder="https://maps.app.goo.gl/..." className="h-11 rounded-xl" /></Field></div>
                    <div className="sm:col-span-2"><Field label="Texto do convite"><Textarea value={partyDraft.invitationText} onChange={(event) => setPartyDraft({ ...partyDraft, invitationText: event.target.value })} maxLength={600} rows={4} className="rounded-xl" /></Field></div>
                    <div className="sm:col-span-2"><Field label="Observação da confirmação"><Textarea value={partyDraft.rsvpNote} onChange={(event) => setPartyDraft({ ...partyDraft, rsvpNote: event.target.value })} maxLength={400} rows={3} className="rounded-xl" /></Field></div>
                  </div>
                  <Button type="submit" disabled={savingParty} className="mt-6 h-11 rounded-full bg-[#7d1f37] px-6 text-white hover:bg-[#64172b]"><Save className="size-4" /> {savingParty ? "Salvando…" : "Salvar dados da festa"}</Button>
                </form>

                {role === "admin" && (
                  <form onSubmit={saveBirthdayAccess} className="max-w-4xl rounded-[1.8rem] border border-[#d9c8bd] bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#9b722c]">Acesso do aniversariante</p>
                        <h3 className="mt-1 font-serif text-2xl font-semibold">Criar ou trocar senha</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#806e72]">Somente o administrador pode alterar esta senha. O aniversariante continuará sem acesso aos nomes de quem escolheu os presentes.</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${birthdayConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{birthdayConfigured ? "Senha ativa" : "Sem senha"}</span>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field label="Nova senha do aniversariante"><Input type="password" value={birthdayPassword} onChange={(event) => setBirthdayPassword(event.target.value)} minLength={8} maxLength={128} required autoComplete="new-password" placeholder="Mínimo de 8 caracteres" className="h-11 rounded-xl" /></Field>
                      <Field label="Confirmar nova senha"><Input type="password" value={birthdayPasswordConfirm} onChange={(event) => setBirthdayPasswordConfirm(event.target.value)} minLength={8} maxLength={128} required autoComplete="new-password" placeholder="Digite novamente" className="h-11 rounded-xl" /></Field>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#806e72]">Ao salvar, esta senha passa a valer imediatamente e substitui a senha anterior do aniversariante. Sessões antigas do aniversariante deixam de ser válidas.</p>
                    <Button type="submit" disabled={savingBirthdayPassword} className="mt-5 h-11 rounded-full bg-[#7d1f37] px-6 text-white hover:bg-[#64172b]"><KeyRound className="size-4" /> {savingBirthdayPassword ? "Salvando…" : birthdayConfigured ? "Trocar senha do aniversariante" : "Criar senha do aniversariante"}</Button>
                  </form>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {editingGift && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[#2d1620]/60 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8"
          role="dialog"
          aria-modal="true"
          aria-label={editingGift.id ? `Editar ${editingGift.name}` : "Adicionar presente"}
        >
          <div className="mx-auto w-full max-w-5xl">
            <GiftEditor
              key={editingGift.id ? `gift-modal-${editingGift.id}` : "gift-modal-new"}
              draft={editingGift}
              onChange={setEditingGift}
              onCancel={() => setEditingGift(null)}
              onSubmit={saveGift}
              saving={savingGift}
            />
          </div>
        </div>
      )}

      <Toaster richColors closeButton position="top-center" />
    </main>
  );
}

function OrganizerGiftCardImage({ gift }: { gift: GiftItem }) {
  const [suggestionFailed, setSuggestionFailed] = useState(false);

  useEffect(() => {
    setSuggestionFailed(false);
  }, [gift.suggestionUrl]);

  if (gift.imageKey) {
    return <img key={gift.imageKey} src={`/api/gift-images/${encodeURIComponent(gift.imageKey)}`} alt={`Imagem de ${gift.name}`} className="h-52 w-full object-contain bg-[#f7eee7]" />;
  }

  if (gift.suggestionImageKey) {
    return <img key={gift.suggestionImageKey} src={`/api/gift-images/${encodeURIComponent(gift.suggestionImageKey)}`} alt={`Imagem do anúncio de ${gift.name}`} className="h-52 w-full object-contain bg-[#f7eee7]" />;
  }

  if (gift.suggestionUrl && !suggestionFailed) {
    return (
      <img
        key={gift.suggestionUrl}
        src={`/api/product-image?url=${encodeURIComponent(gift.suggestionUrl)}`}
        alt={`Imagem do anúncio de ${gift.name}`}
        onError={() => setSuggestionFailed(true)}
        className="h-52 w-full object-contain bg-[#f7eee7]"
      />
    );
  }

  return null;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <article className="rounded-[1.5rem] border border-[#dfd0c6] bg-white p-5 shadow-sm"><div className="grid size-10 place-items-center rounded-xl bg-[#f4e7e0] text-[#7d1f37]">{icon}</div><p className="mt-4 text-sm text-[#806e72]">{label}</p><p className="mt-1 font-serif text-3xl font-semibold">{value}</p></article>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-[#4d3036]">{label}<div className="mt-2">{children}</div></label>;
}

function CategoryBadge({ category }: { category: AttendeeCategory }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${category === "child" ? "bg-[#f4e7e0] text-[#7d1f37]" : "bg-[#eee8dc] text-[#6b5634]"}`}>{category === "child" ? <Baby className="size-3.5" /> : <UserRound className="size-3.5" />}{category === "child" ? "Criança" : "Adulto"}</span>;
}

function AttendeeBadge({ attendee }: { attendee: RsvpSubmission["attendees"][number] }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${attendee.category === "child" ? "bg-[#f4e7e0] text-[#7d1f37]" : "bg-[#eee8dc] text-[#6b5634]"}`}>{attendee.category === "child" ? <Baby className="size-3.5" /> : <UserRound className="size-3.5" />}{attendee.name} • {attendee.category === "child" ? "Criança" : "Adulto"}</span>;
}

function RsvpEditor({ draft, onChange, onCancel, onSubmit, saving }: {
  draft: RsvpSubmission;
  onChange: (draft: RsvpSubmission) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  function updateAttendee(index: number, patch: Partial<RsvpSubmission["attendees"][number]>) {
    onChange({ ...draft, attendees: draft.attendees.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  }

  function removeAttendee(index: number) {
    if (draft.attendees.length <= 1) return;
    onChange({ ...draft, attendees: draft.attendees.filter((_, itemIndex) => itemIndex !== index) });
  }

  function addAttendee() {
    if (draft.attendees.length >= 12) return;
    onChange({ ...draft, attendees: [...draft.attendees, { name: "", category: "adult" }] });
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-[1.7rem] border-2 border-[#cdaeb6] bg-[#fffdf9] p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b722c]">Editar confirmação</p><h3 className="mt-1 font-serif text-2xl font-semibold">Convidados de {draft.contactName}</h3></div><Button type="button" variant="ghost" onClick={onCancel} className="rounded-full"><X className="size-4" /></Button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Responsável pelo contato"><Input value={draft.contactName} onChange={(event) => onChange({ ...draft, contactName: event.target.value })} required minLength={2} maxLength={80} className="h-11 rounded-xl" /></Field>
        <Field label="WhatsApp"><Input value={draft.whatsapp} onChange={(event) => onChange({ ...draft, whatsapp: event.target.value })} required minLength={8} maxLength={30} className="h-11 rounded-xl" /></Field>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eee4de] pt-5"><div><p className="font-semibold">Pessoas desta confirmação</p><p className="mt-1 text-xs text-[#806e72]">Cada linha abaixo conta como uma pessoa no painel.</p></div><Button type="button" variant="outline" onClick={addAttendee} disabled={draft.attendees.length >= 12} className="h-9 rounded-full border-[#d7c6bb] bg-white text-xs"><Plus className="size-3.5" /> Adicionar</Button></div>
      <div className="mt-4 space-y-3">
        {draft.attendees.map((attendee, index) => (
          <div key={`${draft.id}-edit-${index}`} className="grid gap-3 rounded-2xl border border-[#e4d6cd] bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Field label={`Pessoa ${index + 1}`}><Input value={attendee.name} onChange={(event) => updateAttendee(index, { name: event.target.value })} required minLength={2} maxLength={80} className="h-10 rounded-xl" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => updateAttendee(index, { category: "adult" })} className={`h-10 rounded-xl border px-3 text-sm font-semibold ${attendee.category === "adult" ? "border-[#7d1f37] bg-[#7d1f37] text-white" : "border-[#d9c8bd] bg-white text-[#654f54]"}`}><UserRound className="mr-1 inline size-4" />Adulto</button>
              <button type="button" onClick={() => updateAttendee(index, { category: "child" })} className={`h-10 rounded-xl border px-3 text-sm font-semibold ${attendee.category === "child" ? "border-[#7d1f37] bg-[#7d1f37] text-white" : "border-[#d9c8bd] bg-white text-[#654f54]"}`}><Baby className="mr-1 inline size-4" />Criança</button>
            </div>
            <Button type="button" variant="ghost" onClick={() => removeAttendee(index)} disabled={draft.attendees.length <= 1} className="h-10 rounded-xl text-red-700 hover:bg-red-50"><Trash2 className="size-4" /></Button>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><Button type="submit" disabled={saving} className="rounded-full bg-[#7d1f37] text-white hover:bg-[#64172b]"><CheckCircle2 className="size-4" /> {saving ? "Salvando…" : "Salvar convidados"}</Button><Button type="button" variant="outline" onClick={onCancel} className="rounded-full border-[#d7c6bb] bg-white">Cancelar</Button></div>
    </form>
  );
}

function GiftEditor({ draft, onChange, onCancel, onSubmit, saving }: {
  draft: GiftDraft;
  onChange: (draft: GiftDraft) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  const [processingImage, setProcessingImage] = useState(false);
  const [suggestionPreviewFailed, setSuggestionPreviewFailed] = useState(false);
  const originalImageKey = useRef(draft.imageKey);

  useEffect(() => {
    setSuggestionPreviewFailed(false);
  }, [draft.suggestionUrl]);

  const suggestionPreviewUrl =
    !draft.imageKey && !draft.suggestionImageKey && draft.suggestionUrl?.trim() && !suggestionPreviewFailed
      ? `/api/product-image?url=${encodeURIComponent(draft.suggestionUrl.trim())}`
      : null;

  async function discardTemporaryImage(imageKey: string | undefined) {
    if (!imageKey || imageKey === originalImageKey.current) return;
    await fetch(`/api/admin/gift-images?key=${encodeURIComponent(imageKey)}`, { method: "DELETE" }).catch(() => undefined);
  }

  async function chooseImage(file: File | undefined) {
    if (!file || processingImage) return;
    setProcessingImage(true);
    try {
      const compressed = await compressGiftImage(file);
      const form = new FormData();
      form.append("file", new File([compressed], "presente.webp", { type: "image/webp" }));
      const response = await fetch("/api/admin/gift-images", { method: "POST", body: form });
      const result = (await response.json()) as { imageKey?: string; error?: string };
      if (!response.ok || !result.imageKey) {
        throw new Error(result.error ?? "Não foi possível enviar a imagem.");
      }
      const previousKey = draft.imageKey;
      onChange({ ...draft, imageKey: result.imageKey, captureSuggestionImage: false });
      await discardTemporaryImage(previousKey);
      toast.success("Imagem enviada. Agora salve o presente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível preparar a imagem.");
    } finally {
      setProcessingImage(false);
    }
  }

  async function removeImage() {
    const currentKey = draft.imageKey;
    onChange({
      ...draft,
      imageKey: undefined,
      captureSuggestionImage: Boolean(draft.suggestionUrl?.trim()) && !draft.suggestionImageKey,
    });
    await discardTemporaryImage(currentKey);
  }

  async function cancelEditor() {
    await discardTemporaryImage(draft.imageKey);
    onCancel();
  }

  return (
    <form onSubmit={onSubmit} className="mb-5 rounded-[1.7rem] border-2 border-[#cdaeb6] bg-[#fffdf9] p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b722c]">{draft.id ? "Editar item" : "Novo item"}</p><h3 className="mt-1 font-serif text-2xl font-semibold">{draft.id ? draft.name : "Adicionar presente"}</h3></div><Button type="button" variant="ghost" onClick={() => void cancelEditor()} className="rounded-full"><X className="size-4" /></Button></div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div>
          <p className="text-sm font-semibold text-[#4d3036]">Imagem sugerida</p>
          <div className="mt-2 overflow-hidden rounded-2xl border border-dashed border-[#cdb8ab] bg-white">
            {draft.imageKey ? (
              <div>
                <div className="relative">
                  <img key={draft.imageKey} src={`/api/gift-images/${encodeURIComponent(draft.imageKey)}`} alt="Prévia do presente" className="h-48 w-full object-contain bg-[#f7eee7]" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#7d1f37] shadow-sm">Foto manual</span>
                </div>
                <div className="flex gap-2 p-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d7c6bb] bg-white px-3 py-2 text-xs font-bold"><ImagePlus className="size-3.5" /> {processingImage ? "Enviando…" : "Trocar"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={processingImage} onChange={(event) => void chooseImage(event.target.files?.[0])} /></label>
                  <Button type="button" variant="ghost" disabled={processingImage} onClick={() => void removeImage()} className="h-8 rounded-full px-3 text-xs text-red-700 hover:bg-red-50">Remover</Button>
                </div>
              </div>
            ) : draft.suggestionImageKey ? (
              <div>
                <div className="relative">
                  <img
                    key={draft.suggestionImageKey}
                    src={`/api/gift-images/${encodeURIComponent(draft.suggestionImageKey)}`}
                    alt="Imagem capturada do anúncio"
                    className="h-48 w-full object-contain bg-[#f7eee7]"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#6b4a18] shadow-sm">Imagem do link</span>
                </div>
                <div className="p-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d7c6bb] bg-white px-3 py-2 text-xs font-bold"><ImagePlus className="size-3.5" /> {processingImage ? "Enviando…" : "Usar foto manual"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={processingImage} onChange={(event) => void chooseImage(event.target.files?.[0])} /></label>
                  <p className="mt-2 text-[11px] leading-4 text-[#806e72]">Imagem capturada automaticamente do link. Uma foto manual sempre terá prioridade.</p>
                </div>
              </div>
            ) : suggestionPreviewUrl ? (
              <div>
                <div className="relative">
                  <img
                    key={draft.suggestionUrl}
                    src={suggestionPreviewUrl}
                    alt="Imagem automática do anúncio"
                    onError={() => setSuggestionPreviewFailed(true)}
                    className="h-48 w-full object-contain bg-[#f7eee7]"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#6b4a18] shadow-sm">Imagem do link</span>
                </div>
                <div className="p-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d7c6bb] bg-white px-3 py-2 text-xs font-bold"><ImagePlus className="size-3.5" /> {processingImage ? "Enviando…" : "Usar foto manual"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={processingImage} onChange={(event) => void chooseImage(event.target.files?.[0])} /></label>
                  <p className="mt-2 text-[11px] leading-4 text-[#806e72]">Esta imagem vem do anúncio. Se enviar uma foto manual, ela passa a ter prioridade.</p>
                </div>
              </div>
            ) : (
              <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 p-5 text-center text-[#806e72] hover:bg-[#fffaf5]">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#f4e7e0] text-[#7d1f37]"><ImagePlus className="size-5" /></span>
                <span className="text-sm font-semibold">{processingImage ? "Enviando imagem…" : "Enviar foto do presente"}</span>
                <span className="text-xs leading-5">{draft.suggestionUrl && suggestionPreviewFailed ? "Não foi possível ler a imagem desse anúncio. Você pode enviar uma foto manual." : "JPG, PNG ou WEBP. Se não enviar foto e houver um link válido, a imagem do anúncio será usada automaticamente."}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={processingImage} onChange={(event) => void chooseImage(event.target.files?.[0])} />
              </label>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do presente"><Input value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} required minLength={2} maxLength={120} className="h-11 rounded-xl" /></Field>
          <Field label="Ordem"><Input type="number" min={1} value={draft.order} onChange={(event) => onChange({ ...draft, order: Number(event.target.value) })} className="h-11 rounded-xl" /></Field>
          <div className="sm:col-span-2"><Field label="Descrição"><Textarea value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} maxLength={500} rows={3} className="rounded-xl" /></Field></div>
          <Field label="Observação curta"><Input value={draft.priceHint} onChange={(event) => onChange({ ...draft, priceHint: event.target.value })} maxLength={100} placeholder="Ex.: Tamanho M" className="h-11 rounded-xl" /></Field>
          <Field label="Ícone"><select value={draft.icon} onChange={(event) => onChange({ ...draft, icon: event.target.value as GiftIcon })} className="h-11 w-full rounded-xl border border-[#d8c5b8] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#a96b7b]">{GIFT_ICONS.map((icon) => <option key={icon} value={icon}>{iconLabels[icon]}</option>)}</select></Field>
          <div className="sm:col-span-2">
            <Field label="Link de sugestão (opcional)">
              <Input
                type="text"
                inputMode="url"
                value={draft.suggestionUrl ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  onChange({
                    ...draft,
                    suggestionUrl: nextValue || undefined,
                    suggestionImageKey: undefined,
                    captureSuggestionImage: Boolean(nextValue.trim()),
                  });
                }}
                maxLength={1000}
                placeholder="https://loja.com/produto ou shopee.com.br/..."
                className="h-11 rounded-xl"
              />
            </Field>
            <div className="mt-2">
              <p className="text-xs leading-5 text-[#806e72]">
                {draft.suggestionUrl
                  ? "Sem foto manual, a imagem principal deste anúncio será exibida automaticamente no card do presente. A foto enviada manualmente sempre tem prioridade."
                  : "Se deixar vazio, o convidado poderá pesquisar este presente na Shopee ou no Mercado Livre."}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><Button type="submit" disabled={saving || processingImage} className="rounded-full bg-[#7d1f37] text-white hover:bg-[#64172b]"><CheckCircle2 className="size-4" /> {saving ? "Salvando…" : "Salvar presente"}</Button><Button type="button" variant="outline" onClick={() => void cancelEditor()} className="rounded-full border-[#d7c6bb] bg-white">Cancelar</Button></div>
    </form>
  );
}

async function compressGiftImage(file: File): Promise<Blob> {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    throw new Error("Escolha uma imagem JPG, PNG ou WEBP.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("A imagem original deve ter no máximo 10 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível abrir essa imagem."));
      img.src = objectUrl;
    });

    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Seu navegador não conseguiu preparar a imagem.");
    context.drawImage(image, 0, 0, width, height);

    let quality = 0.82;
    let blob = await canvasToWebp(canvas, quality);
    while (blob.size > 1_300_000 && quality > 0.46) {
      quality -= 0.08;
      blob = await canvasToWebp(canvas, quality);
    }
    if (blob.size > 1_500_000) {
      throw new Error("Essa imagem ficou grande demais. Escolha outra foto ou recorte-a antes de enviar.");
    }
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Não foi possível converter a imagem."));
      else resolve(blob);
    }, "image/webp", quality);
  });
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" });
  } catch {
    return value;
  }
}
