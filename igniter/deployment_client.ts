export interface LaunchConfig {
  contractName: string
  parameters: Record<string, any>
  deployEndpoint: string
  apiKey?: string
  timeoutMs?: number
  retries?: number
}

export interface LaunchResult {
  success: boolean
  address?: string
  transactionHash?: string
  error?: string
  rawResponse?: any
}

/**
 * LaunchNode: deploys smart contracts to a given endpoint
 * Improvements: retry logic, timeout, validation, and dry-run support
 */
export class LaunchNode {
  private timeoutMs: number
  private retries: number

  constructor(private config: LaunchConfig) {
    this.timeoutMs = config.timeoutMs ?? 20_000
    this.retries = config.retries ?? 2
  }

  private validateConfig(): void {
    if (!this.config.contractName) throw new Error("Missing contractName")
    if (!this.config.deployEndpoint) throw new Error("Missing deployEndpoint")
    if (!this.config.parameters || typeof this.config.parameters !== "object")
      throw new Error("Invalid parameters")
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    if (!this.timeoutMs) return promise
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      // @ts-ignore - signal supported by fetch
      const result = await promise
      return result
    } finally {
      clearTimeout(timer)
    }
  }

  async deploy(dryRun = false): Promise<LaunchResult> {
    this.validateConfig()
    const { deployEndpoint, apiKey, contractName, parameters } = this.config
    let attempt = 0
    let lastError: string | undefined

    while (attempt <= this.retries) {
      attempt++
      try {
        if (dryRun) {
          return {
            success: true,
            address: "0xDRYRUN",
            transactionHash: "0xDRYRUNHASH",
          }
        }

        const res = await this.withTimeout(
          fetch(deployEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify({ contractName, parameters }),
          })
        )
        if (!res.ok) {
          const text = await res.text()
          lastError = `HTTP ${res.status}: ${text}`
          continue
        }
        const json = await res.json()
        return {
          success: true,
          address: json.contractAddress,
          transactionHash: json.txHash,
          rawResponse: json,
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    return { success: false, error: lastError || "Unknown deployment error" }
  }
}
