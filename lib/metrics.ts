export type AqiBand = {
  key: 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very-poor' | 'severe'
  label: string
  cpcb: string
  range: [number, number]
  text: string
  bg: string
  border: string
  hex: string
}

export const AQI_BANDS: AqiBand[] = [
  { key: 'good', label: 'Good', cpcb: 'CPCB 0–50', range: [0, 50], text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/40', hex: '#166534' },
  { key: 'satisfactory', label: 'Satisfactory', cpcb: 'CPCB 51–100', range: [51, 100], text: 'text-lime-400', bg: 'bg-lime-400/10', border: 'border-lime-400/40', hex: '#84cc16' },
  { key: 'moderate', label: 'Moderately Polluted', cpcb: 'CPCB 101–200', range: [101, 200], text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/40', hex: '#facc15' },
  { key: 'poor', label: 'Poor', cpcb: 'CPCB 201–300', range: [201, 300], text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/40', hex: '#f97316' },
  { key: 'very-poor', label: 'Very Poor', cpcb: 'CPCB 301–400', range: [301, 400], text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/40', hex: '#dc2626' },
  { key: 'severe', label: 'Severe', cpcb: 'CPCB 401–500', range: [401, 500], text: 'text-[#800000]', bg: 'bg-[#800000]/10', border: 'border-[#800000]/50', hex: '#800000' },
]

export function aqiBand(aqi: number | null): AqiBand | null {
  if (aqi === null || !Number.isFinite(aqi)) return null
  return AQI_BANDS.find((b) => aqi >= b.range[0] && aqi <= b.range[1]) ?? AQI_BANDS[3]
}

/** NOAA Rothfusz heat index, computed in °C via °F. Falls back to dry-bulb below 27°C. */
export function heatIndexC(tempC: number | null, rh: number | null): number | null {
  if (tempC === null || rh === null) return null
  const T = tempC * 1.8 + 32
  if (T < 80) return tempC
  const R = rh
  let hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R
  if (R < 13 && T >= 80 && T <= 112) {
    hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17)
  } else if (R > 85 && T >= 80 && T <= 87) {
    hi += ((R - 85) / 10) * ((87 - T) / 5)
  }
  const out = (hi - 32) / 1.8
  return Number.isFinite(out) ? out : tempC
}

/** Magnus-Tetens dew point in °C. */
export function dewPointC(tempC: number | null, rh: number | null): number | null {
  if (tempC === null || rh === null || rh <= 0) return null
  const a = 17.27
  const b = 237.7
  const alpha = (a * tempC) / (b + tempC) + Math.log(rh / 100)
  const dp = (b * alpha) / (a - alpha)
  return Number.isFinite(dp) ? dp : null
}

export function comfortLabel(hi: number | null): string {
  if (hi === null) return 'Awaiting sensor'
  if (hi < 16) return 'Cold — heating advised'
  if (hi < 21) return 'Cool & comfortable'
  if (hi < 27) return 'Optimal comfort zone'
  if (hi < 32) return 'Warm — caution on exertion'
  if (hi < 41) return 'Heat stress likely'
  return 'Extreme heat danger'
}

export function humidityLabel(rh: number | null): string {
  if (rh === null) return 'Awaiting sensor'
  if (rh < 25) return 'Very dry — irritation risk'
  if (rh < 30) return 'Dry air'
  if (rh <= 60) return 'Ideal moisture band'
  if (rh <= 75) return 'Humid — mould watch'
  return 'Saturated — condensation risk'
}

export type Co2Grade = {
  label: string
  guide: string
  tone: 'primary' | 'info' | 'warning' | 'destructive'
}

export function co2Grade(ppm: number | null): Co2Grade {
  if (ppm === null)
    return { label: 'No reading', guide: 'Awaiting MQ-135 telemetry.', tone: 'info' }
  if (ppm <= 770)
    return { label: 'Good', guide: 'Near the 420 ppm outdoor baseline; ventilation is adequate.', tone: 'primary' }
  if (ppm <= 920)
    return { label: 'Acceptable', guide: 'ISHRAE Class B range; maintain normal ventilation.', tone: 'info' }
  if (ppm <= 1120)
    return { label: 'Ventilate', guide: 'Increase outdoor-air ventilation when practical.', tone: 'warning' }
  if (ppm < 5000)
    return { label: 'Poor ventilation', guide: 'Increase ventilation and reduce occupancy if possible.', tone: 'warning' }
  return { label: 'Exposure limit exceeded', guide: 'Leave the area and seek urgent assistance; CO2 is at or above 5000 ppm.', tone: 'destructive' }
}

export type Delta = {
  abs: number
  pct: number | null
  dir: 'up' | 'down' | 'flat'
}

export function delta(next: number | null, current: number | null): Delta | null {
  if (next === null || current === null) return null
  const abs = next - current
  const pct = current !== 0 ? (abs / Math.abs(current)) * 100 : null
  const dir = Math.abs(abs) < 0.05 ? 'flat' : abs > 0 ? 'up' : 'down'
  return { abs, pct, dir }
}

export function fmt(v: number | null, digits = 0, fallback = '—'): string {
  if (v === null || !Number.isFinite(v)) return fallback
  return v.toFixed(digits)
}

export function fmtSigned(v: number | null, digits = 1): string {
  if (v === null || !Number.isFinite(v)) return '—'
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)}`
}
