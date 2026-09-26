'use client'

import { AlertTriangle, Database, Radio } from 'lucide-react'
import { AirPrecautions } from '@/components/air-precautions'
import { AlertStack } from '@/components/alert-stack'
import { AnalyticsSection } from '@/components/analytics-section'
import { ArchitecturePanel } from '@/components/architecture-panel'
import { CommandHeader } from '@/components/command-header'
import { EmergencyModal } from '@/components/emergency-modal'
import { MitigationEngine } from '@/components/mitigation-engine'
import { StandardsReferences } from '@/components/standards-references'
import { TelemetryGrid } from '@/components/telemetry-grid'
import { useLocationStore } from '@/hooks/use-location'
import { useTelemetry } from '@/hooks/use-telemetry'
import { exportDataset } from '@/lib/export'
import { THINGSPEAK_CHANNEL, formatAge } from '@/lib/telemetry'

export function Dashboard() {
  const state = useTelemetry()
  const location = useLocationStore()

  return (
    <div className="relative flex min-h-screen flex-col">
      <CommandHeader
        status={state.status}
        dataAgeMs={state.dataAgeMs}
        isRefreshing={state.isRefreshing}
        onRefresh={state.refresh}
        onExport={() => exportDataset(state.samples, location.location)}
        canExport={state.samples.length > 0}
        location={location}
      />

      <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-5 px-4 py-6 lg:px-6">
        <AlertStack
          status={state.status}
          dataAgeMs={state.dataAgeMs}
          current={state.current}
          predicted={state.predicted}
          onRefresh={state.refresh}
        />

        {state.source === 'offline' && (
          <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>
              OFFLINE — no live data. ThingSpeak channel {THINGSPEAK_CHANNEL} is unreachable
              {state.upstreamError ? ` (${state.upstreamError})` : ''}.{' '}
              {state.lastRealTimestamp
                ? `Last real reading received ${new Date(state.lastRealTimestamp).toLocaleString()}.`
                : 'No live reading has been received yet.'}
            </span>
          </p>
        )}

        {state.error && state.samples.length === 0 && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            Telemetry request failed: {state.error}. Retrying automatically every 5 seconds.
          </p>
        )}

        <TelemetryGrid state={state} loading={state.isInitialLoading} />

        <AnalyticsSection samples={state.samples} />

        <MitigationEngine aqi={state.current.aqi} co2={state.current.co2} />

        <AirPrecautions />

        <ArchitecturePanel />

        <StandardsReferences />

        <footer className="flex flex-col gap-2 border-t border-border/40 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <Radio className="size-3.5 text-primary" />
            {location.location} · ESP32 node · last packet {formatAge(state.dataAgeMs)}
          </span>
          <span className="flex items-center gap-2">
            <Database className="size-3.5 text-accent" />
            {state.samples.length} samples ·{' '}
            {state.source === 'thingspeak'
              ? `ThingSpeak ${THINGSPEAK_CHANNEL}`
              : 'offline — no live data'}{' '}
            · MATLAB linear regression
          </span>
        </footer>
      </main>

      <EmergencyModal co2={state.current.co2} />
    </div>
  )
}
