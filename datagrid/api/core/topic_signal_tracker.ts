import type { SightCoreMessage } from "./WebSocketClient"

export interface AggregatedSignal {
  topic: string
  count: number
  lastPayload: any
  lastTimestamp: number
  firstTimestamp?: number
}

export class SignalAggregator {
  private counts: Record<string, AggregatedSignal> = {}

  /**
   * Process a new message and update aggregation
   */
  processMessage(msg: SightCoreMessage): AggregatedSignal {
    const { topic, payload, timestamp } = msg
    let entry = this.counts[topic]
    if (!entry) {
      entry = {
        topic,
        count: 0,
        lastPayload: null,
        lastTimestamp: 0,
        firstTimestamp: timestamp,
      }
    }
    entry.count += 1
    entry.lastPayload = payload
    entry.lastTimestamp = timestamp
    this.counts[topic] = entry
    return entry
  }

  /**
   * Retrieve aggregate by topic
   */
  getAggregated(topic: string): AggregatedSignal | undefined {
    return this.counts[topic]
  }

  /**
   * Retrieve all aggregates
   */
  getAllAggregated(): AggregatedSignal[] {
    return Object.values(this.counts)
  }

  /**
   * Get top topics by message count
   */
  getTopTopics(limit = 5): AggregatedSignal[] {
    return this.getAllAggregated()
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * Remove a specific topic aggregate
   */
  removeTopic(topic: string): void {
    delete this.counts[topic]
  }

  /**
   * Reset all aggregates
   */
  reset(): void {
    this.counts = {}
  }

  /**
   * Export aggregates as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.getAllAggregated())
  }

  /**
   * Import aggregates from JSON
   */
  fromJSON(json: string): void {
    try {
      const parsed = JSON.parse(json) as AggregatedSignal[]
      this.counts = {}
      for (const entry of parsed) {
        this.counts[entry.topic] = entry
      }
    } catch {
      // ignore invalid input
    }
  }
}
