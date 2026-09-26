'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Flame,
  RefreshCw,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import { fmt, heatIndexC } from '@/lib/metrics'
import { formatAge, type DeviceStatus } from '@/lib/telemetry'
import type { TelemetryState } from '@/hooks/use-telemetry'

type Tone = 'destructive' | 'warning' | 'forecast'

const TONE: Record<Tone, string> = {
  destructive: 'border-destructive/50 bg-destructive/10',
  warning: 'border-warning/50 bg-warning/10',
  forecast: 'border-forecast/50 bg-forecast/10',
}

const ICON_TONE: Record<Tone, string> = {
  destructive: 'text-destructive',
  warning: 'text-warning',
  forecast: 'text-forecast',
}

type Alert = {
  id: string
  tone: Tone
  icon: typeof AlertTriangle
  title: string
  body: string
  bullets: string[]
  action?: { label: string; onClick: () => void }
}

export function AlertStack({
  status,
  dataAgeMs,
  current,
  predicted,
  onRefresh,
}: {
  status: DeviceStatus
  dataAgeMs: number | null
  current: TelemetryState['current']
  predicted: TelemetryState['predicted']
  onRefresh: () => void
}) {
  const alerts: Alert[] = []

  if (status === 'OFFLINE') {
    alerts.push({
      id: 'offline',
      tone: 'destructive',
      icon: WifiOff,
      title: 'OFFLINE — no live data',
      body: `No packet received from the ESP32 node for ${formatAge(dataAgeMs)}. Values shown are the last real readings, not live telemetry.`,
      bullets: [
        'Confirm the ESP32 has mains power and the status LED is lit',
        'Verify Wi-Fi SSID reachability and DHCP lease at the site',
        'Check the ThingSpeak write API key and channel rate limit',
        'Inspect MQ-135 / DHT11 wiring on GPIO34 and GPIO4',
      ],
      action: { label: 'Retry connection', onClick: onRefresh },
    })
  } else if (status === 'DELAYED') {
    alerts.push({
      id: 'delayed',
      tone: 'warning',
      icon: Activity,
      title: 'Telemetry delayed',
      body: `Last packet arrived ${formatAge(dataAgeMs)}. Uplink latency is above the 2-minute target.`,
      bullets: [
        'Likely weak RSSI or congested uplink at the deployment site',
        'Readings remain valid but may lag physical conditions',
      ],
    })
  }

  const predAqi = predicted.aqi
  const predCo2 = predicted.co2
  if ((predAqi !== null && predAqi > 150) || (predCo2 !== null && predCo2 > 1000)) {
    const drivers: string[] = []
    if (predAqi !== null && predAqi > 150) drivers.push(`AQI → ${fmt(predAqi)}`)
    if (predCo2 !== null && predCo2 > 1000) drivers.push(`CO₂ → ${fmt(predCo2)} PPM`)
    alerts.push({
      id: 'predictive',
      tone: 'forecast',
      icon: Sparkles,
      title: 'Predictive hazard warning — 15-minute horizon',
      body: `MATLAB linear regression projects ${drivers.join(' and ')} within ~15 minutes. Projected time-to-hazard: ${projectedEta(current.aqi, predAqi)}.`,
      bullets: [
        'Pre-emptively start HEPA purification on maximum flow',
        'Seal windows on the roadside façade before the peak arrives',
        'Move sensitive occupants to the filtered inner zone',
        'Log the event for post-hoc model validation',
      ],
    })
  }

  const hi = heatIndexC(current.temp, current.humidity)
  if ((current.temp !== null && current.temp >= 40) || (hi !== null && hi >= 41)) {
    alerts.push({
      id: 'heat',
      tone: 'warning',
      icon: Flame,
      title: 'Extreme heat advisory',
      body: `Dry-bulb ${fmt(current.temp, 1)}°C with a heat index of ${fmt(hi, 1)}°C — heat-stress threshold exceeded.`,
      bullets: [
        'Force cross-ventilation and mechanical cooling now',
        'Mandate hydration breaks every 20 minutes for occupants',
        'Suspend physical work in unconditioned zones',
      ],
    })
  }

  if ((current.co2 !== null && current.co2 >= 5000) || (current.aqi !== null && current.aqi > 400)) {
    alerts.push({
      id: 'gas',
      tone: 'destructive',
      icon: AlertTriangle,
      title: 'Severe air quality — immediate action required',
      body: `CO₂ at ${fmt(current.co2)} PPM and AQI at ${fmt(current.aqi)} — readings are in the severe/hazardous range.`,
      bullets: [
        'Maximise ventilation and run exhaust fans at full duty',
        'Run HEPA + activated-carbon filtration continuously',
        'Relocate sensitive occupants to a filtered clean zone',
      ],
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {alerts.map((a) => (
          <motion.div
            key={a.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            role="alert"
            className={`rounded-2xl border p-4 backdrop-blur-xl ${TONE[a.tone]}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <a.icon className={`size-5 shrink-0 ${ICON_TONE[a.tone]}`} />
              <div className="min-w-0 flex-1">
                <h3 className={`text-sm font-semibold ${ICON_TONE[a.tone]}`}>{a.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{a.body}</p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {a.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      <span className={ICON_TONE[a.tone]}>›</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              {a.action && (
                <button
                  type="button"
                  onClick={a.action.onClick}
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-destructive/50 bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/25"
                >
                  <RefreshCw className="size-3.5" />
                  {a.action.label}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function projectedEta(currentAqi: number | null, predAqi: number | null): string {
  if (currentAqi === null || predAqi === null) return '~15 min'
  const rise = predAqi - currentAqi
  if (rise <= 0) return 'already at threshold'
  const threshold = 150
  if (currentAqi >= threshold) return 'in effect now'
  const minutes = Math.max(1, Math.round(((threshold - currentAqi) / rise) * 15))
  return `~${minutes} min`
}
