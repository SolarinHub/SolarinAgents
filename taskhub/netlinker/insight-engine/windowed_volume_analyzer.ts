/**
 * Detect volume-based patterns in a series of activity amounts
 * Improvements: input validation, variance & std dev calculation,
 * configurable comparator, normalization, richer match structure
 */

export interface PatternMatch {
  index: number
  window: number
  average: number
  stdDev?: number
  variance?: number
  values?: number[]
}

export interface PatternOptions {
  comparator?: (avg: number, threshold: number) => boolean
  normalize?: boolean
  includeValues?: boolean
}

/**
 * Scan a time series for windows where average exceeds (or satisfies comparator vs) threshold
 */
export function detectVolumePatterns(
  volumes: number[],
  windowSize: number,
  threshold: number,
  opts: PatternOptions = {}
): PatternMatch[] {
  if (!Array.isArray(volumes) || volumes.length === 0) return []
  if (windowSize <= 0) throw new Error("windowSize must be > 0")

  const comparator = opts.comparator ?? ((avg: number, thr: number) => avg >= thr)
  const normalize = opts.normalize ?? false
  const includeValues = opts.includeValues ?? false

  const matches: PatternMatch[] = []
  const n = volumes.length

  for (let i = 0; i + windowSize <= n; i++) {
    const slice = volumes.slice(i, i + windowSize)

    const sum = slice.reduce((a, b) => a + b, 0)
    const avg = sum / windowSize

    const variance =
      slice.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / windowSize
    const stdDev = Math.sqrt(variance)

    let adjustedAvg = avg
    let adjustedThreshold = threshold

    if (normalize) {
      const max = Math.max(...slice) || 1
      adjustedAvg = avg / max
      adjustedThreshold = threshold / max
    }

    if (comparator(adjustedAvg, adjustedThreshold)) {
      matches.push({
        index: i,
        window: windowSize,
        average: Math.round(avg * 1000) / 1000,
        variance: Math.round(variance * 1000) / 1000,
        stdDev: Math.round(stdDev * 1000) / 1000,
        values: includeValues ? slice : undefined,
      })
    }
  }

  return matches
}
