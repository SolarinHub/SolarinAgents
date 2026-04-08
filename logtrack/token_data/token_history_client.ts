export interface TokenDataPoint {
  timestamp: number
  priceUsd: number
  volumeUsd: number
  marketCapUsd: number
}

export interface FetchOptions {
  limit?: number
  since?: number
  until?: number
  timeoutMs?: number
}

export class TokenDataFetcher {
  constructor(private apiBase: string, private defaultTimeout = 15_000) {}

  /**
   * Fetches an array of TokenDataPoint for the given token symbol
   * Expects endpoint: `${apiBase}/tokens/${symbol}/history`
   */
  async fetchHistory(symbol: string, opts: FetchOptions = {}): Promise<TokenDataPoint[]> {
    const { limit, since, until, timeoutMs } = opts
    const params = new URLSearchParams()
    if (limit) params.append("limit", String(limit))
    if (since) params.append("since", String(since))
    if (until) params.append("until", String(until))

    const url = `${this.apiBase}/tokens/${encodeURIComponent(symbol)}/history${
      params.size ? `?${params.toString()}` : ""
    }`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs ?? this.defaultTimeout)

    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`Failed to fetch history for ${symbol}: HTTP ${res.status}`)
      const raw = (await res.json()) as any[]
      return raw.map(r => ({
        timestamp: (r.time ?? r.timestamp) * 1000,
        priceUsd: Number(r.priceUsd ?? r.price),
        volumeUsd: Number(r.volumeUsd ?? r.volume),
        marketCapUsd: Number(r.marketCapUsd ?? r.marketCap),
      }))
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Fetch the latest data point (most recent history)
   */
  async fetchLatest(symbol: string): Promise<TokenDataPoint | null> {
    const history = await this.fetchHistory(symbol, { limit: 1 })
    return history.length ? history[0] : null
  }

  /**
   * Fetch multiple tokens in parallel
   */
  async fetchMultiple(symbols: string[], opts: FetchOptions = {}): Promise<Record<string, TokenDataPoint[]>> {
    const results: Record<string, TokenDataPoint[]> = {}
    await Promise.all(
      symbols.map(async sym => {
        try {
          results[sym] = await this.fetchHistory(sym, opts)
        } catch {
          results[sym] = []
        }
      })
    )
    return results
  }
}
