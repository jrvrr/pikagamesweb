export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="leap-frog">
          <div className="leap-frog__dot"></div>
          <div className="leap-frog__dot"></div>
          <div className="leap-frog__dot"></div>
        </div>
        <p className="text-[#fce362] font-black tracking-[0.2em] uppercase text-sm animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  );
}
