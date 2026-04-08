/**
 * Analyze on-chain orderbook depth for a given market
 * Improvements: timeouts, retries, normalization/merging of price levels,
 * safer averaging, and basic validation. (~30% expansion)
 */

export interface Order {
  price: number
  size: number
}

export interface DepthMetrics {
  averageBidDepth: number
  averageAskDepth: number
  spread: number
  midPrice?: number
  spreadPct?: number
}

export interface AnalyzerOptions {
  timeoutMs?: number
  maxRetries?: number
}

export class TokenDepthAnalyzer {
  private timeoutMs: number
  private maxRetries: number

  constructor(
    private rpcEndpoint: string,
    private marketId: string,
    opts: AnalyzerOptions = {}
  ) {
    this.timeoutMs = Math.max(0, opts.timeoutMs ?? 10_000)
    this.maxRetries = Math.max(0, opts.maxRetries ?? 2)
  }

  async fetchOrderbook(depth = 50): Promise<{ bids: Order[]; asks: Order[] }> {
    const url = `${this.rpcEndpoint}/orderbook/${encodeURIComponent(this.marketId)}?depth=${depth}`
    return await this.getJsonWithRetry(url)
  }

  async analyze(depth = 50): Promise<DepthMetrics> {
    const raw = await this.fetchOrderbook(depth)
    const bids = this.normalizeOrders(raw?.bids ?? [], "bids")
    const asks = this.normalizeOrders(raw?.asks ?? [], "asks")

    const avg = (arr: Order[]) => (arr.length ? arr.reduce((s, o) => s + o.size, 0) / arr.length : 0)

    const bestBid = bids[0]?.price ?? 0
    const bestAsk = asks[0]?.price ?? 0
    const spread = bestAsk > 0 && bestBid > 0 && bestAsk >= bestBid ? bestAsk - bestBid : 0

    const mid = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : undefined
    const spreadPct = mid && mid > 0 ? (spread / mid) * 100 : undefined

    return {
      averageBidDepth: this.round2(avg(bids)),
      averageAskDepth: this.round2(avg(asks)),
      spread: this.round6(spread),
      midPrice: mid ? this.round6(mid) : undefined,
      spreadPct: spreadPct ? this.round4(spreadPct) : undefined,
    }
  }

  // ---------- internals ----------

  private async getJsonWithRetry<T>(url: string): Promise<T> {
    let attempt = 0
    let lastErr: unknown
    while (attempt <= this.maxRetries) {
      attempt++
      const controller = new AbortController()
      const t = this.timeoutMs ? setTimeout(() => controller.abort(), this.timeoutMs) : undefined
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
        return (await res.json()) as T
      } catch (err) {
        lastErr = err
        if (attempt > this.maxRetries) break
      } finally {
        if (t) clearTimeout(t)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Orderbook request failed")
  }

  private normalizeOrders(orders: Order[], side: "bids" | "asks"): Order[] {
    const clean = orders
      .filter(
        o =>
          Number.isFinite(o.price) &&
          Number.isFinite(o.size) &&
          o.price > 0 &&
          o.size > 0
      )
      .map(o => ({ price: Number(o.price), size: Number(o.size) }))

    // Sort best-first: bids desc, asks asc
    clean.sort((a, b) => (side === "bids" ? b.price - a.price : a.price - b.price))

    // Merge identical price levels (within epsilon)
    const merged: Order[] = []
    for (const o of clean) {
      const last = merged[merged.length - 1]
      if (last && this.eqPrice(last.price, o.price)) last.size += o.size
      else merged.push({ ...o })
    }
    return merged
  }

  private eqPrice(a: number, b: number): boolean {
    return Math.abs(a - b) < 1e-9
  }

  private round2(x: number): number {
    return Math.round(x * 100) / 100
  }

  private round4(x: number): number {
    return Math.round(x * 1e4) / 1e4
  }

  private round6(x: number): number {
    return Math.round(x * 1e6) / 1e6
  }
}
