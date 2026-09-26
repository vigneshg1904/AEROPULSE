import type { Sample } from './telemetry'

const HEADERS = [
  'timestamp_iso',
  'timestamp_local',
  'aqi_field1',
  'temperature_c_field2',
  'humidity_pct_field3',
  'co2_ppm_field4',
  'pred_temperature_c_field5',
  'pred_aqi_field6',
  'pred_co2_ppm_field7',
]

const cell = (v: number | null) => (v === null ? '' : String(v))

/** CSV is UTF-8 BOM prefixed so Excel / SheetJS open it with correct encoding. */
export function buildCsv(samples: Sample[], location: string): string {
  const rows = samples.map((s) =>
    [
      s.iso,
      new Date(s.t).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      cell(s.aqi),
      cell(s.temp),
      cell(s.humidity),
      cell(s.co2),
      cell(s.predTemp),
      cell(s.predAqi),
      cell(s.predCo2),
    ].join(','),
  )
  return `\ufeff# AeroPulse AI dataset — ${location} — exported ${new Date().toISOString()}\n${HEADERS.join(',')}\n${rows.join('\n')}\n`
}

export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportDataset(samples: Sample[], location: string) {
  const slug = location.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  downloadBlob(
    buildCsv(samples, location),
    `aeropulse-${slug}-${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8',
  )
}

/** Rasterises the first <svg> inside a container into a downloadable PNG. */
export async function exportChartPng(container: HTMLElement | null, filename: string) {
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return

  const clone = svg.cloneNode(true) as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const data = new XMLSerializer().serializeToString(clone)
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`

  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Chart rasterisation failed'))
    img.src = svgUrl
  })

  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename, 'image/png')
  }, 'image/png')
}
