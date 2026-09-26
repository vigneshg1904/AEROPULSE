'use client'

import { formatAge, type DeviceStatus } from '@/lib/telemetry'

const STYLES: Record<DeviceStatus, { dot: string; wrap: string; label: string }> = {
  LIVE: {
    dot: 'bg-primary',
    wrap: 'border-primary/40 bg-primary/10 text-primary',
    label: 'LIVE',
  },
  DELAYED: {
    dot: 'bg-warning',
    wrap: 'border-warning/40 bg-warning/10 text-warning',
    label: 'DELAYED',
  },
  OFFLINE: {
    dot: 'bg-destructive',
    wrap: 'border-destructive/40 bg-destructive/10 text-destructive',
    label: 'OFFLINE',
  },
  UNKNOWN: {
    dot: 'bg-muted-foreground',
    wrap: 'border-border/60 bg-secondary/40 text-muted-foreground',
    label: 'SYNCING',
  },
}

export function StatusBadge({
  status,
  dataAgeMs,
}: {
  status: DeviceStatus
  dataAgeMs: number | null
}) {
  const s = STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wider ${s.wrap}`}
      title={`ESP32 node status — last packet ${formatAge(dataAgeMs)}`}
    >
      <span className="relative flex size-2">
        {status === 'LIVE' && (
          <span className={`absolute inline-flex size-2 animate-ping rounded-full ${s.dot} opacity-70`} />
        )}
        <span className={`relative inline-flex size-2 rounded-full ${s.dot}`} />
      </span>
      {s.label}
      <span className="hidden font-normal text-muted-foreground sm:inline">
        {formatAge(dataAgeMs)}
      </span>
    </span>
  )
}
