'use client'

import { motion } from 'framer-motion'
import {
  Fan,
  Filter,
  HeartPulse,
  Leaf,
  ShieldAlert,
  Siren,
  Sprout,
  Timer,
  Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { aqiBand, fmt } from '@/lib/metrics'

type Action = { icon: LucideIcon; title: string; detail: string }

const PLAYBOOKS: Record<string, { headline: string; note: string; actions: Action[] }> = {
  good: {
    headline: 'Natural ventilation window is open',
    note: 'Air is at outdoor-grade quality. Optimise for comfort and energy, not filtration.',
    actions: [
      { icon: Wind, title: 'Cross-ventilate freely', detail: 'Open opposing windows for 20–30 min to fully flush indoor CO2.' },
      { icon: Leaf, title: 'Outdoor activity cleared', detail: 'Running, cycling and outdoor training are safe for all groups.' },
      { icon: Fan, title: 'Energy-saving mode', detail: 'Switch purifiers to standby and rely on passive airflow.' },
      { icon: Sprout, title: 'Maintain greenery', detail: 'Water areca palm and snake plant while conditions are mild.' },
    ],
  },
  moderate: {
    headline: 'Time-boxed ventilation recommended',
    note: 'Acceptable for most people; sensitive groups should moderate outdoor exertion.',
    actions: [
      { icon: Timer, title: 'Ventilate in windows', detail: 'Open up for 10 min per hour, ideally early morning or late evening.' },
      { icon: HeartPulse, title: 'Sensitive-group caution', detail: 'Asthmatic, elderly and paediatric occupants should limit heavy exertion.' },
      { icon: Filter, title: 'Purifier on low', detail: 'Run HEPA units at low duty to trim particulate load.' },
      { icon: Wind, title: 'Avoid roadside intake', detail: 'Keep street-facing apertures closed during peak traffic hours.' },
    ],
  },
  unhealthy: {
    headline: 'Indoor protection protocol active',
    note: 'Outdoor air is degrading occupant health — shift to filtered recirculation.',
    actions: [
      { icon: ShieldAlert, title: 'Indoor lockdown', detail: 'Close all windows and doors; seal visible gaps with draught tape.' },
      { icon: Filter, title: 'HEPA at maximum', detail: 'Run H13-grade purifiers continuously; target 5 air changes per hour.' },
      { icon: Fan, title: 'Recirculate, do not intake', detail: 'Set HVAC to recirculation mode and disable fresh-air dampers.' },
      { icon: Sprout, title: 'Reinforce plant buffer', detail: 'Cluster areca palm, money plant and peace lily near intake points.' },
    ],
  },
  hazardous: {
    headline: 'Emergency isolation protocol',
    note: 'Hazardous exposure. Treat this as an acute health event, not a comfort issue.',
    actions: [
      { icon: Siren, title: 'Isolate the space', detail: 'Restrict to a single sealed clean room with continuous filtration.' },
      { icon: ShieldAlert, title: 'N95 mandatory', detail: 'N95/FFP2 respirators required for anyone moving between zones.' },
      { icon: Filter, title: 'Clean-room stack', detail: 'Pair HEPA with activated-carbon media for gaseous contaminants.' },
      { icon: HeartPulse, title: 'Medical triggers', detail: 'Chest tightness, persistent cough or dizziness → seek care immediately.' },
    ],
  },
}

// CPCB categories → mitigation playbook tier.
const BAND_TO_PLAYBOOK: Record<string, keyof typeof PLAYBOOKS> = {
  good: 'good',
  satisfactory: 'good',
  moderate: 'moderate',
  poor: 'unhealthy',
  'very-poor': 'unhealthy',
  severe: 'hazardous',
}

export function MitigationEngine({
  aqi,
  co2,
}: {
  aqi: number | null
  co2: number | null
}) {
  const band = aqiBand(aqi)
  const playbook = PLAYBOOKS[BAND_TO_PLAYBOOK[band?.key ?? 'moderate'] ?? 'moderate']
  const override = co2 !== null && co2 >= 5000

  return (
    <section aria-label="Environmental mitigation plan" className="glass-panel p-4 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mitigation Engine</h2>
          <p className="text-xs text-muted-foreground">
            Plan recomputed from live AQI {fmt(aqi)} · CO2 {fmt(co2)} PPM
          </p>
        </div>
        <span
          className={`self-start rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider sm:self-auto ${band?.border ?? 'border-border/50'} ${band?.bg ?? ''} ${band?.text ?? 'text-muted-foreground'}`}
        >
          {band?.label ?? 'Awaiting data'} band
        </span>
      </div>

      <p className={`mt-4 text-sm font-medium ${band?.text ?? 'text-foreground'}`}>
        {playbook.headline}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{playbook.note}</p>

      {override && (
        <p className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive">
          CO2 override engaged at {fmt(co2)} PPM — above the NIOSH/OSHA 8-hour limit. The
          evacuation protocol takes priority over the ventilation guidance below.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {playbook.actions.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="rounded-xl border border-border/40 bg-secondary/25 p-3"
          >
            <a.icon className={`size-4 ${band?.text ?? 'text-primary'}`} />
            <h3 className="mt-2 text-sm font-medium">{a.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
