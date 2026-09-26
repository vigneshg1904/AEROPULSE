'use client'

import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Maximize2, X } from 'lucide-react'
import { exportChartPng } from '@/lib/export'
import type { Sample } from '@/lib/telemetry'

const RANGES = [
  { key: '24h', label: 'Last 24 Hours', ms: 24 * 3600_000 },
  { key: '7d', label: '7 Days', ms: 7 * 24 * 3600_000 },
  { key: '30d', label: '30 Days', ms: 30 * 24 * 3600_000 },
  { key: 'all', label: 'All Time', ms: Number.POSITIVE_INFINITY },
] as const

type RangeKey = (typeof RANGES)[number]['key']

const AXIS = { stroke: '#64748b', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }

export function AnalyticsSection({ samples }: { samples: Sample[] }) {
  const [range, setRange] = useState<RangeKey>('24h')
  const [expanded, setExpanded] = useState<string | null>(null)

  const rows = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range) ?? RANGES[3]
    const latest = samples.length ? samples[samples.length - 1].t : Date.now()
    const cutoff = latest - cfg.ms
    return samples
      .filter((s) => s.t >= cutoff)
      .map((s) => ({
        t: s.t,
        aqi: s.aqi,
        predAqi: s.predAqi,
        co2: s.co2,
        temp: s.temp,
        humidity: s.humidity,
      }))
  }, [samples, range])

  // Uplink gaps longer than 5 minutes mark a device dropout.
  const dropouts = useMemo(() => {
    const marks: number[] = []
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].t - rows[i - 1].t > 5 * 60_000) marks.push(rows[i - 1].t)
    }
    return marks.slice(-8)
  }, [rows])

  const empty = rows.length === 0

  return (
    <section aria-label="Interactive analytics" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Interactive Analytics</h2>
          <p className="text-xs text-muted-foreground">
            Sensor history overlaid with MATLAB regression output
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Time range"
          className="flex flex-wrap gap-1 rounded-xl border border-border/50 bg-secondary/30 p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r.key}
              role="tab"
              aria-selected={range === r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.key
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ChartShell
        id="aqi"
        title="AQI — CPCB National AQI categories"
        subtitle="field1 measured AQI against CPCB category thresholds"
        expanded={expanded}
        onExpand={setExpanded}
        empty={empty}
      >
        {(height) => (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={timeTick}
                {...AXIS}
              />
              <YAxis domain={[0, 'auto']} {...AXIS} />
              <Tooltip content={<GlassTooltip unit="AQI" />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <ReferenceLine y={50} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Good 50', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine y={100} stroke="#84cc16" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Satisfactory 100', fill: '#84cc16', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine y={200} stroke="#facc15" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: 'Moderate 200', fill: '#facc15', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine y={300} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: 'Poor 300', fill: '#f97316', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine y={400} stroke="#dc2626" strokeDasharray="4 4" strokeOpacity={0.7} label={{ value: 'Very Poor 400', fill: '#dc2626', fontSize: 10, position: 'insideTopRight' }} />
              {dropouts.map((d) => (
                <ReferenceLine
                  key={d}
                  x={d}
                  stroke="#ef4444"
                  strokeDasharray="2 4"
                  strokeOpacity={0.7}
                />
              ))}
              <Area
                name="Measured AQI"
                type="monotone"
                dataKey="aqi"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#aqiFill)"
                connectNulls
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Brush
                dataKey="t"
                height={22}
                travellerWidth={8}
                stroke="#334155"
                fill="#0f172a"
                tickFormatter={timeTick}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartShell>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartShell
          id="co2"
          title="CO2 & Toxic Gas Timeline"
          subtitle="field4 with ASHRAE / OSHA danger thresholds"
          expanded={expanded}
          onExpand={setExpanded}
          empty={empty}
        >
          {(height) => (
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="co2Fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.55} />
                    <stop offset="60%" stopColor="#0ea5e9" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={timeTick} {...AXIS} />
                <YAxis domain={[0, 'auto']} {...AXIS} />
                <Tooltip content={<GlassTooltip unit="PPM" />} />
                <ReferenceLine y={1120} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.7} label={{ value: '1120 ventilate', fill: '#f97316', fontSize: 10, position: 'insideTopRight' }} />
                <ReferenceLine y={5000} stroke="#800000" strokeDasharray="4 4" strokeOpacity={0.8} label={{ value: '5000 limit', fill: '#800000', fontSize: 10, position: 'insideTopRight' }} />
                <Area
                  name="CO2 (PPM)"
                  type="monotone"
                  dataKey="co2"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#co2Fill)"
                  connectNulls
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartShell>

        <ChartShell
          id="climate"
          title="Temperature × Humidity Correlation"
          subtitle="Dual axis — °C left, % right, heat-stress zone shaded"
          expanded={expanded}
          onExpand={setExpanded}
          empty={empty}
        >
          {(height) => (
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={rows} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="humFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={timeTick} {...AXIS} />
                <YAxis yAxisId="temp" domain={['auto', 'auto']} {...AXIS} />
                <YAxis yAxisId="hum" orientation="right" domain={[0, 100]} {...AXIS} />
                <Tooltip content={<GlassTooltip unit="" />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <ReferenceLine
                  yAxisId="temp"
                  y={35}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{ value: 'Heat stress 35°C', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                />
                <Area
                  yAxisId="hum"
                  name="Humidity (%)"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#0ea5e9"
                  strokeWidth={1.5}
                  fill="url(#humFill)"
                  connectNulls
                  dot={false}
                />
                <Line
                  yAxisId="temp"
                  name="Temperature (°C)"
                  type="monotone"
                  dataKey="temp"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  connectNulls
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartShell>
      </div>
    </section>
  )
}

function ChartShell({
  id,
  title,
  subtitle,
  expanded,
  onExpand,
  empty,
  children,
}: {
  id: string
  title: string
  subtitle: string
  expanded: string | null
  onExpand: (id: string | null) => void
  empty: boolean
  children: (height: number) => ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const isOpen = expanded === id

  const header = (fullscreen: boolean) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Download ${title} as PNG`}
          onClick={() =>
            void exportChartPng(
              fullscreen ? modalRef.current : ref.current,
              `aeropulse-${id}.png`,
            )
          }
          className="rounded-lg border border-border/60 p-1.5 text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
        >
          <Download className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={fullscreen ? 'Close full screen' : `Expand ${title}`}
          onClick={() => onExpand(fullscreen ? null : id)}
          className="rounded-lg border border-border/60 p-1.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {fullscreen ? <X className="size-3.5" /> : <Maximize2 className="size-3.5" />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="glass-panel flex flex-col gap-3 p-4 sm:p-5">
        {header(false)}
        <div ref={ref} className="w-full">
          {empty ? <ChartEmpty /> : children(280)}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 p-3 backdrop-blur-sm sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} full screen`}
            className="glass-panel flex h-full w-full max-w-[1600px] flex-col gap-3 p-4 sm:p-6"
          >
            {header(true)}
            <div ref={modalRef} className="min-h-0 flex-1">
              {empty ? <ChartEmpty /> : children(520)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ChartEmpty() {
  return (
    <div className="shimmer relative flex h-[280px] items-center justify-center rounded-xl border border-border/40 bg-secondary/20">
      <p className="text-xs text-muted-foreground">No samples in this range</p>
    </div>
  )
}

function timeTick(value: number) {
  if (!Number.isFinite(value)) return ''
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value))
}

type TooltipPayload = {
  name?: string
  value?: number | string | null
  color?: string
  dataKey?: string | number
}

function GlassTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: number | string
  unit: string
}) {
  if (!active || !payload?.length) return null
  const ts = typeof label === 'number' ? label : Number(label)
  return (
    <div className="rounded-xl border border-border/60 bg-popover/90 px-3 py-2 shadow-2xl backdrop-blur-xl">
      <p className="tabular font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {Number.isFinite(ts)
          ? new Intl.DateTimeFormat('en-GB', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'Asia/Kolkata',
            }).format(new Date(ts))
          : '—'}
      </p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {payload
          .filter((p) => p.value !== null && p.value !== undefined)
          .map((p, i) => (
            <li key={`${p.dataKey}-${i}`} className="flex items-center gap-2 text-xs">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: p.color ?? '#94a3b8' }}
              />
              <span className="text-muted-foreground">{p.name}</span>
              <span className="tabular ml-auto font-mono text-foreground">
                {typeof p.value === 'number' ? p.value.toFixed(1) : String(p.value)} {unit}
              </span>
            </li>
          ))}
      </ul>
    </div>
  )
}
