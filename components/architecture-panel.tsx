'use client'

import { Brain, ChevronRight, Cloud, Cpu, LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { THINGSPEAK_CHANNEL } from '@/lib/telemetry'

type Section = {
  id: string
  icon: LucideIcon
  title: string
  summary: string
  accent: string
  rows: [string, string][]
}

const SECTIONS: Section[] = [
  {
    id: 'hardware',
    icon: Cpu,
    title: 'Hardware Layer',
    summary: 'ESP32 sensor node with analogue gas and digital climate sensing',
    accent: 'text-primary',
    rows: [
      ['Controller', 'ESP32-WROOM-32 · dual-core 240 MHz · onboard Wi-Fi'],
      ['Gas sensor', 'MQ-135 → GPIO34 (ADC1_CH6) via voltage divider, 5 V heater'],
      ['Climate sensor', 'DHT11 → GPIO4, single-wire, 1 Hz max sample rate'],
      ['Power', '3.3 V logic rail with 5 V USB supply for the MQ-135 heater'],
      ['Sampling', 'Publishes every 35 s (20-sample ADC average); LCD shows the same values'],
    ],
  },
  {
    id: 'cloud',
    icon: Cloud,
    title: 'Cloud Pipeline',
    summary: `ThingSpeak channel ${THINGSPEAK_CHANNEL} · 4 sensor + 3 forecast fields`,
    accent: 'text-accent',
    rows: [
      ['Transport', 'HTTP REST write from the ESP32 to the ThingSpeak API'],
      ['field1 – field4', 'AQI, temperature (°C), humidity (%), eCO2 (PPM)'],
      ['field5 – field7', 'MATLAB forecast: predicted temperature, AQI, CO2'],
      ['Retention', 'Rolling 200-sample window fetched per dashboard poll'],
      ['Resilience', 'Shows OFFLINE with the last real timestamp when ThingSpeak is unreachable'],
    ],
  },
  {
    id: 'ml',
    icon: Brain,
    title: 'Machine Learning',
    summary: 'MATLAB linear regression on a 15-minute forecast horizon',
    accent: 'text-forecast',
    rows: [
      ['Model', 'Linear regression (degree 1) on the last 15 minutes of readings'],
      ['Horizon', '+15 minutes, recomputed on every ThingSpeak analysis run'],
      ['Accuracy', 'R² and MAE computed each run and logged in the MATLAB output'],
      ['Trigger', 'ThingSpeak React runs the analysis on every ESP32 write'],
      ['Output', 'Written to fields 5–7 of the same channel, 15.5 s after the sensor write'],
    ],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard Runtime',
    summary: 'Next.js App Router with SWR polling and graceful degradation',
    accent: 'text-info',
    rows: [
      ['Fetching', 'Server route handler proxies ThingSpeak; SWR polls every 5 s'],
      ['Staleness', 'LIVE < 60 s · DELAYED 60–150 s · OFFLINE > 150 s'],
      ['Null safety', 'Every reading is range-validated; invalid values render as —'],
      ['Exports', 'CSV dataset export and per-chart PNG rasterisation'],
      ['Charting', 'Recharts with brush zoom, threshold lines and dropout markers'],
    ],
  },
]

export function ArchitecturePanel() {
  return (
    <section aria-label="System architecture" className="glass-panel p-4 sm:p-6">
      <h2 className="text-lg font-semibold">System Architecture</h2>
      <p className="text-xs text-muted-foreground">
        Edge sensing → cloud ingestion → MATLAB inference → dashboard
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {SECTIONS.map((s) => (
          <details
            key={s.id}
            className="group rounded-xl border border-border/40 bg-secondary/20 open:border-border/70"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 [&::-webkit-details-marker]:hidden">
              <s.icon className={`size-4 shrink-0 ${s.accent}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{s.title}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {s.summary}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
            </summary>
            <dl className="grid gap-px border-t border-border/40 bg-border/30 sm:grid-cols-2">
              {s.rows.map(([k, v]) => (
                <div key={k} className="bg-card/60 p-3">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {k}
                  </dt>
                  <dd className="mt-1 text-xs leading-relaxed text-foreground/90">{v}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
    </section>
  )
}
