'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import {
  deviceStatus,
  latestOf,
  THINGSPEAK,
  type DeviceStatus,
  type Sample,
  type TelemetryResponse,
} from '@/lib/telemetry'

const POLL_MS = THINGSPEAK.updateInterval

const fetcher = async (url: string): Promise<TelemetryResponse> => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Telemetry request failed (${res.status})`)
  return res.json()
}

/** Ticks every second so data-age and the live clock stay accurate. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export type TelemetryState = {
  samples: Sample[]
  source: 'thingspeak' | 'offline' | null
  channelName: string | null
  upstreamError?: string
  status: DeviceStatus
  lastSensorAt: number | null
  lastRealTimestamp: string | null
  dataAgeMs: number | null
  isInitialLoading: boolean
  isRefreshing: boolean
  error: string | null
  refresh: () => void
  current: {
    aqi: number | null
    temp: number | null
    humidity: number | null
    co2: number | null
  }
  predicted: {
    aqi: number | null
    temp: number | null
    co2: number | null
    at: number | null
    aqiR2: number | null
    aqiMae: number | null
    samplesUsed: number | null
  }
}

export function useTelemetry(): TelemetryState {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TelemetryResponse>(
    '/api/telemetry',
    fetcher,
    {
      refreshInterval: POLL_MS,
      revalidateOnFocus: true,
      keepPreviousData: true,
      errorRetryInterval: 5000,
    },
  )

  const now = useNow()
  // Retain the last good dataset so an upstream blip never blanks the UI.
  const cache = useRef<Sample[]>([])
  if (data?.samples?.length) cache.current = data.samples
  const samples = data?.samples?.length ? data.samples : cache.current

  return useMemo(() => {
    const aqi = latestOf(samples, 'aqi')
    const temp = latestOf(samples, 'temp')
    const humidity = latestOf(samples, 'humidity')
    const co2 = latestOf(samples, 'co2')
    const prediction = data?.prediction ?? { aqi: null, temp: null, co2: null, at: null, aqiR2: null, aqiMae: null, samplesUsed: null }

    const sensorTimes = [aqi.at, temp.at, humidity.at, co2.at].filter(
      (v): v is number => v !== null,
    )
    const lastSensorAt = sensorTimes.length ? Math.max(...sensorTimes) : null
    const reference = now ?? lastSensorAt ?? Date.now()

    return {
      samples,
      source: data?.source ?? null,
      channelName: data?.channelName ?? null,
      upstreamError: data?.error,
      status: now === null ? 'UNKNOWN' : deviceStatus(lastSensorAt, reference),
      lastSensorAt,
      lastRealTimestamp: data?.lastRealTimestamp ?? (samples.length ? samples[samples.length - 1].iso : null),
      dataAgeMs: lastSensorAt === null || now === null ? null : now - lastSensorAt,
      isInitialLoading: isLoading && samples.length === 0,
      isRefreshing: isValidating,
      error: error instanceof Error ? error.message : null,
      refresh: () => {
        void mutate()
      },
      current: {
        aqi: aqi.value,
        temp: temp.value,
        humidity: humidity.value,
        co2: co2.value,
      },
      predicted: {
        aqi: prediction.aqi,
        temp: prediction.temp,
        co2: prediction.co2,
        at: prediction.at,
        aqiR2: prediction.aqiR2,
        aqiMae: prediction.aqiMae,
        samplesUsed: prediction.samplesUsed,
      },
    }
  }, [samples, data, now, isLoading, isValidating, error, mutate])
}
