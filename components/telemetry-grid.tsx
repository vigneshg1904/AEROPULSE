'use client'

import {
  Brain,
  CloudFog,
  Droplets,
  Gauge,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wind,
} from 'lucide-react'
import { AnimatedNumber } from '@/components/animated-number'
import { CardSkeleton, MetricCard } from '@/components/metric-card'
import type { TelemetryState } from '@/hooks/use-telemetry'
import {
  aqiBand,
  co2Grade,
  delta,
  dewPointC,
  fmt,
  fmtSigned,
  heatIndexC,
} from '@/lib/metrics'

const TONE_TEXT = {
  primary: 'text-primary',
  info: 'text-info',
  warning: 'text-warning',
  destructive: 'text-destructive',
} as const

export function TelemetryGrid({
  state,
  loading,
}: {
  state: TelemetryState
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const { current, predicted, status } = state
  const cached = status === 'OFFLINE'
  const band = aqiBand(current.aqi)
  const hi = heatIndexC(current.temp, current.humidity)
  const dp = dewPointC(current.temp, current.humidity)
  const gas = co2Grade(current.co2)
  const aqiDelta = delta(predicted.aqi, current.aqi)
  const tempDelta = delta(predicted.temp, current.temp)
  const co2Delta = delta(predicted.co2, current.co2)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {/* 1 — Air Quality Index */}
      <MetricCard
        index={0}
        icon={Wind}
        label="Air Quality Index"
        sensor="field1 • MQ-135"
        accent={band?.text ?? 'text-muted-foreground'}
        ring={band?.border ?? 'border-border/50'}
        cached={cached}
        footer={
          <div className="flex items-center justify-between text-xs">
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${band?.border ?? 'border-border/50'} ${band?.bg ?? ''} ${band?.text ?? 'text-muted-foreground'}`}>
              {band?.cpcb ?? 'No reading'}
            </span>
            <span className="text-muted-foreground">CPCB National AQI categories</span>
          </div>
        }
      >
        <div className="flex items-end gap-2">
          <AnimatedNumber
            value={current.aqi}
            className={`text-5xl font-semibold leading-none ${band?.text ?? 'text-muted-foreground'}`}
          />
          <span className="pb-1 text-xs text-muted-foreground">/ 500</span>
        </div>
        <p className={`mt-3 text-sm font-medium ${band?.text ?? 'text-muted-foreground'}`}>
          {band?.label ?? 'Awaiting sensor'}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary/60">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, ((current.aqi ?? 0) / 500) * 100)}%`,
              backgroundColor: band?.hex ?? '#94a3b8',
            }}
          />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Indicative index from the MQ-135 gas sensor; not a CPCB-certified AQI.
        </p>
      </MetricCard>

      {/* 2 — Temperature */}
      <MetricCard
        index={1}
        icon={Thermometer}
        label="Ambient Temperature"
        sensor="field2 • DHT11"
        accent="text-info"
        cached={cached}
        footer={<p className="text-xs text-muted-foreground">Dew point and heat index shown below</p>}
      >
        <div className="flex items-end gap-1">
          <AnimatedNumber
            value={current.temp}
            digits={1}
            className="text-5xl font-semibold leading-none text-info"
          />
          <span className="pb-1 text-lg text-muted-foreground">°C</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Feels like" value={`${fmt(hi, 1)}°C`} />
          <Stat label="Dry bulb" value={`${fmt(current.temp, 1)}°C`} />
        </dl>
      </MetricCard>

      {/* 3 — Humidity */}
      <MetricCard
        index={2}
        icon={Droplets}
        label="Relative Humidity"
        sensor="field3 • DHT11"
        accent="text-accent"
        cached={cached}
        footer={<p className="text-xs text-muted-foreground">Relative humidity measurement</p>}
      >
        <div className="flex items-end gap-1">
          <AnimatedNumber
            value={current.humidity}
            digits={1}
            className="text-5xl font-semibold leading-none text-accent"
          />
          <span className="pb-1 text-lg text-muted-foreground">%</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Dew point" value={`${fmt(dp, 1)}°C`} />
          <Stat label="Dry bulb" value={`${fmt(current.temp, 1)}°C`} />
        </dl>
      </MetricCard>

      {/* 4 — CO2 */}
      <MetricCard
        index={3}
        icon={CloudFog}
        label="Estimated CO2 (eCO2, MQ-135)"
        sensor="field4 • MQ-135"
        accent={TONE_TEXT[gas.tone]}
        cached={cached}
        footer={<p className="text-xs leading-relaxed text-muted-foreground">{gas.guide}</p>}
      >
        <div className="flex items-end gap-1">
          <AnimatedNumber
            value={current.co2}
            className={`text-5xl font-semibold leading-none ${TONE_TEXT[gas.tone]}`}
          />
          <span className="pb-1 text-sm text-muted-foreground">PPM</span>
        </div>
        <span
          className={`mt-3 inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TONE_TEXT[gas.tone]} border-current`}
        >
          {gas.label}
        </span>
      </MetricCard>

      {/* 5 — Predicted AQI */}
      <MetricCard
        index={4}
        icon={Brain}
        label="AI-Predicted AQI"
        sensor="field6 • MATLAB • +15 min"
        accent="text-forecast"
        ring="border-forecast/30"
        footer={
          <dl className="grid grid-cols-3 gap-2 text-xs">
            <Stat label="Horizon" value="+15 min" />
            <Stat label="Model" value="Lin. reg." />
            <Stat label="Engine" value="MATLAB" />
          </dl>
        }
      >
        <div className="flex items-end gap-2">
          <AnimatedNumber
            value={predicted.aqi}
            className="text-5xl font-semibold leading-none text-forecast"
          />
          <TrendPill delta={aqiDelta} unit="" risingLabel="Rising" fallingLabel="Clearing" />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Linear regression (degree 1) on the last 15 minutes of readings, +15 min horizon,
          computed by ThingSpeak MATLAB Analysis and written to fields 5–7. The last forecast
          stays on screen until the next one arrives — identical to the device LCD.
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary/60">
          <div
            className="h-full rounded-full bg-forecast transition-all duration-700"
            style={{ width: `${Math.min(100, ((predicted.aqi ?? 0) / 500) * 100)}%` }}
          />
        </div>
      </MetricCard>

      {/* 6 — Dual climate forecast */}
      <MetricCard
        index={5}
        icon={Gauge}
        label="AI Climate Forecast"
        sensor="field5 + field7 • MATLAB"
        accent="text-forecast"
        ring="border-forecast/30"
        footer={
          <p className="text-xs text-muted-foreground">
            Linear regression (degree 1) • +15 min horizon •{' '}
            {predicted.at === null ? 'waiting for MATLAB' : `updated ${new Date(predicted.at).toLocaleTimeString()}`}
          </p>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SubCard
            title="Predicted temp"
            value={fmt(predicted.temp, 1)}
            unit="°C"
            delta={tempDelta}
            unitSuffix="°C"
          />
          <SubCard
            title="Predicted CO2"
            value={fmt(predicted.co2)}
            unit="PPM"
            delta={co2Delta}
            unitSuffix=" PPM"
          />
        </div>
      </MetricCard>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-secondary/30 px-2.5 py-2">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="tabular mt-0.5 font-mono text-sm text-foreground">{value}</dd>
    </div>
  )
}

