import type { Metadata } from "next";
import { API_URL } from "@/lib/api";
import { RifaDetalleClient } from "./RifaDetalleClient";

type PageProps = { params: Promise<{ slug: string }> };

type RifaMeta = {
  titulo?: string;
  descripcion?: string | null;
  premio?: string | null;
  imagen_url?: string | null;
};

async function obtenerRifa(slug: string): Promise<RifaMeta | null> {
  try {
    const response = await fetch(`${API_URL}/sorteos/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.sorteo ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sorteo = await obtenerRifa(slug);
  if (!sorteo) {
    return { title: "Rifa no encontrada", robots: { index: false, follow: true } };
  }
  const title = sorteo.titulo || "Rifa";
  const description = sorteo.descripcion || sorteo.premio || "Consulta las bases, premios, boletos y ganadores de esta rifa de PikaGames.";
  return {
    title,
    description,
    alternates: { canonical: `/rifas/${slug}` },
    openGraph: {
      type: "website",
      locale: "es_MX",
      siteName: "PikaGames",
      title: `${title} | Rifas PikaGames`,
      description,
      ...(sorteo.imagen_url ? { images: [{ url: sorteo.imagen_url }] } : {}),
    },
  };
}

export default async function RifaDetallePage({ params }: PageProps) {
  const { slug } = await params;
  return <RifaDetalleClient slug={slug} />;
}
