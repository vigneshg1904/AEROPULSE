// Deterministic particle field — identical on server and client, so no hydration drift.
const PARTICLES = Array.from({ length: 26 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280
  const r = seed / 233280
  return {
    left: `${(r * 100).toFixed(2)}%`,
    size: 1 + ((i * 7) % 3),
    duration: `${18 + ((i * 5) % 22)}s`,
    delay: `-${(i * 1.7).toFixed(1)}s`,
    tone: i % 5 === 0 ? 'bg-forecast/40' : i % 3 === 0 ? 'bg-accent/40' : 'bg-primary/40',
  }
})

export function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 grid-overlay" />
      <div className="absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={`ambient-particle absolute bottom-0 rounded-full ${p.tone}`}
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
