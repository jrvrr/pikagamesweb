export type SorteoEstado = "borrador" | "programado" | "activo" | "sorteado" | "cancelado";
export type SorteoTipo = "instagram" | "boletos";

export type SorteoPublicacion = {
  id: string;
  url: string;
  plataforma: string;
  shortcode: string | null;
  autor: string | null;
  imagen_url: string | null;
  likes: number;
  comentarios: number;
  provider: string | null;
  ultima_sincronizacion: string | null;
  created_at: string;
};

export type SorteoParticipante = {
  id: string;
  username: string;
  nombre: string | null;
  comentario: string | null;
  origen: string;
  publicacion_id: string | null;
  created_at: string;
};

export type SorteoGanador = {
  id: string;
  posicion: number;
  nombre: string;
  username: string | null;
  premio: string | null;
  participante_id: string | null;
  boleto_id: string | null;
  created_at: string;
};

export type SorteoBoleto = {
  id: string;
  numero: number;
  estado: "pendiente" | "pagado" | "cancelado";
  precio: string;
  pedido_id: string | null;
  usuario_id: string | null;
  usuario: { id: string; nombre: string; email: string } | null;
  pagado_at: string | null;
  created_at: string;
};

export type Sorteo = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  premio: string | null;
  imagen_url: string | null;
  tipo: SorteoTipo;
  estado: SorteoEstado;
  criterio_comparacion: "comentarios" | "likes";
  num_ganadores: number;
  fecha_sorteo: string | null;
  reglas: string | null;
  precio_boleto: string | null;
  boletos_max: number | null;
  publicado: boolean;
  ganadores_publicados: boolean;
  semilla: string | null;
  resultado_hash: string | null;
  sorteado_at: string | null;
  created_at: string;
  updated_at: string;
  publicaciones: SorteoPublicacion[];
  participantes: SorteoParticipante[];
  boletos: SorteoBoleto[];
  ganadores: SorteoGanador[];
  total_participantes: number;
  total_boletos: number;
  boletos_pagados: number;
  participantes_por_publicacion: { publicacion_id: string; total: number }[];
};

export const estadoLabel: Record<SorteoEstado, string> = {
  borrador: "Borrador",
  programado: "Programado",
  activo: "Activo",
  sorteado: "Sorteado",
  cancelado: "Cancelado",
};

export const estadoTone: Record<SorteoEstado, string> = {
  borrador: "bg-zinc-700/60 text-zinc-200",
  programado: "bg-amber-400/10 text-amber-200 border border-amber-400/30",
  activo: "bg-emerald-400/10 text-emerald-200 border border-emerald-400/30",
  sorteado: "bg-sky-400/10 text-sky-200 border border-sky-400/30",
  cancelado: "bg-rose-400/10 text-rose-200 border border-rose-400/30",
};

export const formatFecha = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};

export const toLocalInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const money = (value?: string | number | null) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
    : "—";
};

export const publicacionMetrica = (publicacion: SorteoPublicacion, criterio: "comentarios" | "likes") =>
  criterio === "likes" ? publicacion.likes : publicacion.comentarios;

export const estadoSorteoListo = (sorteo: Sorteo) => {
  if (sorteo.estado === "sorteado") return false;
  if (!sorteo.fecha_sorteo) return false;
  return new Date(sorteo.fecha_sorteo).getTime() <= Date.now();
};

export const sorteoCerrado = (sorteo: Pick<Sorteo, "fecha_sorteo">) =>
  Boolean(sorteo.fecha_sorteo && new Date(sorteo.fecha_sorteo).getTime() <= Date.now());
