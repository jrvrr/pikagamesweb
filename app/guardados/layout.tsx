import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis guardados",
  robots: { index: false, follow: false },
};

export default function GuardadosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
