export interface PricePoint {
  timestamp: number
  priceUsd: number
}

export interface TrendResult {
  startTime: number
  endTime: number
  trend: "upward" | "downward" | "neutral"
  changePct: number
}

export interface AnalyzeOptions {
  minSegmentLength?: number
  minChangePct?: number       // ignore segments with tiny net change
  smoothWindow?: number       // simple moving average window; 0/1 = no smoothing
  neutralEpsilonPct?: number  // treat |change| < epsilon as neutral
  roundDigits?: number        // rounding for changePct
}

/**
 * Analyze a series of price points to determine overall trend segments
 * Improvements: smoothing (SMA), min change filter, neutral epsilon,
 * safer boundary handling, and configurable rounding
 */
export function analyzePriceTrends(
  points: PricePoint[],
  minSegmentLength: number = 5,
  opts: AnalyzeOptions = {}
): TrendResult[] {
  const {
    minChangePct = 0,
    smoothWindow = 1,
    neutralEpsilonPct = 0.05,
    roundDigits = 2,
  } = opts

  const minLen = Math.max(1, opts.minSegmentLength ?? minSegmentLength)
  if (!Array.isArray(points) || points.length < minLen) return []

  const series = smoothWindow > 1 ? applySMA(points, smoothWindow) : points

  const results: TrendResult[] = []
  let segStart = 0

  // Helper to finalize and push a segment if it passes filters
  const pushSegment = (endIdx: number) => {
    const start = series[segStart]
    const end = series[endIdx]
    if (!start || !end) return

    const changePct = pctChange(start.priceUsd, end.priceUsd)
    const absChange = Math.abs(changePct)
    if (endIdx - segStart + 1 >= minLen && absChange >= minChangePct) {
      const trend = resolveTrend(changePct, neutralEpsilonPct)
      results.push({
        startTime: start.timestamp,
        endTime: end.timestamp,
        trend,
        changePct: round(changePct, roundDigits),
      })
      segStart = endIdx
    }
  }

  for (let i = 1; i < series.length - 1; i++) {
    const prev = series[i - 1].priceUsd
    const curr = series[i].priceUsd
    const next = series[i + 1].priceUsd

    const dirNow = direction(prev, curr)
    const dirNext = direction(curr, next)

    // Detect local maxima/minima or flat pivot (change in direction)
    const pivot = dirNow !== 0 && dirNext !== 0 && dirNow !== dirNext
    const flatToMove = dirNow === 0 && dirNext !== 0
    const moveToFlat = dirNow !== 0 && dirNext === 0

    if (pivot || flatToMove || moveToFlat) {
      pushSegment(i)
    }
  }

  // Close with the last point as segment end
  pushSegment(series.length - 1)
  return results
}

// ---------- helpers ----------

function direction(a: number, b: number): -1 | 0 | 1 {
  if (b > a) return 1
  if (b < a) return -1
  return 0
}

function pctChange(start: number, end: number): number {
  if (start === 0) return 0
  return ((end - start) / start) * 100
}

function round(value: number, digits: number): number {
  const m = Math.pow(10, Math.max(0, digits))
  return Math.round(value * m) / m
}

function resolveTrend(changePct: number, neutralEpsilonPct: number): TrendResult["trend"] {
  const abs = Math.abs(changePct)
  if (abs < neutralEpsilonPct) return "neutral"
  return changePct > 0 ? "upward" : "downward"
}

/**
 * Apply a simple moving average to price points (by priceUsd), preserving timestamps
 */
function applySMA(points: PricePoint[], window: number): PricePoint[] {
  const w = Math.max(1, Math.floor(window))
  if (w === 1 || points.length === 0) return points.slice()

  const out: PricePoint[] = []
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    sum += points[i].priceUsd
    if (i >= w) sum -= points[i - w].priceUsd
    const price = i + 1 >= w ? sum / w : sum / (i + 1)
    out.push({ timestamp: points[i].timestamp, priceUsd: price })
  }
  return out
}
