"use client";

import { motion } from "framer-motion";

export function LoadingScreen({ progress }: { progress?: number }) {
  return (
    <motion.div
      role="status"
      aria-label="Cargando PikaGames"
      initial={false}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center gap-6 bg-black text-[#ffcc23]"
    >
      <div className="relative grid place-items-center">
        <span aria-hidden="true" className="loader-aura absolute size-36 rounded-full bg-[#ffcc23]/15 blur-3xl" />
        <img src="/svg/loader.svg" alt="" width="537" height="873" className="relative h-56 w-auto max-w-[65vw] brightness-[0.3]" />
        <svg
          aria-hidden="true"
          viewBox="0 0 536.82 872.88"
          width="537"
          height="873"
          className="absolute h-56 w-auto max-w-[65vw]"
          style={{ filter: "drop-shadow(0 0 32px rgb(255 204 35 / 0.8))" }}
        >
          <path
            d="M700.5 466.5c46.23-60.39 98.69-123.95 158-189C913.58 217.08 967.88 162.71 1020 114a569.59 569.59 0 0 1 197 232L955 498l108 112L938 712l82 72-89 98 53 63-24 22-97-94 56.5-69.5-120-104 90-96-189-137Z"
            transform="translate(-689.86 -104.43)"
            fill="none"
            stroke="#ffcc23"
            strokeWidth="15"
            strokeMiterlimit="10"
            pathLength="100"
            strokeDasharray="100 100"
            className={progress === undefined ? "loader-trace" : "transition-[stroke-dashoffset] duration-[2200ms] ease-linear"}
            style={progress === undefined ? undefined : { strokeDashoffset: 100 - progress * 100 }}
          />
        </svg>
      </div>
      <span className="text-xs font-extralight tracking-[0.22em]">cargando</span>
    </motion.div>
  );
}
