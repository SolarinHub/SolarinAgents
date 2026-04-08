/**
 * Analyze on-chain token activity: fetch recent activity and summarize transfers
 * Improvements: JSON-RPC usage, retries, timeouts, concurrency, and mint filtering
 */

export interface ActivityRecord {
  timestamp: number
  signature: string
  source: string
  destination: string
  amount: number
}

export interface AnalyzerOptions {
  commitment?: "processed" | "confirmed" | "finalized"
  maxConcurrency?: number
  maxRetries?: number
  timeoutMs?: number
}

type JsonRpcParams = unknown[]
interface JsonRpcRequest {
  jsonrpc: "2.0"
  id: number
  method: string
  params?: JsonRpcParams
}
interface JsonRpcResponse<T = any> {
  jsonrpc: "2.0"
  id: number
  result?: T
  error?: { code: number; message: string }
}

export class TokenActivityAnalyzer {
  private idCounter = 1
  private commitment: AnalyzerOptions["commitment"]
  private maxConcurrency: number
  private maxRetries: number
  private timeoutMs: number

  constructor(private rpcEndpoint: string, opts: AnalyzerOptions = {}) {
    this.commitment = opts.commitment ?? "confirmed"
    this.maxConcurrency = Math.max(1, opts.maxConcurrency ?? 4)
    this.maxRetries = Math.max(0, opts.maxRetries ?? 2)
    this.timeoutMs = Math.max(0, opts.timeoutMs ?? 20_000)
  }

  // ---------- JSON-RPC core ----------

  private async rpc<T>(method: string, params?: JsonRpcParams): Promise<T> {
    const body: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: this.idCounter++,
      method,
      params,
    }

    const controller = new AbortController()
    const timer = this.timeoutMs ? setTimeout(() => controller.abort(), this.timeoutMs) : undefined
    try {
      const res = await fetch(this.rpcEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`RPC ${method} failed with HTTP ${res.status}`)
      const json = (await res.json()) as JsonRpcResponse<T>
      if (json.error) throw new Error(`RPC ${method} error: ${json.error.message}`)
      if (json.result === undefined) throw new Error(`RPC ${method} returned no result`)
      return json.result
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  private async rpcWithRetry<T>(method: string, params?: JsonRpcParams): Promise<T> {
    let attempt = 0
    let delay = 250
    for (;;) {
      try {
        return await this.rpc<T>(method, params)
      } catch (err) {
        if (attempt >= this.maxRetries) throw err
        await this.sleep(delay)
        delay *= 2 // deterministic backoff (no randomness)
        attempt++
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ---------- public API ----------

  /**
   * Fetch recent signatures for an address with optional pagination params
   */
  async fetchRecentSignatures(address: string, limit = 100, before?: string, until?: string): Promise<string[]> {
    const opts: any = { limit, commitment: this.commitment }
    if (before) opts.before = before
    if (until) opts.until = until

    const result = await this.rpcWithRetry<Array<{ signature: string }>>(
      "getSignaturesForAddress",
      [address, opts]
    )
    return result.map(e => e.signature)
  }

  /**
   * Fetch a transaction with metadata
   */
  private async fetchTransaction(signature: string): Promise<any | null> {
    const result = await this.rpcWithRetry<any>(
      "getTransaction",
      [signature, { maxSupportedTransactionVersion: 0, commitment: this.commitment }]
    )
    return result ?? null
  }

  /**
   * Analyze activity for a given mint by scanning recent transactions involving the given address
   * Pass the token mint and the same address (or a token account) to scope the signatures
   */
  async analyzeActivity(address: string, mint: string, limit = 50): Promise<ActivityRecord[]> {
    const signatures = await this.fetchRecentSignatures(address, limit)
    if (!signatures.length) return []

    const out: ActivityRecord[] = []
    const batches = this.chunk(signatures, this.maxConcurrency)

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map(async sig => {
          try {
            const tx = await this.fetchTransaction(sig)
            if (!tx || !tx.meta) return []
            const pre = (tx.meta.preTokenBalances || []) as any[]
            const post = (tx.meta.postTokenBalances || []) as any[]
            const bt = (tx.blockTime ?? 0) * 1000

            const records: ActivityRecord[] = []
            const n = Math.max(pre.length, post.length)
            for (let i = 0; i < n; i++) {
              const p = post[i]
              const q = pre[i]
              // Only consider balances matching the target mint
              if ((p?.mint ?? q?.mint) !== mint) continue

              const pAmt = Number(p?.uiTokenAmount?.uiAmount || 0)
              const qAmt = Number(q?.uiTokenAmount?.uiAmount || 0)
              if (!Number.isFinite(pAmt) || !Number.isFinite(qAmt)) continue

              const delta = pAmt - qAmt
              if (delta === 0) continue

              const sourceOwner = q?.owner || "unknown"
              const destOwner = p?.owner || "unknown"

              records.push({
                timestamp: bt,
                signature: sig,
                source: delta > 0 ? "unknown" : sourceOwner,
                destination: delta > 0 ? destOwner : "unknown",
                amount: Math.abs(delta),
              })
            }
            return records
          } catch {
            return []
          }
        })
      )
      for (const r of results) out.push(...r)
    }

    out.sort((a, b) => a.timestamp - b.timestamp)
    return out
  }

  // ---------- helpers ----------

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }
}
