'use client'

import { useCallback, useEffect, useState } from 'react'

export const PRESET_LOCATIONS = [
  'Trichy, Tamil Nadu',
  'Chennai, Tamil Nadu',
  'Bengaluru, Karnataka',
  'Mumbai, Maharashtra',
  'Delhi, India',
  'Pune, Maharashtra',
]

const KEY = 'aeropulse:location'
const CUSTOM_KEY = 'aeropulse:custom-locations'

export function useLocationStore() {
  const [location, setLocation] = useState(PRESET_LOCATIONS[0])
  const [custom, setCustom] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY)
      const savedCustom = window.localStorage.getItem(CUSTOM_KEY)
      if (saved) setLocation(saved)
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom)
        if (Array.isArray(parsed)) setCustom(parsed.filter((v) => typeof v === 'string'))
      }
    } catch (error) {
      console.log('[v0] location store read failed:', error)
    }
    setReady(true)
  }, [])

  const select = useCallback((value: string) => {
    setLocation(value)
    try {
      window.localStorage.setItem(KEY, value)
    } catch (error) {
      console.log('[v0] location store write failed:', error)
    }
  }, [])

  const addCustom = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return
      setCustom((prev) => {
        const next = prev.includes(trimmed) ? prev : [...prev, trimmed].slice(-6)
        try {
          window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(next))
        } catch (error) {
          console.log('[v0] custom location write failed:', error)
        }
        return next
      })
      select(trimmed)
    },
    [select],
  )

  return { location, custom, ready, select, addCustom }
}
