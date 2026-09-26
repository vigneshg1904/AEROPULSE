import { NextResponse } from 'next/server'
import {
  THINGSPEAK,
  normalizeThingSpeak,
  type PredictionMetrics,
  type TelemetryResponse,
} from '@/lib/telemetry'

export const dynamic = 'force-dynamic'

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

function emptyPrediction(): PredictionMetrics {
  return { temp: null, aqi: null, co2: null, aqiR2: null, aqiMae: null, samplesUsed: null, at: null }
}

/**
 * Single-channel layout (ThingSpeak channel 3435535):
 *   ESP32 rows  -> field1 AQI, field2 Temp, field3 Humidity, field4 eCO2
 *   MATLAB rows -> field5 Pred Temp, field6 Pred AQI, field7 Pred CO2
 * The newest row that carries a forecast is the current prediction. It stays
 * on screen until MATLAB writes the next one (same behaviour as the LCD).
 */
function predictionFromFeeds(payload: any): PredictionMetrics {
  const feeds = Array.isArray(payload?.feeds) ? payload.feeds : []
  for (let i = feeds.length - 1; i >= 0; i--) {
    const f = feeds[i]
    const aqi = num(f?.field6)
    if (aqi === null) continue
    const t = Date.parse(f?.created_at ?? '')
    return {
      temp: num(f.field5),
      aqi,
      co2: num(f.field7),
      aqiR2: null,
      aqiMae: null,
      samplesUsed: null,
      at: Number.isFinite(t) ? t : null,
    }
  }
  return emptyPrediction()
}

export async function GET() {
  const fetchedAt = new Date().toISOString()
  try {
    const liveResponse = await fetch(
      THINGSPEAK.apiEndpoint +
        `?api_key=${THINGSPEAK.readAPIKey}&results=${THINGSPEAK.resultsCount}`,
      { cache: 'no-store' },
    )
    if (!liveResponse.ok) throw new Error(`ThingSpeak live request failed (${liveResponse.status})`)
    const livePayload = await liveResponse.json()
    // field1–field4 = AQI, Temperature, Humidity, eCO2 · field5–field7 = MATLAB forecast
    const samples = normalizeThingSpeak(livePayload)
    const prediction = predictionFromFeeds(livePayload)
    const sensorRows = samples.filter((s) => s.aqi !== null || s.temp !== null)

    const body: TelemetryResponse = {
      source: 'thingspeak',
      fetchedAt,
      channelName: livePayload.channel?.name ?? null,
      samples,
      prediction,
      lastRealTimestamp: sensorRows.at(-1)?.iso ?? null,
    }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    // No synthetic fallback: report OFFLINE with an empty dataset.
    const body: TelemetryResponse = {
      source: 'offline',
      fetchedAt,
      channelName: null,
      samples: [],
      prediction: emptyPrediction(),
      lastRealTimestamp: null,
      error: error instanceof Error ? error.message : 'Telemetry unavailable',
    }
    return NextResponse.json(body, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}
