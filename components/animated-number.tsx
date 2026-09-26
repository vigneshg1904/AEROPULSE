'use client'

import { useEffect, useRef, useState } from 'react'

/** Tweens between telemetry values; renders an em dash when the value is unavailable. */
export function AnimatedNumber({
  value,
  digits = 0,
  className = '',
  duration = 700,
}: {
  value: number | null
  digits?: number
  className?: string
  duration?: number
}) {
  const [display, setDisplay] = useState<number | null>(value)
  const fromRef = useRef<number | null>(value)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === null || !Number.isFinite(value)) {
      setDisplay(null)
      fromRef.current = null
      return
    }
    const from = fromRef.current
    if (from === null || !Number.isFinite(from)) {
      fromRef.current = value
      setDisplay(value)
      return
    }
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (value - from) * eased)
      if (p < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = value
      }
    }
    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  return (
    <span className={`tabular font-mono ${className}`}>
      {display === null || !Number.isFinite(display) ? '—' : display.toFixed(digits)}
    </span>
  )
}
