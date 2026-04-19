export function Shell({ children, title, back }) {
  return (
    <div className="min-h-screen w-full max-w-md mx-auto px-5 pt-10 pb-10 flex flex-col relative">
      {(title || back) && (
        <header className="relative flex items-center justify-between mb-4 min-h-[28px]">
          <div className="relative z-10 text-gold text-sm tracking-[0.3em]">
            {back && <button onClick={back}>‹ 返回</button>}
          </div>
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <div className="text-goldBright font-display text-lg tracking-[0.4em] text-center">{title}</div>
          </div>
          <div className="w-10" />
        </header>
      )}
      {children}
    </div>
  )
}

export function Flourish({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 text-gold/60 ${className}`}>
      <div className="flex-1 h-px bg-gold/40" />
      <span className="text-xs tracking-[0.4em]">⚜</span>
      <div className="flex-1 h-px bg-gold/40" />
    </div>
  )
}
