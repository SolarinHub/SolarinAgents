export interface PairInfo {
  exchange: string
  pairAddress: string
  baseSymbol: string
  quoteSymbol: string
  liquidityUsd: number
  volume24hUsd: number
  priceUsd: number
}

export interface DexApiConfig {
  name: string
  baseUrl: string
  apiKey?: string
}

export interface DexSuiteConfig {
  apis: DexApiConfig[]
  timeoutMs?: number
  maxRetries?: number
  maxConcurrency?: number
  cacheTtlMs?: number
}

type JsonRecord = Record<string, any>

export class DexSuite {
  private timeoutMs: number
  private maxRetries: number
  private maxConcurrency: number
  private cacheTtlMs: number
  private cache = new Map<string, { expiry: number; data: PairInfo[] }>()

  constructor(private config: DexSuiteConfig) {
    if (!config.apis?.length) throw new Error("No DEX APIs provided")
    this.timeoutMs = Math.max(0, config.timeoutMs ?? 10_000)
    this.maxRetries = Math.max(0, config.maxRetries ?? 2)
    this.maxConcurrency = Math.max(1, config.maxConcurrency ?? 4)
    this.cacheTtlMs = Math.max(0, config.cacheTtlMs ?? 0)
  }

  // ---------- public API ----------

  /**
   * Retrieve aggregated pair info across all configured DEX APIs
   */
  async getPairInfo(pairAddress: string): Promise<PairInfo[]> {
    const key = this.cacheKey(pairAddress)
    const cached = this.fromCache(key)
    if (cached) return cached

    const tasks = this.config.apis.map(api => this.getPairInfoFromApi(api, pairAddress))
    const results = await this.runWithConcurrency(tasks, this.maxConcurrency)
    const merged = results.filter((x): x is PairInfo => !!x)

    if (this.cacheTtlMs > 0) this.toCache(key, merged)
    return merged
  }

  /**
   * Compare a list of pairs across exchanges, returning best volume and liquidity per pair
   */
  async comparePairs(
    pairs: string[]
  ): Promise<Record<string, { bestVolume?: PairInfo; bestLiquidity?: PairInfo }>> {
    const entries = await Promise.all(
      pairs.map(async addr => {
        const infos = await this.getPairInfo(addr)
        if (!infos.length) return [addr, { bestVolume: undefined, bestLiquidity: undefined }] as const
        const bestVolume = infos.reduce((a, b) => (b.volume24hUsd > a.volume24hUsd ? b : a))
        const bestLiquidity = infos.reduce((a, b) => (b.liquidityUsd > a.liquidityUsd ? b : a))
        return [addr, { bestVolume, bestLiquidity }] as const
      })
    )
    return Object.fromEntries(entries)
  }

  /**
   * Rank exchanges for a single pair by a weighted score (volume + liquidity)
   */
  async rankExchanges(
    pairAddress: string,
    weights: { volume?: number; liquidity?: number } = {}
  ): Promise<PairInfo[]> {
    const { volume = 1, liquidity = 1 } = weights
    const infos = await this.getPairInfo(pairAddress)
    return [...infos].sort(
      (a, b) =>
        b.volume24hUsd * volume + b.liquidityUsd * liquidity - (a.volume24hUsd * volume + a.liquidityUsd * liquidity)
    )
  }

  // ---------- internals ----------

  private cacheKey(pairAddress: string): string {
    return `pair:${pairAddress.toLowerCase()}`
  }

  private fromCache(key: string): PairInfo[] | null {
    if (this.cacheTtlMs <= 0) return null
    const hit = this.cache.get(key)
    if (hit && hit.expiry > Date.now()) return hit.data
    if (hit) this.cache.delete(key)
    return null
  }

  private toCache(key: string, data: PairInfo[]): void {
    if (this.cacheTtlMs <= 0) return
    this.cache.set(key, { expiry: Date.now() + this.cacheTtlMs, data })
  }

  private async getPairInfoFromApi(api: DexApiConfig, pairAddress: string): Promise<PairInfo | undefined> {
    try {
      const raw = await this.fetchFromApi<JsonRecord>(api, `/pair/${pairAddress}`)
      return this.normalizePair(api.name, pairAddress, raw)
    } catch {
      return undefined
    }
  }

  private async fetchFromApi<T>(api: DexApiConfig, path: string): Promise<T> {
    let attempt = 0
    let lastErr: unknown

    while (attempt <= this.maxRetries) {
      attempt++
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const res = await fetch(`${api.baseUrl}${path}`, {
          headers: api.apiKey ? { Authorization: `Bearer ${api.apiKey}` } : {},
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`${api.name} ${path} HTTP ${res.status}`)
        const json = (await res.json()) as T
        return json
      } catch (err) {
        lastErr = err
        if (attempt > this.maxRetries) break
      } finally {
        clearTimeout(timer)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("API request failed")
  }

  private normalizePair(exchange: string, pairAddress: string, data: JsonRecord): PairInfo {
    // Support multiple possible API shapes without random mapping
    const token0 = data.token0 || data.base || data.baseToken || {}
    const token1 = data.token1 || data.quote || data.quoteToken || {}

    const liquidity =
      numberOrZero(data.liquidityUsd) ??
      numberOrZero(data.liquidity_usd) ??
      numberOrZero(data.liquidity) * (numberOrZero(data.priceUsd) || 1)

    const volume24h =
      numberOrZero(data.volume24hUsd) ??
      numberOrZero(data.volume_24h_usd) ??
      numberOrZero(data.volume24h) ??
      numberOrZero(data["24hVolumeUsd"])

    const price =
      numberOrZero(data.priceUsd) ??
      numberOrZero(data.price_usd) ??
      numberOrZero(data.price)

    return {
      exchange,
      pairAddress,
      baseSymbol: token0.symbol || token0.ticker || "BASE",
      quoteSymbol: token1.symbol || token1.ticker || "QUOTE",
      liquidityUsd: liquidity,
      volume24hUsd: volume24h,
      priceUsd: price,
    }
  }

  private async runWithConcurrency<T>(
    tasks: Array<Promise<T>>,
    concurrency: number
  ): Promise<T[]> {
    const results: T[] = []
    let idx = 0

    const worker = async () => {
      while (idx < tasks.length) {
        const my = idx++
        try {
          const val = await tasks[my]
          results[my] = val
        } catch (err) {
          // @ts-ignore assign undefined on failure slot to preserve order
          results[my] = undefined
        }
      }
    }

    const workers = new Array(Math.min(concurrency, tasks.length)).fill(0).map(() => worker())
    await Promise.all(workers)
    return results
  }
}

// ---------- helpers ----------

function numberOrZero(x: any): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}
