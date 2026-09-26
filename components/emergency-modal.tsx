'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PhoneCall, Siren, X } from 'lucide-react'
import { fmt } from '@/lib/metrics'

const STEPS = [
  'Evacuate all occupants to the designated outdoor assembly point immediately.',
  'Open every window and door along the evacuation route as you leave.',
  'Run all exhaust fans and HVAC purge at 100% duty; disable recirculation.',
  'Do not use open flames, gas appliances or electrical switches while purging.',
  'Do not re-enter until the dashboard reports CO₂ below 5000 PPM for 5 minutes.',
]

const HOTLINES = [
  { label: 'Emergency (India)', number: '112' },
  { label: 'Fire & rescue', number: '101' },
  { label: 'Ambulance', number: '108' },
  { label: 'Gas leak helpline', number: '1906' },
]

export function EmergencyModal({ co2 }: { co2: number | null }) {
  const critical = co2 !== null && co2 >= 5000
  const [dismissed, setDismissed] = useState(false)

  // Re-arm the modal once the space is purged, so the next spike alerts again.
  useEffect(() => {
    if (!critical) setDismissed(false)
  }, [critical])

  const open = critical && !dismissed

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-destructive/10 p-4 backdrop-blur-md"
          role="alertdialog"
          aria-modal="true"
          aria-label="Carbon dioxide emergency"
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0 }}
            className="w-full max-w-2xl rounded-2xl border border-destructive/60 bg-card/95 p-5 shadow-2xl backdrop-blur-xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="relative flex size-10 items-center justify-center rounded-xl bg-destructive/15">
                  <span className="absolute inset-0 animate-ping rounded-xl bg-destructive/20" />
                  <Siren className="relative size-5 text-destructive" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-destructive">
                    CO₂ emergency — evacuate now
                  </h2>
                  <p className="tabular mt-1 font-mono text-sm text-foreground">
                    {fmt(co2)} PPM detected · NIOSH/OSHA 8-hour limit 5000 PPM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Acknowledge and dismiss emergency alert"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <ol className="mt-5 flex flex-col gap-2">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm leading-relaxed">
                  <span className="tabular mt-0.5 font-mono text-xs text-destructive">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ol>

            <div className="mt-5 grid gap-2 border-t border-border/50 pt-4 sm:grid-cols-2">
              {HOTLINES.map((h) => (
                <a
                  key={h.number}
                  href={`tel:${h.number}`}
                  className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm transition-colors hover:bg-destructive/20"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <PhoneCall className="size-3.5 text-destructive" />
                    {h.label}
                  </span>
                  <span className="tabular font-mono font-semibold text-destructive">
                    {h.number}
                  </span>
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="mt-5 w-full rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90"
            >
              I have started the evacuation protocol
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
