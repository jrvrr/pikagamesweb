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
        <img
          src="/svg/loader.svg"
          alt=""
          width="537"
          height="873"
          className={`absolute h-56 w-auto max-w-[65vw] ${progress === undefined ? "loader-glow" : "transition-opacity duration-[2200ms] ease-linear"}`}
          style={progress === undefined ? undefined : {
            opacity: progress,
            filter: "drop-shadow(0 0 32px rgb(255 204 35 / 0.8))",
          }}
        />
      </div>
      <span className="text-xs font-extralight tracking-[0.22em]">cargando</span>
    </motion.div>
  );
}