function SubCard({
  title,
  value,
  unit,
  delta: d,
  unitSuffix,
}: {
  title: string
  value: string
  unit: string
  delta: ReturnType<typeof delta>
  unitSuffix: string
}) {
  return (
    <div className="rounded-xl border border-forecast/25 bg-forecast/5 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="tabular mt-1 font-mono text-2xl font-semibold leading-none text-forecast">
        {value}
        <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {d === null ? (
          'No baseline'
        ) : (
          <span className={d.dir === 'up' ? 'text-warning' : d.dir === 'down' ? 'text-primary' : ''}>
            {fmtSigned(d.abs, 1)}
            {unitSuffix} vs now
          </span>
        )}
      </p>
    </div>
  )
}

function TrendPill({
  delta: d,
  unit,
  risingLabel,
  fallingLabel,
}: {
  delta: ReturnType<typeof delta>
  unit: string
  risingLabel: string
  fallingLabel: string
}) {
  if (d === null) {
    return <span className="pb-1 text-xs text-muted-foreground">no baseline</span>
  }
  const rising = d.dir === 'up'
  const Icon = rising ? TrendingUp : TrendingDown
  const tone = d.dir === 'flat' ? 'text-muted-foreground' : rising ? 'text-warning' : 'text-primary'
  const pct = d.pct === null ? null : `${d.pct > 0 ? '+' : ''}${d.pct.toFixed(0)}%`
  return (
    <span className={`mb-1 inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
      <Icon className="size-3.5" />
      {d.dir === 'flat' ? 'Stable' : rising ? risingLabel : fallingLabel}
      {pct && <span className="tabular font-mono">{pct}{unit}</span>}
    </span>
  )
}
