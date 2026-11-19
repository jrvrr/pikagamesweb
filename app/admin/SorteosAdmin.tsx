"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gift,
  Heart,
  AtSign,
  Link2,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Ticket,
  Trash2,
  Trophy,
  Upload,
  Users,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  estadoLabel,
  estadoTone,
  formatFecha,
  money,
  publicacionMetrica,
  toLocalInput,
  type Sorteo,
  type SorteoPublicacion,
} from "@/lib/sorteos";

type FormState = {
  titulo: string;
  descripcion: string;
  premio: string;
  imagen_url: string;
  tipo: "instagram" | "boletos";
  criterio_comparacion: "comentarios" | "likes";
  num_ganadores: string;
  fecha_sorteo: string;
  reglas: string;
  precio_boleto: string;
  boletos_max: string;
  publicado: boolean;
  programar: boolean;
};

const emptyForm: FormState = {
  titulo: "",
  descripcion: "",
  premio: "",
  imagen_url: "",
  tipo: "instagram",
  criterio_comparacion: "comentarios",
  num_ganadores: "1",
  fecha_sorteo: "",
  reglas: "",
  precio_boleto: "",
  boletos_max: "",
  publicado: false,
  programar: false,
};

const formFromSorteo = (sorteo: Sorteo): FormState => ({
  titulo: sorteo.titulo,
  descripcion: sorteo.descripcion || "",
  premio: sorteo.premio || "",
  imagen_url: sorteo.imagen_url || "",
  tipo: sorteo.tipo,
  criterio_comparacion: sorteo.criterio_comparacion,
  num_ganadores: String(sorteo.num_ganadores),
  fecha_sorteo: toLocalInput(sorteo.fecha_sorteo),
  reglas: sorteo.reglas || "",
  precio_boleto: sorteo.precio_boleto || "",
  boletos_max: sorteo.boletos_max ? String(sorteo.boletos_max) : "",
  publicado: sorteo.publicado,
  programar: sorteo.estado === "programado",
});

const payloadFromForm = (form: FormState) => ({
  titulo: form.titulo.trim(),
  descripcion: form.descripcion.trim() || null,
  premio: form.premio.trim() || null,
  imagen_url: form.imagen_url.trim() || null,
  tipo: form.tipo,
  criterio_comparacion: form.criterio_comparacion,
  num_ganadores: Number(form.num_ganadores),
  fecha_sorteo: form.programar && form.fecha_sorteo ? new Date(form.fecha_sorteo).toISOString() : null,
  reglas: form.reglas.trim() || null,
  precio_boleto: form.tipo === "boletos" ? Number(form.precio_boleto) : null,
  boletos_max: form.tipo === "boletos" && form.boletos_max ? Number(form.boletos_max) : null,
  publicado: form.programar ? true : form.publicado,
});

