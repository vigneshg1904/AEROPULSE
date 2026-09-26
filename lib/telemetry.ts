export type RawFeed = {
  created_at: string
  entry_id: number
  field1: string | null
  field2: string | null
  field3: string | null
  field4: string | null
  field5: string | null
  field6: string | null
  field7: string | null
}

export type RawChannel = {
  id?: number
  name?: string
  description?: string
  latitude?: string
  longitude?: string
  last_entry_id?: number
}

export type ThingSpeakPayload = {
  channel?: RawChannel
  feeds?: RawFeed[]
}

/** One normalised telemetry sample. Nulls mean "sensor did not report". */
export type Sample = {
  t: number // epoch ms
  iso: string
  aqi: number | null
  temp: number | null
  humidity: number | null
  co2: number | null
  predTemp: number | null
  predAqi: number | null
  predCo2: number | null
}

export type DeviceStatus = 'LIVE' | 'DELAYED' | 'OFFLINE' | 'UNKNOWN'

export type PredictionMetrics = {
  temp: number | null
  aqi: number | null
  co2: number | null
  aqiR2: number | null
  aqiMae: number | null
  samplesUsed: number | null
  at: number | null
}

export type TelemetryResponse = {
  source: 'thingspeak' | 'offline'
  fetchedAt: string
  channelName: string | null
  samples: Sample[]
  prediction: PredictionMetrics
  lastRealTimestamp: string | null
  error?: string
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

export function normalizeThingSpeak(payload: ThingSpeakPayload): Sample[] {
  const feeds = Array.isArray(payload?.feeds) ? payload.feeds : []
  return feeds
    .map((f): Sample | null => {
      const t = Date.parse(f?.created_at ?? '')
      if (!Number.isFinite(t)) return null
      return {
        t,
        iso: new Date(t).toISOString(),
        aqi: clampRange(num(f.field1), 0, 500),
        temp: clampRange(num(f.field2), -40, 90),
        humidity: clampRange(num(f.field3), 0, 100),
        co2: clampRange(num(f.field4), 0, 20000),
        predTemp: clampRange(num(f.field5), -40, 90),
        predAqi: clampRange(num(f.field6), 0, 500),
        predCo2: clampRange(num(f.field7), 0, 20000),
      } satisfies Sample
    })
    .filter((s): s is Sample => s !== null)
    .sort((a, b) => a.t - b.t)
}

function clampRange(v: number | null, min: number, max: number): number | null {
  if (v === null) return null
  if (v < min || v > max) return null
  return v
}

/** Latest non-null value for a numeric key, plus the sample it came from. */
export function latestOf(
  samples: Sample[],
  key: 'aqi' | 'temp' | 'humidity' | 'co2' | 'predTemp' | 'predAqi' | 'predCo2',
): { value: number | null; at: number | null } {
  for (let i = samples.length - 1; i >= 0; i--) {
    const v = samples[i][key]
    if (v !== null) return { value: v, at: samples[i].t }
  }
  return { value: null, at: null }
}

export function deviceStatus(lastSensorAt: number | null, now: number): DeviceStatus {
  if (lastSensorAt === null) return 'UNKNOWN'
  const ageSec = (now - lastSensorAt) / 1000
  // ESP32 publishes every 35 s, so allow one missed poll before "DELAYED"
  if (ageSec < 60) return 'LIVE'
  if (ageSec <= 150) return 'DELAYED'
  return 'OFFLINE'
}

export function formatAge(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return '—'
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m ago`
  return `${Math.floor(h / 24)}d ${h % 24}h ago`
}

/**
 * Non-secret ThingSpeak channel parameters. Safe to import on the client.
 * API keys live server-side only (see app/api/telemetry/route.ts).
 */
const THINGSPEAK_CHANNEL_ID = '3435535'

export const THINGSPEAK = {
  channelId: THINGSPEAK_CHANNEL_ID,
  apiEndpoint: `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json`,
  readAPIKey: 'ST5E6UTIKN4U1QII',
  resultsCount: 200,
  updateInterval: 5_000,
  feedsUrl(apiKey: string, results: number = 200) {
    return `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${apiKey}&results=${results}`
  },
} as const

export const THINGSPEAK_CHANNEL = THINGSPEAK.channelId
