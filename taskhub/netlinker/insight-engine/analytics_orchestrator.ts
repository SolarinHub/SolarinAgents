// Orchestrated analytics flow: activity → depth → volume patterns → task exec → signing
// Assumes the following modules exist in your project structure.
import { TokenActivityAnalyzer } from "./token_activity_analyzer"
import { TokenDepthAnalyzer } from "./token_depth_analyzer"
import { detectVolumePatterns, summarizePatterns } from "./volume_pattern_detector"
import { ExecutionEngine } from "./execution_engine"
import { SigningEngine } from "./signing_engine"

type AnyRecord = Record<string, any>

interface OrchestratorConfig {
  mint: string
  market: string
  solanaRpc: string
  dexApi: string
  activityLimit?: number
  depthLevels?: number
  patternWindow?: number
  patternThreshold?: number
}

function nowIso(): string {
  return new Date().toISOString()
}

function summarizeActivity(records: Array<{ amount: number }>) {
  const totalTx = records.length
  const totalAmount = records.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const avgAmount = totalTx ? totalAmount / totalTx : 0
  return { totalTx, totalAmount, avgAmount }
}

function safeDetectPatterns(volumes: number[], windowSize: number, threshold: number) {
  if (!Array.isArray(volumes) || volumes.length < Math.max(2, windowSize)) return []
  return detectVolumePatterns(volumes, windowSize, threshold)
}

async function main(cfg: OrchestratorConfig): Promise<void> {
  const t0 = Date.now()

  // 1) Analyze activity
  const activityAnalyzer = new TokenActivityAnalyzer(cfg.solanaRpc, { maxConcurrency: 4, timeoutMs: 20_000 })
  let records: AnyRecord[] = []
  try {
    // address param is the same as mint for this simplified example
    records = await activityAnalyzer.analyzeActivity(cfg.mint, cfg.mint, cfg.activityLimit ?? 20)
  } catch (err: any) {
    console.error(`[${nowIso()}] activity analysis error:`, err.message)
  }

  // 2) Analyze depth
  const depthAnalyzer = new TokenDepthAnalyzer(cfg.dexApi, cfg.market, { timeoutMs: 10_000, maxRetries: 2 })
  let depthMetrics: AnyRecord | null = null
  try {
    depthMetrics = await depthAnalyzer.analyze(cfg.depthLevels ?? 30)
  } catch (err: any) {
    console.error(`[${nowIso()}] depth analysis error:`, err.message)
  }

  // 3) Detect patterns
  const volumes = records.map(r => Number(r.amount) || 0)
  const patterns = safeDetectPatterns(volumes, cfg.patternWindow ?? 5, cfg.patternThreshold ?? 100)
  const patternSummary = summarizePatterns(patterns)

  // 4) Execute a custom task
  const engine = new ExecutionEngine()
  engine.register("report", async (params: { records: AnyRecord[]; depth: AnyRecord | null; patterns: AnyRecord[] }) => {
    const activity = summarizeActivity(params.records)
    return {
      activity,
      depth: params.depth,
      patterns: {
        count: params.patterns.length,
        summary: patternSummary,
      },
      generatedAt: nowIso(),
    }
  })
  engine.enqueue("task_report_1", "report", { records, depth: depthMetrics, patterns })
  const taskResults = await engine.runAll()

  // 5) Sign the results
  const signer = new SigningEngine()
  const payload = JSON.stringify(
    {
      mint: cfg.mint,
      market: cfg.market,
      depthMetrics,
      patterns,
      taskResults,
      meta: { generatedAt: nowIso(), runtimeMs: Date.now() - t0 },
    },
    null,
    2
  )

  let signature = ""
  let signatureValid = false
  try {
    signature = await signer.sign(payload)
    signatureValid = await signer.verify(payload, signature)
  } catch (err: any) {
    console.error(`[${nowIso()}] signing error:`, err.message)
  }

  console.log({
    activitySummary: summarizeActivity(records),
    depthMetrics,
    patternsCount: patterns.length,
    patternSummary,
    taskResults,
    signatureValid,
  })
}

// Example invocation (adjust endpoints and ids to real ones)
;(async () => {
  await main({
    mint: "MintPubkeyHere",
    market: "MarketPubkeyHere",
    solanaRpc: "https://solana.rpc",
    dexApi: "https://dex.api",
    activityLimit: 20,
    depthLevels: 30,
    patternWindow: 5,
    patternThreshold: 100,
  })
})()
