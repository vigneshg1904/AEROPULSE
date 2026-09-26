'use client'

import { DoorClosed, Droplets, HeartPulse, ShieldAlert, ShieldCheck, Wind } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const PRECAUTIONS: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: ShieldAlert,
    title: 'Protect vulnerable people',
    detail: 'Children, older adults, pregnant people, and anyone with asthma should reduce strenuous outdoor activity when AQI rises.',
  },
  {
    icon: Wind,
    title: 'Improve indoor air',
    detail: 'Use a HEPA purifier when available, keep filters maintained, and avoid burning incense, candles, or tobacco indoors.',
  },
  {
    icon: DoorClosed,
    title: 'Time ventilation carefully',
    detail: 'Close windows during traffic peaks or smoky conditions. Ventilate when outdoor readings are lower instead of leaving windows open all day.',
  },
  {
    icon: Droplets,
    title: 'Reduce indoor particles',
    detail: 'Wet-mop floors, avoid dry sweeping, and use kitchen exhaust when cooking to limit dust and fumes.',
  },
  {
    icon: HeartPulse,
    title: 'Watch for symptoms',
    detail: 'Move to cleaner air and seek medical advice for breathing difficulty, chest pain, severe coughing, or unusual dizziness.',
  },
  {
    icon: ShieldCheck,
    title: 'Check before going out',
    detail: 'Review the live AQI and forecast before exercising outdoors. Carry a well-fitting N95 or equivalent mask on poor-air days.',
  },
]

export function AirPrecautions() {
  return (
    <section aria-labelledby="air-precautions-title" className="glass-panel p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-2 text-warning">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h2 id="air-precautions-title" className="text-lg font-semibold">Air pollution precautions</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Practical steps to reduce exposure. Follow local health guidance, especially during smoke, dust, or high-AQI events.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PRECAUTIONS.map(({ icon: Icon, title, detail }) => (
          <article key={title} className="rounded-xl border border-border/40 bg-secondary/25 p-3">
            <Icon className="size-4 text-warning" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-medium">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
