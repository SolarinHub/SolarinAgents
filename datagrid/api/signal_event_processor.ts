import type { Signal } from "./SignalApiClient"

/**
 * Processes raw signals into actionable events
 * Improvements: added grouping, deduplication, sorting, payload extraction,
 * type listing, and batch summarization
 */
export class SignalProcessor {
  /**
   * Filter signals by type and recency
   */
  filter(signals: Signal[], type: string, sinceTimestamp: number): Signal[] {
    return signals.filter(s => s.type === type && s.timestamp > sinceTimestamp)
  }

  /**
   * Aggregate signals by type, counting occurrences
   */
  aggregateByType(signals: Signal[]): Record<string, number> {
    return signals.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Group signals by type
   */
  groupByType(signals: Signal[]): Record<string, Signal[]> {
    return signals.reduce((acc, s) => {
      if (!acc[s.type]) acc[s.type] = []
      acc[s.type].push(s)
      return acc
    }, {} as Record<string, Signal[]>)
  }

  /**
   * Deduplicate signals by id
   */
  deduplicate(signals: Signal[]): Signal[] {
    const seen = new Set<string>()
    const unique: Signal[] = []
    for (const s of signals) {
      if (!seen.has(s.id)) {
        seen.add(s.id)
        unique.push(s)
      }
    }
    return unique
  }

  /**
   * Sort signals chronologically (ascending by timestamp)
   */
  sortByTimestamp(signals: Signal[]): Signal[] {
    return [...signals].sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Extract all payloads from signals
   */
  extractPayloads(signals: Signal[]): any[] {
    return signals.map(s => s.payload)
  }

  /**
   * List all unique types from signals
   */
  listTypes(signals: Signal[]): string[] {
    return Array.from(new Set(signals.map(s => s.type)))
  }

  /**
   * Transform a signal into a human-readable summary string
   */
  summarize(signal: Signal): string {
    const time = new Date(signal.timestamp).toISOString()
    return `[${time}] ${signal.type.toUpperCase()}: ${JSON.stringify(signal.payload)}`
  }

  /**
   * Summarize multiple signals
   */
  summarizeBatch(signals: Signal[]): string[] {
    return signals.map(s => this.summarize(s))
  }
}