export function SorteosAdmin({ onOpenGanadores }: { onOpenGanadores: () => void }) {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [provider, setProvider] = useState("manual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Sorteo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [urlInput, setUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [importPub, setImportPub] = useState<string | null>(null);
  const [importForm, setImportForm] = useState({ likes: "", comentarios: "", texto: "" });
  const [importBusy, setImportBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/sorteos/admin");
      setSorteos(Array.isArray(data?.sorteos) ? data.sorteos : []);
      setProvider(data?.provider || "manual");
    } catch {
      setError("No se pudieron cargar los sorteos. Verifica tu sesión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const refreshDraft = useCallback(async (id: string) => {
    const data = await apiFetch(`/sorteos/admin/${id}`);
    const sorteo = data?.sorteo as Sorteo | undefined;
    if (!sorteo) return null;
    setDraft(sorteo);
    setForm((current) => ({ ...formFromSorteo(sorteo), ...current, titulo: current.titulo || sorteo.titulo }));
    setSorteos((current) => current.map((item) => item.id === sorteo.id ? sorteo : item));
    return sorteo;
  }, []);

  const startNew = () => {
    setDraft(null);
    setForm(emptyForm);
    setUrlInput("");
    setStep(1);
    setWizardOpen(true);
    setError("");
    setNotice("");
  };

  const startEdit = async (sorteo: Sorteo) => {
    setError("");
    setNotice("");
    setWizardOpen(true);
    setStep(1);
    setDraft(sorteo);
    setForm(formFromSorteo(sorteo));
    setUrlInput("");
    try {
      await refreshDraft(sorteo.id);
    } catch {
      setError("No se pudo cargar el detalle del sorteo.");
    }
  };

  const ensureDraft = async () => {
    if (draft) return draft;
    const created = await apiFetch("/sorteos/admin", {
      method: "POST",
      body: JSON.stringify({
        titulo: form.titulo.trim() || "Sorteo express",
        tipo: form.tipo,
        criterio_comparacion: form.criterio_comparacion,
        num_ganadores: Number(form.num_ganadores) || 1,
      }),
    });
    const sorteo = created?.sorteo as Sorteo | undefined;
    if (!sorteo) throw new Error("No se pudo crear el sorteo");
    setDraft(sorteo);
    setSorteos((current) => [sorteo, ...current]);
    setForm((current) => ({ ...current, titulo: current.titulo || sorteo.titulo }));
    return sorteo;
  };

  const goToConfig = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await ensureDraft();
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el sorteo.");
    } finally {
      setBusy(false);
    }
  };

  const addUrl = async () => {
    if (!urlInput.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const sorteo = await ensureDraft();
      const result = await apiFetch(`/sorteos/admin/${sorteo.id}/publicaciones`, {
        method: "POST",
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      setUrlInput("");
      if (result?.warning) setNotice(result.warning);
      await refreshDraft(sorteo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar la URL.");
    } finally {
      setBusy(false);
    }
  };

  const removePublication = async (publicacion: SorteoPublicacion) => {
    if (!draft) return;
    if (!window.confirm("¿Quitar esta publicación del sorteo?")) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/sorteos/admin/${draft.id}/publicaciones/${publicacion.id}`, { method: "DELETE" });
      await refreshDraft(draft.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar la publicación.");
    } finally {
      setBusy(false);
    }
  };

  const syncPublication = async (publicacion: SorteoPublicacion) => {
    if (!draft) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiFetch(`/sorteos/admin/${draft.id}/publicaciones/${publicacion.id}/sincronizar`, { method: "POST" });
      setNotice(`Sincronizado con ${result?.provider || "Instagram"}: ${result?.participantes_nuevos ?? 0} participantes nuevos.`);
      await refreshDraft(draft.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo sincronizar la publicación.");
    } finally {
      setBusy(false);
    }
  };

  const syncAll = async () => {
    if (!draft) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiFetch(`/sorteos/admin/${draft.id}/sincronizar`, { method: "POST" });
      const nuevos = (result?.resultados || []).reduce((sum: number, item: { participantes_nuevos?: number }) => sum + (item.participantes_nuevos || 0), 0);
      const fallidos = (result?.resultados || []).filter((item: { ok?: boolean }) => item.ok === false);
      setNotice(`Sincronización terminada: ${nuevos} participantes nuevos${fallidos.length ? `, ${fallidos.length} publicaciones con error` : ""}.`);
      await refreshDraft(draft.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron sincronizar las publicaciones.");
    } finally {
      setBusy(false);
    }
  };

  const importar = async (publicacion: SorteoPublicacion) => {
    if (!draft) return;
    setImportBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiFetch(`/sorteos/admin/${draft.id}/publicaciones/${publicacion.id}/importar`, {
        method: "POST",
        body: JSON.stringify({
          likes: importForm.likes === "" ? undefined : Number(importForm.likes),
          comentarios: importForm.comentarios === "" ? undefined : Number(importForm.comentarios),
          texto: importForm.texto,
        }),
      });
      setNotice(`Importación lista: ${result?.participantes_nuevos ?? 0} participantes nuevos de ${result?.participantes_recibidos ?? 0} recibidos.`);
      setImportPub(null);
      setImportForm({ likes: "", comentarios: "", texto: "" });
      await refreshDraft(draft.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron importar los datos.");
    } finally {
      setImportBusy(false);
    }
  };

  const saveConfig = async (options: { publicar?: boolean; irAPaso3?: boolean } = {}) => {
    if (!draft) {
      setError("Agrega al menos una URL de publicación para crear el sorteo.");
      return;
    }
    if (!form.titulo.trim()) {
      setError("Escribe un título para el sorteo.");
      return;
    }
    if (form.tipo === "boletos" && (!Number(form.precio_boleto) || Number(form.precio_boleto) <= 0)) {
      setError("Indica el precio del boleto.");
      return;
    }
    if (form.tipo === "instagram" && (draft.publicaciones?.length || 0) === 0) {
      setError("Agrega al menos una publicación de Instagram para el sorteo gratis.");
      return;
    }
    if (form.programar && !form.fecha_sorteo) {
      setError("Indica la fecha y hora para programar el sorteo.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = { ...payloadFromForm(form), ...(options.publicar ? { publicado: true } : {}) };
      const result = await apiFetch(`/sorteos/admin/${draft.id}`, { method: "PUT", body: JSON.stringify(payload) });
      const updated = result?.sorteo as Sorteo | undefined;
      if (updated) {
        setDraft(updated);
        setForm(formFromSorteo(updated));
        setSorteos((current) => current.map((item) => item.id === updated.id ? updated : item));
      }
      if (options.publicar) {
        setNotice("Sorteo publicado en /rifas.");
        setWizardOpen(false);
      } else if (options.irAPaso3) {
        setStep(3);
      } else {
        setNotice("Cambios guardados.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
    } finally {
      setBusy(false);
    }
  };

  const removeSorteo = async (sorteo: Sorteo) => {
    if (!window.confirm(`¿Eliminar el sorteo "${sorteo.titulo}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/sorteos/admin/${sorteo.id}`, { method: "DELETE" });
      setSorteos((current) => current.filter((item) => item.id !== sorteo.id));
      if (draft?.id === sorteo.id) setWizardOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el sorteo.");
    } finally {
      setBusy(false);
    }
  };

  const participantesPorPublicacion = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of draft?.participantes_por_publicacion || []) {
      map.set(item.publicacion_id, item.total);
    }
    if (map.size === 0) {
      for (const participante of draft?.participantes || []) {
        if (!participante.publicacion_id) continue;
        map.set(participante.publicacion_id, (map.get(participante.publicacion_id) || 0) + 1);
      }
    }
    return map;
  }, [draft]);

  const maxMetrica = useMemo(() => {
    if (!draft) return 0;
    return Math.max(0, ...draft.publicaciones.map((publicacion) => publicacionMetrica(publicacion, form.criterio_comparacion)));
  }, [draft, form.criterio_comparacion]);

  return <div className="space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#ffd90f]">Sorteos express</p>
        <h2 className="mt-1 text-2xl font-black text-white">Publicaciones y rifas</h2>
        <p className="mt-1 text-sm text-zinc-400">Agrega una o más URLs de Instagram, compara su interacción y sortea entre todos los participantes.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
          provider === "manual" ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
        )}>
          <AtSign className="size-3.5" />
          {provider === "manual" ? "Modo manual" : `Instagram: ${provider}`}
        </span>
        <button type="button" onClick={startNew} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ffd90f] px-4 text-sm font-bold text-zinc-950 hover:bg-[#e5c30d]">
          <Plus className="size-4" /> Nuevo sorteo
        </button>
      </div>
    </header>

    {error && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Cerrar error" className="rounded p-1 hover:bg-rose-400/10"><X className="size-4" /></button></div>}
    {notice && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-sky-400/30 bg-sky-400/10 p-4 text-sm text-sky-100"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Cerrar aviso" className="rounded p-1 hover:bg-sky-400/10"><X className="size-4" /></button></div>}

    {provider === "manual" && <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
      <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" /> Lectura automática de Instagram desactivada</p>
      <p className="mt-2 text-amber-100/80">Instagram no permite leer comentarios y likes sin una API. Puedes pegar los datos manualmente en cada publicación, o configurar <code className="rounded bg-black/30 px-1">APIFY_TOKEN</code> (posts públicos) o <code className="rounded bg-black/30 px-1">INSTAGRAM_ACCESS_TOKEN</code> + <code className="rounded bg-black/30 px-1">INSTAGRAM_BUSINESS_ID</code> (solo tu cuenta) en el backend.</p>
    </div>}

    {wizardOpen && <SorteoWizard
      step={step}
      setStep={setStep}
      draft={draft}
      form={form}
      setForm={setForm}
      urlInput={urlInput}
      setUrlInput={setUrlInput}
      busy={busy}
      provider={provider}
      importPub={importPub}
      setImportPub={setImportPub}
      importForm={importForm}
      setImportForm={setImportForm}
      importBusy={importBusy}
      participantesPorPublicacion={participantesPorPublicacion}
      maxMetrica={maxMetrica}
      onAddUrl={addUrl}
      onRemovePublication={removePublication}
      onSyncPublication={syncPublication}
      onSyncAll={syncAll}
      onImport={importar}
      onSave={saveConfig}
      onNextStep1={goToConfig}
      onClose={() => setWizardOpen(false)}
      onOpenGanadores={onOpenGanadores}
    />}

    <section aria-labelledby="lista-sorteos" className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-4 sm:p-5">
        <div>
          <h3 id="lista-sorteos" className="text-lg font-bold text-white">Sorteos creados</h3>
          <p className="mt-1 text-sm text-zinc-400">{loading ? "Cargando…" : `${sorteos.length} sorteo${sorteos.length === 1 ? "" : "s"}`}</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Actualizar
        </button>
      </div>

      {loading ? <div className="space-y-3 p-4"><div className="h-24 animate-pulse rounded-xl bg-zinc-800" /><div className="h-24 animate-pulse rounded-xl bg-zinc-800" /></div>
        : sorteos.length === 0 ? <div className="p-10 text-center"><Gift className="mx-auto size-9 text-zinc-600" /><p className="mt-3 text-sm text-zinc-400">Todavía no hay sorteos. Crea el primero con “Nuevo sorteo”.</p></div>
        : <ul className="divide-y divide-zinc-800">{sorteos.map((sorteo) => <li key={sorteo.id} className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate font-bold text-white">{sorteo.titulo}</h4>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", estadoTone[sorteo.estado])}>{estadoLabel[sorteo.estado]}</span>
                <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{sorteo.tipo === "boletos" ? "Boletos" : "Instagram"}</span>
                {sorteo.publicado && <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">Visible en /rifas</span>}
              </div>
              <p className="mt-2 text-sm text-zinc-400">{sorteo.publicaciones.length} publicación{sorteo.publicaciones.length === 1 ? "" : "es"} · {sorteo.tipo === "boletos" ? `${sorteo.boletos_pagados} boletos pagados` : `${sorteo.total_participantes} participantes`} · {sorteo.num_ganadores} ganador{sorteo.num_ganadores === 1 ? "" : "es"}</p>
              <p className="mt-1 text-xs text-zinc-500">{sorteo.fecha_sorteo ? `Sorteo: ${formatFecha(sorteo.fecha_sorteo)}` : "Sin fecha programada"}{sorteo.tipo === "boletos" ? ` · ${money(sorteo.precio_boleto)} por boleto` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void startEdit(sorteo)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"><Pencil className="size-4" /> Editar</button>
              {sorteo.publicado && <a href={`/rifas/${sorteo.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"><ExternalLink className="size-4" /> Ver</a>}
              <button type="button" onClick={onOpenGanadores} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"><Trophy className="size-4" /> Ganadores</button>
              <button type="button" onClick={() => void removeSorteo(sorteo)} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-400/30 px-3 text-sm font-semibold text-rose-200 hover:bg-rose-400/10 disabled:opacity-60"><Trash2 className="size-4" /> Eliminar</button>
            </div>
          </div>
        </li>)}</ul>}
    </section>
  </div>;
}

function SorteoWizard({
  step,
  setStep,
  draft,
  form,
  setForm,
  urlInput,
  setUrlInput,
  busy,
  provider,
  importPub,
  setImportPub,
  importForm,
  setImportForm,
  importBusy,
  participantesPorPublicacion,
  maxMetrica,
  onAddUrl,
  onRemovePublication,
  onSyncPublication,
  onSyncAll,
  onImport,
  onSave,
  onNextStep1,
  onClose,
  onOpenGanadores,
}: {
  step: number;
  setStep: (step: number) => void;
  draft: Sorteo | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  urlInput: string;
  setUrlInput: (value: string) => void;
  busy: boolean;
  provider: string;
  importPub: string | null;
  setImportPub: (id: string | null) => void;
  importForm: { likes: string; comentarios: string; texto: string };
  setImportForm: React.Dispatch<React.SetStateAction<{ likes: string; comentarios: string; texto: string }>>;
  importBusy: boolean;
  participantesPorPublicacion: Map<string, number>;
  maxMetrica: number;
  onAddUrl: () => Promise<void>;
  onRemovePublication: (publicacion: SorteoPublicacion) => Promise<void>;
  onSyncPublication: (publicacion: SorteoPublicacion) => Promise<void>;
  onSyncAll: () => Promise<void>;
  onImport: (publicacion: SorteoPublicacion) => Promise<void>;
  onSave: (options?: { publicar?: boolean; irAPaso3?: boolean }) => Promise<void>;
  onNextStep1: () => Promise<void>;
  onClose: () => void;
  onOpenGanadores: () => void;
}) {
  const publicaciones = draft?.publicaciones || [];
  const totalParticipantes = draft?.total_participantes ?? 0;

  return <section aria-labelledby="wizard-title" className="rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
    <div className="flex items-center justify-between gap-3 border-b border-zinc-800 p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#ffd90f]">{draft ? "Editando sorteo" : "Nuevo sorteo"}</p>
        <h3 id="wizard-title" className="mt-1 text-lg font-bold text-white">{form.titulo || "Sorteo express"}</h3>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Cerrar asistente"><X className="size-4" /></button>
    </div>

    <ol className="grid grid-cols-3 gap-1 px-4 pt-4 sm:px-6">
      {["Elige el post", "Configura el sorteo", "Revisa y publica"].map((label, index) => {
        const number = index + 1;
        return <li key={label} className="min-w-0">
          <button type="button" onClick={() => { if (number < step || draft) setStep(number); }} className="w-full text-left">
            <span className={cn("block h-1 rounded-full", number <= step ? "bg-[#ffd90f]" : "bg-zinc-700")} />
            <span className={cn("mt-2 block truncate text-xs font-semibold", number === step ? "text-white" : "text-zinc-500")}>{number}. {label}</span>
          </button>
        </li>;
      })}
    </ol>

    <div className="p-4 sm:p-6">
      {step === 1 && <div className="space-y-4">
        <div>
          <label htmlFor="url-post" className="mb-1.5 block text-sm font-semibold text-zinc-300">URL del post</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input id="url-post" value={urlInput} onChange={(event) => setUrlInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void onAddUrl(); } }} placeholder="https://www.instagram.com/p/..." className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:border-[#ffd90f] focus:outline-none" />
            </div>
            <button type="button" onClick={() => void onAddUrl()} disabled={busy || !urlInput.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffd90f] px-5 text-sm font-bold text-zinc-950 hover:bg-[#e5c30d] disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Agregar URL
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Puedes agregar 1 o más publicaciones. Los comentarios de todas se unen y los usuarios repetidos cuentan una sola vez. Si tu rifa se vende con boletos, puedes continuar sin publicaciones.</p>
        </div>

        {publicaciones.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-sm text-zinc-300"><strong className="text-white">{publicaciones.length}</strong> publicación{publicaciones.length === 1 ? "" : "es"} · <strong className="text-white">{totalParticipantes}</strong> participantes únicos</p>
          <button type="button" onClick={() => void onSyncAll()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"><RefreshCw className={cn("size-4", busy && "animate-spin")} /> Sincronizar todo</button>
        </div>}

        <div className="space-y-3">
          {publicaciones.map((publicacion) => {
            const participantes = participantesPorPublicacion.get(publicacion.id) || 0;
            const esMaxima = publicacionMetrica(publicacion, form.criterio_comparacion) === maxMetrica && maxMetrica > 0;
            return <article key={publicacion.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                  {publicacion.imagen_url ? <img src={publicacion.imagen_url} alt="" className="h-full w-full object-cover" /> : <AtSign className="size-8 text-zinc-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-white">@{publicacion.autor || publicacion.shortcode || "instagram"}</p>
                    {esMaxima && <span className="rounded-full bg-[#ffd90f] px-2 py-0.5 text-[10px] font-black uppercase text-zinc-950">Mayor {form.criterio_comparacion}</span>}
                    {publicacion.provider && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{publicacion.provider}</span>}
                  </div>
                  <a href={publicacion.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-zinc-500 underline underline-offset-2 hover:text-[#ffd90f]">{publicacion.url}</a>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-300">
                    <span className="inline-flex items-center gap-1"><Heart className="size-3.5 text-rose-300" /> {publicacion.likes.toLocaleString("es-MX")}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5 text-sky-300" /> {publicacion.comentarios.toLocaleString("es-MX")}</span>
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5 text-emerald-300" /> {participantes}</span>
                    <span className="text-zinc-500">{publicacion.ultima_sincronizacion ? `Actualizado ${formatFecha(publicacion.ultima_sincronizacion)}` : "Sin sincronizar"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col">
                  <button type="button" onClick={() => void onSyncPublication(publicacion)} disabled={busy} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"><RefreshCw className="size-3.5" /> Sincronizar</button>
                  <button type="button" onClick={() => { setImportPub(importPub === publicacion.id ? null : publicacion.id); setImportForm({ likes: String(publicacion.likes || ""), comentarios: String(publicacion.comentarios || ""), texto: "" }); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"><Upload className="size-3.5" /> Importar</button>
                  <button type="button" onClick={() => void onRemovePublication(publicacion)} disabled={busy} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-400/30 px-2.5 text-xs font-semibold text-rose-200 hover:bg-rose-400/10 disabled:opacity-60"><Trash2 className="size-3.5" /> Quitar</button>
                </div>
              </div>

              {importPub === publicacion.id && <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs font-semibold text-zinc-300">Importar datos manualmente</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-zinc-400">Likes
                    <input inputMode="numeric" value={importForm.likes} onChange={(event) => setImportForm((current) => ({ ...current, likes: event.target.value.replace(/[^\d]/g, "") }))} className="mt-1 min-h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-[#ffd90f] focus:outline-none" />
                  </label>
                  <label className="text-xs text-zinc-400">Comentarios
                    <input inputMode="numeric" value={importForm.comentarios} onChange={(event) => setImportForm((current) => ({ ...current, comentarios: event.target.value.replace(/[^\d]/g, "") }))} className="mt-1 min-h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-[#ffd90f] focus:outline-none" />
                  </label>
                </div>
                <label className="mt-2 block text-xs text-zinc-400">Participantes (uno por línea: <code>@usuario | comentario</code>)
                  <textarea value={importForm.texto} onChange={(event) => setImportForm((current) => ({ ...current, texto: event.target.value }))} rows={4} placeholder={"@juan | Quiero participar\n@maria | 🎉🎮"} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-white placeholder-zinc-600 focus:border-[#ffd90f] focus:outline-none" />
                </label>
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setImportPub(null)} className="min-h-9 rounded-lg border border-zinc-700 px-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800">Cancelar</button>
                  <button type="button" onClick={() => void onImport(publicacion)} disabled={importBusy} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#ffd90f] px-3 text-xs font-bold text-zinc-950 hover:bg-[#e5c30d] disabled:opacity-60">{importBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Guardar datos</button>
                </div>
              </div>}
            </article>;
          })}
        </div>

        {publicaciones.length > 0 && <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[520px] text-left text-sm">
            <caption className="sr-only">Comparativa de publicaciones</caption>
            <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Publicación</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Likes</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Comentarios</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Participantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {publicaciones.map((publicacion) => {
                const metrica = publicacionMetrica(publicacion, form.criterio_comparacion);
                return <tr key={publicacion.id} className={cn(metrica === maxMetrica && maxMetrica > 0 && "bg-[#ffd90f]/5")}>
                  <th scope="row" className="max-w-[240px] truncate px-3 py-2 font-medium text-zinc-200">@{publicacion.autor || publicacion.shortcode}</th>
                  <td className={cn("px-3 py-2 text-right tabular-nums", form.criterio_comparacion === "likes" ? "font-bold text-white" : "text-zinc-300")}>{publicacion.likes.toLocaleString("es-MX")}</td>
                  <td className={cn("px-3 py-2 text-right tabular-nums", form.criterio_comparacion === "comentarios" ? "font-bold text-white" : "text-zinc-300")}>{publicacion.comentarios.toLocaleString("es-MX")}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-200">{participantesPorPublicacion.get(publicacion.id) || 0}</td>
                </tr>;
              })}
            </tbody>
            <tfoot className="bg-zinc-950 text-xs text-zinc-400">
              <tr>
                <th scope="row" className="px-3 py-2 text-left font-semibold">Total</th>
                <td className="px-3 py-2 text-right tabular-nums">{publicaciones.reduce((sum, item) => sum + item.likes, 0).toLocaleString("es-MX")}</td>
                <td className="px-3 py-2 text-right tabular-nums">{publicaciones.reduce((sum, item) => sum + item.comentarios, 0).toLocaleString("es-MX")}</td>
                <td className="px-3 py-2 text-right tabular-nums text-emerald-200">{totalParticipantes}</td>
              </tr>
            </tfoot>
          </table>
        </div>}

        {provider === "manual" && <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100/80">Modo manual: usa “Importar” para pegar likes, comentarios y usuarios. Para automatizarlo configura un proveedor de Instagram en el backend.</p>}
      </div>}

      {step === 2 && <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-zinc-300 sm:col-span-2">Título del sorteo *
            <input value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} placeholder="Sorteo de @pika.switch" className="mt-1 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white placeholder-zinc-600 focus:border-[#ffd90f] focus:outline-none" />
          </label>
          <label className="block text-sm text-zinc-300">Número de ganadores
            <input inputMode="numeric" value={form.num_ganadores} onChange={(event) => setForm((current) => ({ ...current, num_ganadores: event.target.value.replace(/[^\d]/g, "") }))} className="mt-1 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-[#ffd90f] focus:outline-none" />
          </label>
          <label className="block text-sm text-zinc-300">Comparar publicaciones por
            <select value={form.criterio_comparacion} onChange={(event) => setForm((current) => ({ ...current, criterio_comparacion: event.target.value as FormState["criterio_comparacion"] }))} className="mt-1 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-[#ffd90f] focus:outline-none">
              <option value="comentarios">Comentarios</option>
              <option value="likes">Likes</option>
            </select>
          </label>
          <label className="block text-sm text-zinc-300 sm:col-span-2">Premio
            <input value={form.premio} onChange={(event) => setForm((current) => ({ ...current, premio: event.target.value }))} placeholder="Ej. Juego digital para Nintendo Switch" className="mt-1 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white placeholder-zinc-600 focus:border-[#ffd90f] focus:outline-none" />
          </label>
          <label className="block text-sm text-zinc-300 sm:col-span-2">Imagen del premio (URL)
            <input value={form.imagen_url} onChange={(event) => setForm((current) => ({ ...current, imagen_url: event.target.value }))} placeholder="https://..." className="mt-1 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white placeholder-zinc-600 focus:border-[#ffd90f] focus:outline-none" />
          </label>
          <label className="block text-sm text-zinc-300 sm:col-span-2">Descripción
            <textarea value={form.descripcion} onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white focus:border-[#ffd90f] focus:outline-none" />
          </label>
          <label className="block text-sm text-zinc-300 sm:col-span-2">Bases del sorteo
            <textarea value={form.reglas} onChange={(event) => setForm((current) => ({ ...current, reglas: event.target.value }))} rows={3} placeholder="Ej. Debes seguir la cuenta, dar like y comentar. Un comentario por persona." className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white placeholder-zinc-600 focus:border-[#ffd90f] focus:outline-none" />
          </label>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm font-semibold text-zinc-300">Modalidad del sorteo</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setForm((current) => ({ ...current, tipo: "instagram" }))} className={cn("rounded-xl border p-3 text-left", form.tipo === "instagram" ? "border-[#ffd90f] bg-[#ffd90f]/5" : "border-zinc-700 hover:bg-zinc-900")}>
              <span className="flex items-center gap-2 text-sm font-bold text-white"><AtSign className="size-4" /> Gratis por comentarios</span>
              <span className="mt-1 block text-xs text-zinc-400">Los participantes salen de los comentarios importados o sincronizados.</span>
            </button>
            <button type="button" onClick={() => setForm((current) => ({ ...current, tipo: "boletos" }))} className={cn("rounded-xl border p-3 text-left", form.tipo === "boletos" ? "border-[#ffd90f] bg-[#ffd90f]/5" : "border-zinc-700 hover:bg-zinc-900")}>
              <span className="flex items-center gap-2 text-sm font-bold text-white"><Ticket className="size-4" /> Rifa con boletos de pago</span>
              <span className="mt-1 block text-xs text-zinc-400">Se venden boletos numerados en /rifas y se sortea entre los pagados.</span>
            </button>
          </div>
          {form.tipo === "boletos" && <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-zinc-300">Precio por boleto (MXN)
              <input inputMode="decimal" value={form.precio_boleto} onChange={(event) => setForm((current) => ({ ...current, precio_boleto: event.target.value.replace(/[^\d.]/g, "") }))} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-[#ffd90f] focus:outline-none" />
            </label>
            <label className="block text-sm text-zinc-300">Máximo de boletos (opcional)
              <input inputMode="numeric" value={form.boletos_max} onChange={(event) => setForm((current) => ({ ...current, boletos_max: event.target.value.replace(/[^\d]/g, "") }))} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-[#ffd90f] focus:outline-none" />
            </label>
          </div>}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><CalendarClock className="size-4 text-[#ffd90f]" /> ¿Quieres programar el sorteo?</span>
              <span className="mt-1 block text-xs text-zinc-500">Si lo programas, se ejecutará automáticamente al llegar la fecha (o al abrir /rifas).</span>
            </span>
            <input type="checkbox" checked={form.programar} onChange={(event) => setForm((current) => ({ ...current, programar: event.target.checked }))} className="size-5 accent-[#ffd90f]" />
          </label>
          {form.programar && <label className="mt-3 block text-sm text-zinc-300">Fecha y hora
            <input type="datetime-local" value={form.fecha_sorteo} onChange={(event) => setForm((current) => ({ ...current, fecha_sorteo: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-[#ffd90f] focus:outline-none" />
          </label>}
        </div>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <span>
            <span className="text-sm font-semibold text-zinc-200">Publicar en /rifas</span>
            <span className="mt-1 block text-xs text-zinc-500">Visible para tus clientes. Si no lo publicas, queda como borrador.</span>
          </span>
          <input type="checkbox" checked={form.publicado || form.programar} onChange={(event) => setForm((current) => ({ ...current, publicado: event.target.checked }))} disabled={form.programar} className="size-5 accent-[#ffd90f] disabled:opacity-60" />
        </label>
      </div>}

      {step === 3 && <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Tipo" value={form.tipo === "boletos" ? "Rifa con boletos" : "Gratis por comentarios"} />
          <SummaryCard label="Ganadores" value={String(form.num_ganadores || 1)} />
          <SummaryCard label="Publicaciones" value={String(draft?.publicaciones.length || 0)} />
          <SummaryCard label="Participantes / boletos" value={form.tipo === "boletos" ? `${draft?.boletos_pagados || 0} pagados` : String(draft?.total_participantes || 0)} />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
          <p><span className="text-zinc-500">Título:</span> <strong className="text-white">{form.titulo || "Sin título"}</strong></p>
          <p className="mt-2"><span className="text-zinc-500">Premio:</span> {form.premio || "Sin premio definido"}</p>
          <p className="mt-2"><span className="text-zinc-500">Fecha:</span> {form.programar && form.fecha_sorteo ? formatFecha(new Date(form.fecha_sorteo).toISOString()) : "Sin programar"}</p>
          <p className="mt-2"><span className="text-zinc-500">Comparativa:</span> {form.criterio_comparacion === "likes" ? "Likes" : "Comentarios"}</p>
          {form.tipo === "boletos" && <p className="mt-2"><span className="text-zinc-500">Boletos:</span> {money(form.precio_boleto)} · máximo {form.boletos_max || "sin límite"}</p>}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm font-semibold text-zinc-200">Publicaciones incluidas</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-300">
            {publicaciones.map((publicacion) => <li key={publicacion.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <span className="truncate">@{publicacion.autor || publicacion.shortcode}</span>
              <span className="text-xs text-zinc-400">{publicacion.likes.toLocaleString("es-MX")} likes · {publicacion.comentarios.toLocaleString("es-MX")} comentarios</span>
            </li>)}
            {publicaciones.length === 0 && <li className="text-zinc-500">Sin publicaciones.</li>}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void onSave({ publicar: true })} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ffd90f] px-4 text-sm font-bold text-zinc-950 hover:bg-[#e5c30d] disabled:opacity-60">{busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} {form.publicado ? "Guardar cambios" : "Publicar sorteo"}</button>
          <button type="button" onClick={() => void onSave()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60">Guardar borrador</button>
          <button type="button" onClick={onOpenGanadores} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"><Trophy className="size-4" /> Ir a ganadores</button>
        </div>
      </div>}

      <div className="mt-6 flex items-center justify-between gap-2 border-t border-zinc-800 pt-4">
        <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"><ChevronLeft className="size-4" /> Atrás</button>
        {step < 3 ? <button type="button" onClick={() => { if (step === 1) { void onNextStep1(); return; } void onSave({ irAPaso3: true }); }} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ffd90f] px-4 text-sm font-bold text-zinc-950 hover:bg-[#e5c30d] disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : null} Siguiente <ChevronRight className="size-4" /></button> : <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-800">Cerrar</button>}
      </div>
    </div>
  </section>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><p className="text-xs uppercase text-zinc-500">{label}</p><p className="mt-1 text-lg font-black text-white">{value}</p></div>;
}
