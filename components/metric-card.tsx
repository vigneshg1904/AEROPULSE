'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export function MetricCard({
  index = 0,
  icon: Icon,
  label,
  sensor,
  accent = 'text-primary',
  ring = 'border-border/50',
  cached = false,
  children,
  footer,
}: {
  index?: number
  icon: LucideIcon
  label: string
  sensor: string
  accent?: string
  ring?: string
  cached?: boolean
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className={`glass-panel glass-hover flex flex-col gap-4 border p-4 sm:p-5 ${ring}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{label}</h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {sensor}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {cached && (
            <span className="rounded-md border border-warning/40 bg-warning/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-warning">
              Cached
            </span>
          )}
          <Icon className={`size-5 ${accent}`} />
        </div>
      </header>
      <div className="flex-1">{children}</div>
      {footer && <footer className="border-t border-border/40 pt-3">{footer}</footer>}
    </motion.article>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-panel relative overflow-hidden p-5">
      <div className="shimmer relative flex flex-col gap-4">
        <div className="h-4 w-28 rounded bg-secondary/70" />
        <div className="h-10 w-32 rounded bg-secondary/60" />
        <div className="h-3 w-full rounded bg-secondary/40" />
        <div className="h-3 w-2/3 rounded bg-secondary/40" />
      </div>
    </div>
  )
}
