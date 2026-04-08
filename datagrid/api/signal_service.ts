export interface Signal {
  id: string
  type: string
  timestamp: number
  payload: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Simple HTTP client for fetching and managing signals
 * Improvements: added POST, DELETE, query filters, retries, and timeout support
 */
export class SignalApiClient {
  constructor(
    private baseUrl: string,
    private apiKey?: string,
    private timeoutMs: number = 15_000,
    private maxRetries: number = 2
  ) {}

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`
    return headers
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    retries = this.maxRetries
  ): Promise<ApiResponse<T>> {
    let attempt = 0
    let lastError: string | undefined
    while (attempt <= retries) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          headers: { ...this.getHeaders(), ...(init.headers || {}) },
          signal: controller.signal,
        })
        clearTimeout(timer)
        if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
        const data = (await res.json()) as T
        return { success: true, data }
      } catch (err: any) {
        lastError = err.message
        attempt++
        if (attempt > retries) break
      } finally {
        clearTimeout(timer)
      }
    }
    return { success: false, error: lastError || "Request failed" }
  }

  async fetchAllSignals(query?: Record<string, string | number>): Promise<ApiResponse<Signal[]>> {
    const q =
      query && Object.keys(query).length
        ? "?" +
          Object.entries(query)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join("&")
        : ""
    return this.request<Signal[]>(`/signals${q}`, { method: "GET" })
  }

  async fetchSignalById(id: string): Promise<ApiResponse<Signal>> {
    return this.request<Signal>(`/signals/${encodeURIComponent(id)}`, { method: "GET" })
  }

  async createSignal(signal: Omit<Signal, "id" | "timestamp">): Promise<ApiResponse<Signal>> {
    return this.request<Signal>(`/signals`, {
      method: "POST",
      body: JSON.stringify(signal),
    })
  }

  async deleteSignal(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/signals/${encodeURIComponent(id)}`, { method: "DELETE" })
  }
}
