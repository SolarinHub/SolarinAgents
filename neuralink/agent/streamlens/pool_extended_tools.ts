import { toolkitBuilder } from "@/ai/core"
import { FETCH_POOL_DATA_KEY } from "@/ai/modules/liquidity/pool-fetcher/key"
import { ANALYZE_POOL_HEALTH_KEY } from "@/ai/modules/liquidity/health-checker/key"
import { FetchPoolDataAction } from "@/ai/modules/liquidity/pool-fetcher/action"
import { AnalyzePoolHealthAction } from "@/ai/modules/liquidity/health-checker/action"

type Toolkit = ReturnType<typeof toolkitBuilder>

/**
 * Extended toolkit exposing liquidity-related actions:
 * – fetch raw pool data
 * – run health / risk analysis on a liquidity pool
 * Includes utilities for lookup and listing
 */
export const EXTENDED_LIQUIDITY_TOOLS: Record<string, Toolkit> = Object.freeze({
  [`liquidityscan-${FETCH_POOL_DATA_KEY}`]: toolkitBuilder(new FetchPoolDataAction()),
  [`poolhealth-${ANALYZE_POOL_HEALTH_KEY}`]: toolkitBuilder(new AnalyzePoolHealthAction()),
})

/**
 * Get tool by key
 */
export function getExtendedLiquidityTool(key: string): Toolkit | undefined {
  return EXTENDED_LIQUIDITY_TOOLS[key]
}

/**
 * List all available extended liquidity tool keys
 */
export function listExtendedLiquidityToolKeys(): string[] {
  return Object.keys(EXTENDED_LIQUIDITY_TOOLS)
}
