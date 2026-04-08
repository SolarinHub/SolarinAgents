import type { TokenMetrics } from "./tokenAnalysisCalculator"

export interface IframeConfig {
  containerId: string
  srcUrl: string
  metrics: TokenMetrics
  refreshIntervalMs?: number
  targetOrigin?: string          // restrict postMessage destination (e.g., "https://your-domain.com")
  title?: string                 // accessibility title for the iframe
  sandbox?: string               // e.g., "allow-scripts allow-same-origin"
  referrerPolicy?: string        // e.g., "no-referrer"
  allow?: string                 // e.g., "clipboard-write"
}

export class TokenAnalysisIframe {
  private iframeEl: HTMLIFrameElement | null = null
  private refreshId: number | null = null
  private destroyed = false

  constructor(private config: IframeConfig) {}

  init(): void {
    const container = document.getElementById(this.config.containerId)
    if (!container) throw new Error("Container not found: " + this.config.containerId)

    // Avoid double initialization
    if (this.iframeEl && this.iframeEl.isConnected) return

    const iframe = document.createElement("iframe")
    iframe.src = this.config.srcUrl
    iframe.width = "100%"
    iframe.height = "100%"
    iframe.style.border = "none"
    iframe.title = this.config.title || "Token Analysis"
    iframe.referrerPolicy = this.config.referrerPolicy || "no-referrer"
    iframe.loading = "lazy"
    if (this.config.allow) iframe.setAttribute("allow", this.config.allow)
    if (this.config.sandbox) iframe.setAttribute("sandbox", this.config.sandbox)

    iframe.onload = () => {
      // First push after the frame is ready
      this.postMetrics()
    }

    container.appendChild(iframe)
    this.iframeEl = iframe

    if (this.config.refreshIntervalMs && this.config.refreshIntervalMs > 0) {
      this.refreshId = window.setInterval(() => this.postMetrics(), this.config.refreshIntervalMs)
    }
  }

  /**
   * Update metrics and immediately post them to the iframe
   */
  updateMetrics(next: TokenMetrics): void {
    this.config.metrics = next
    this.postMetrics()
  }

  /**
   * Manually trigger a post of current metrics
   */
  refresh(): void {
    this.postMetrics()
  }

  /**
   * Clean up timers and remove iframe from DOM
   */
  destroy(): void {
    this.destroyed = true
    if (this.refreshId !== null) {
      clearInterval(this.refreshId)
      this.refreshId = null
    }
    if (this.iframeEl?.isConnected) {
      this.iframeEl.remove()
    }
    this.iframeEl = null
  }

  private postMetrics(): void {
    if (this.destroyed) return
    const win = this.iframeEl?.contentWindow
    if (!win) return

    const targetOrigin = this.config.targetOrigin ?? "*"
    try {
      win.postMessage(
        { type: "TOKEN_ANALYSIS_METRICS", payload: this.config.metrics },
        targetOrigin
      )
    } catch (err) {
      // Intentionally swallow to avoid breaking periodic updates
      // Optionally hook your logger here
    }
  }
}
