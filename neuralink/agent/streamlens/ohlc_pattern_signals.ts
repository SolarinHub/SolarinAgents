import fetch from "node-fetch"

/*------------------------------------------------------
 * Types
 *----------------------------------------------------*/

interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

export type CandlestickPattern =
  | "Hammer"
  | "ShootingStar"
  | "BullishEngulfing"
  | "BearishEngulfing"
  | "Doji"

export interface PatternSignal {
  timestamp: number
  pattern: CandlestickPattern
  confidence: number
}

/*------------------------------------------------------
 * Detector
 *----------------------------------------------------*/

interface DetectOptions {
  minConfidence?: number
  include?: CandlestickPattern[] // if provided, only these patterns are emitted
}

export class CandlestickPatternDetector {
  constructor(private readonly apiUrl: string) {}

  /* Fetch recent OHLC candles */
  async fetchCandles(symbol: string, limit = 100): Promise<Candle[]> {
    const res = await fetch(`${this.apiUrl}/markets/${encodeURIComponent(symbol)}/candles?limit=${limit}`, {
      timeout: 10_000,
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch candles ${res.status}: ${res.statusText}`)
    }
    const raw = (await res.json()) as Candle[]
    return this.validateAndNormalize(raw)
  }

  /* ------------------------- Pattern helpers ---------------------- */

  private isHammer(c: Candle): number {
    const body = Math.abs(c.close - c.open)
    const full = Math.max(c.high - c.low, 0)
    if (full === 0) return 0
    const lowerWick = Math.min(c.open, c.close) - c.low
    const ratio = body > 0 ? lowerWick / body : 0
    const bodyShare = full > 0 ? body / full : 0
    return ratio > 2 && bodyShare < 0.3 ? this.clamp(ratio / 3, 0, 1) : 0
  }

  private isShootingStar(c: Candle): number {
    const body = Math.abs(c.close - c.open)
    const full = Math.max(c.high - c.low, 0)
    if (full === 0) return 0
    const upperWick = c.high - Math.max(c.open, c.close)
    const ratio = body > 0 ? upperWick / body : 0
    const bodyShare = full > 0 ? body / full : 0
    return ratio > 2 && bodyShare < 0.3 ? this.clamp(ratio / 3, 0, 1) : 0
  }

  private isBullishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close > curr.open &&
      prev.close < prev.open &&
      curr.close >= Math.max(prev.open, prev.close) &&
      curr.open <= Math.min(prev.open, prev.close)
    if (!cond) return 0
    const bodyPrev = Math.abs(prev.close - prev.open)
    const bodyCurr = Math.abs(curr.close - curr.open)
    if (bodyCurr === 0) return 0
    return bodyPrev > 0 ? this.clamp(bodyCurr / bodyPrev, 0, 1) : 0.8
  }

  private isBearishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close < curr.open &&
      prev.close > prev.open &&
      curr.open >= Math.max(prev.open, prev.close) &&
      curr.close <= Math.min(prev.open, prev.close)
    if (!cond) return 0
    const bodyPrev = Math.abs(prev.close - prev.open)
    const bodyCurr = Math.abs(curr.close - curr.open)
    if (bodyCurr === 0) return 0
    return bodyPrev > 0 ? this.clamp(bodyCurr / bodyPrev, 0, 1) : 0.8
  }

  private isDoji(c: Candle): number {
    const range = c.high - c.low
    const body = Math.abs(c.close - c.open)
    if (range <= 0) return 0
    const ratio = body / range
    return ratio < 0.1 ? this.clamp(1 - ratio * 10, 0, 1) : 0
  }

  /* ------------------------- Detection APIs ----------------------- */

  /**
   * Detect patterns for a given set of candles
   */
  detect(candles: Candle[], options: DetectOptions = {}): PatternSignal[] {
    const minConfidence = options.minConfidence ?? 0.5
    const includeSet = options.include ? new Set(options.include) : null
    const out: PatternSignal[] = []

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]

      // Single-candle patterns
      const single: Array<[CandlestickPattern, number]> = [
        ["Hammer", this.isHammer(c)],
        ["ShootingStar", this.isShootingStar(c)],
        ["Doji", this.isDoji(c)],
      ]
      for (const [pattern, conf] of single) {
        if (conf >= minConfidence && (!includeSet || includeSet.has(pattern))) {
          out.push({ timestamp: c.timestamp, pattern, confidence: this.round2(conf) })
        }
      }

      // Two-candle patterns
      if (i > 0) {
        const p = candles[i - 1]
        const engulfBull = this.isBullishEngulfing(p, c)
        const engulfBear = this.isBearishEngulfing(p, c)
        if (engulfBull >= minConfidence && (!includeSet || includeSet.has("BullishEngulfing"))) {
          out.push({ timestamp: c.timestamp, pattern: "BullishEngulfing", confidence: this.round2(engulfBull) })
        }
        if (engulfBear >= minConfidence && (!includeSet || includeSet.has("BearishEngulfing"))) {
          out.push({ timestamp: c.timestamp, pattern: "BearishEngulfing", confidence: this.round2(engulfBear) })
        }
      }
    }

    // Merge duplicates on the same timestamp by taking max confidence
    return this.mergeByTimestamp(out)
  }

  /**
   * Convenience: fetch candles and detect in one call
   */
  async detectForSymbol(symbol: string, limit = 100, options: DetectOptions = {}): Promise<PatternSignal[]> {
    const candles = await this.fetchCandles(symbol, limit)
    return this.detect(candles, options)
  }

  /**
   * Return only signals for the final candle
   */
  detectLatest(candles: Candle[], options: DetectOptions = {}): PatternSignal[] {
    if (!candles.length) return []
    const signals = this.detect(candles.slice(-2), options) // last 2 enough for engulfing
    const lastTs = candles[candles.length - 1].timestamp
    return signals.filter(s => s.timestamp === lastTs)
  }

  /**
   * Summarize signals by pattern with counts and max confidence
   */
  summarize(signals: PatternSignal[]): Array<{
    pattern: CandlestickPattern
    count: number
    maxConfidence: number
  }> {
    const map = new Map<CandlestickPattern, { count: number; maxConfidence: number }>()
    for (const s of signals) {
      const prev = map.get(s.pattern)
      if (!prev) map.set(s.pattern, { count: 1, maxConfidence: s.confidence })
      else {
        prev.count += 1
        if (s.confidence > prev.maxConfidence) prev.maxConfidence = s.confidence
      }
    }
    return Array.from(map.entries())
      .map(([pattern, v]) => ({ pattern, ...v }))
      .sort((a, b) => b.count - a.count || b.maxConfidence - a.maxConfidence)
  }

  /* --------------------------- Utilities -------------------------- */

  private validateAndNormalize(candles: Candle[]): Candle[] {
    const out: Candle[] = []
    for (const c of candles) {
      if (
        !Number.isFinite(c.timestamp) ||
        !Number.isFinite(c.open) ||
        !Number.isFinite(c.high) ||
        !Number.isFinite(c.low) ||
        !Number.isFinite(c.close)
      ) {
        continue
      }
      // Ensure high >= max(open, close) and low <= min(open, close)
      const high = Math.max(c.high, c.open, c.close)
      const low = Math.min(c.low, c.open, c.close)
      out.push({ timestamp: c.timestamp, open: c.open, high, low, close: c.close })
    }
    // Sort ascending by time just in case
    out.sort((a, b) => a.timestamp - b.timestamp)
    return out
  }

  private mergeByTimestamp(signals: PatternSignal[]): PatternSignal[] {
    // For the same timestamp and pattern, keep the entry with the highest confidence
    const map = new Map<string, PatternSignal>()
    for (const s of signals) {
      const key = `${s.timestamp}:${s.pattern}`
      const prev = map.get(key)
      if (!prev || s.confidence > prev.confidence) map.set(key, s)
    }
    // Return sorted by time (asc)
    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp)
  }

  private clamp(x: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, x))
  }

  private round2(x: number): number {
    return Math.round(x * 100) / 100
  }
}
