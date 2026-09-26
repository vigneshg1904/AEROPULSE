'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Download, MapPin, Plus, RefreshCw, X } from 'lucide-react'
import { PRESET_LOCATIONS, useLocationStore } from '@/hooks/use-location'
import type { DeviceStatus } from '@/lib/telemetry'
import { StatusBadge } from '@/components/status-badge'

type Props = {
  status: DeviceStatus
  dataAgeMs: number | null
  isRefreshing: boolean
  onRefresh: () => void
  onExport: () => void
  canExport: boolean
  location: ReturnType<typeof useLocationStore>
}

export function CommandHeader({
  status,
  dataAgeMs,
  isRefreshing,
  onRefresh,
  onExport,
  canExport,
  location,
}: Props) {
  const [clock, setClock] = useState<string | null>(null)

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata',
        }).format(new Date()),
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
        <div className="order-2 flex items-center gap-2 lg:order-1 lg:w-72">
          <LocationSelector location={location} />
        </div>

        <div className="order-1 flex flex-col items-center gap-1 lg:order-2">
          <div className="flex items-center gap-2">
            <h1 className="animate-gradient-text bg-gradient-to-r from-primary via-accent to-forecast bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
              AeroPulse AI
            </h1>
            <span className="rounded-full border border-forecast/40 bg-forecast/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-forecast">
              v2.0 • ML-Powered
            </span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Environmental Intelligence Console
          </p>
        </div>

        <div className="order-3 flex flex-wrap items-center justify-center gap-2 lg:w-72 lg:justify-end">
          <StatusBadge status={status} dataAgeMs={dataAgeMs} />
          <span
            className="tabular rounded-lg border border-border/50 bg-secondary/40 px-2.5 py-1.5 font-mono text-xs text-foreground"
            aria-label="Current time, India Standard Time"
          >
            {clock ?? '--:--:--'} <span className="text-muted-foreground">IST</span>
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={!canExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function LocationSelector({ location }: { location: Props['location'] }) {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [draft, setDraft] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const options = [...PRESET_LOCATIONS, ...location.custom]

  return (
    <div className="relative w-full" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm transition-colors hover:border-primary/40"
      >
        <span className="flex min-w-0 items-center gap-2">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{location.location}</span>
        </span>
        <ChevronDown className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <motion.ul
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="listbox"
          className="glass-panel absolute left-0 top-full z-50 mt-2 w-full overflow-hidden p-1"
        >
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                role="option"
                aria-selected={opt === location.location}
                onClick={() => {
                  location.select(opt)
                  setOpen(false)
                }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10 ${
                  opt === location.location ? 'text-primary' : 'text-foreground'
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
          <li className="mt-1 border-t border-border/50 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setModal(true)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-accent transition-colors hover:bg-accent/10"
            >
              <Plus className="size-3.5" /> Custom location
            </button>
          </li>
        </motion.ul>
      )}

      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-sm p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Add a custom monitoring location"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Custom deployment site</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Saved to this browser for future sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(false)}
                aria-label="Close dialog"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                location.addCustom(draft)
                setDraft('')
                setModal(false)
              }}
            >
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Site name
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nagpur Lab, Block C"
                  className="mt-1.5 w-full rounded-lg border border-border/60 bg-input px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Save location
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
