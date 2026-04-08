import type { TokenDataPoint } from "./token_data_fetcher"

export interface DataIframeConfig {
  containerId: string
  iframeUrl: string
  token: string
  apiBase?: string
  refreshMs?: number
  targetOrigin?: string // restrict postMessage destination, e.g., "https://your-domain.com"
  title?: string // optional iframe title for accessibility
}

export class TokenDataIframeEmbedder {
  private iframe?: HTMLIFrameElement
  private intervalId?: number
  private destroyed = false

  constructor(private cfg: DataIframeConfig) {}

  /**
   * Initialize the iframe and start periodic updates if configured
   */
  async init(): Promise<void> {
    const container = document.getElementById(this.cfg.containerId)
    if (!container) throw new Error(`Container not found: ${this.cfg.containerId}`)

    // Avoid double initialization
    if (this.iframe && this.iframe.isConnected) return

    this.iframe = document.createElement("iframe")
    this.iframe.src = this.cfg.iframeUrl
    this.iframe.style.border = "none"
    this.iframe.width = "100%"
    this.iframe.height = "100%"
    this.iframe.title = this.cfg.title || "Token Data"
    this.iframe.referrerPolicy = "no-referrer"
    this.iframe.loading = "lazy"

    this.iframe.onload = () => {
      // First push of data after iframe is ready
      void this.postTokenData()
    }

    container.appendChild(this.iframe)

    // Periodic refresh
    if (this.cfg.refreshMs && this.cfg.refreshMs > 0) {
      this.intervalId = window.setInterval(() => {
        void this.postTokenData()
      }, this.cfg.refreshMs)
    }
  }

  /**
   * Update the current token and immediately publish fresh data
   */
  async updateToken(nextToken: string): Promise<void> {
    this.cfg.token = nextToken
    await this.postTokenData()
  }

  /**
   * Manually trigger a data refresh
   */
  async refresh(): Promise<void> {
    await this.postTokenData()
  }

  /**
   * Stop periodic updates and remove iframe from the DOM
   */
  destroy(): void {
    this.destroyed = true
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    if (this.iframe?.isConnected) {
      this.iframe.remove()
    }
    this.iframe = undefined
  }

  /**
   * Internal: fetch latest token history and post to the embedded frame
   */
  private async postTokenData(): Promise<void> {
    if (this.destroyed) return
    if (!this.iframe?.contentWindow) return

    try {
      // Use apiBase if provided; otherwise default to iframeUrl host as a fallback
      const apiBase = this.cfg.apiBase || this.cfg.iframeUrl
      const { TokenDataFetcher } = await import("./token_data_fetcher")
      const fetcher = new TokenDataFetcher(apiBase)

      const data: TokenDataPoint[] = await fetcher.fetchHistory(this.cfg.token)
      const targetOrigin = this.cfg.targetOrigin ?? "*"

      // Avoid posting if iframe is no longer attached
      if (!this.iframe?.contentWindow) return

      this.iframe.contentWindow.postMessage(
        {
          type: "TOKEN_DATA_UPDATE",
          token: this.cfg.token,
          data,
        },
        targetOrigin
      )
    } catch (err) {
      // Surface error without throwing to avoid breaking the refresh loop
      console.error("TokenDataIframeEmbedder postTokenData error:", (err as Error)?.message || err)
    }
  }
}
