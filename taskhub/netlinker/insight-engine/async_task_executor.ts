/**
 * Task execution engine: registers handlers, enqueues tasks, and executes them.
 */
type Handler = (params: any) => Promise<any>

interface QueuedTask {
  id: string
  type: string
  params: any
  enqueuedAt: number
}

interface ExecutionResult {
  id: string
  result?: any
  error?: string
  executedAt: number
}

export class ExecutionEngine {
  private handlers: Record<string, Handler> = {}
  private queue: QueuedTask[] = []

  /**
   * Register a handler function for a specific task type.
   */
  register(type: string, handler: Handler): void {
    if (this.handlers[type]) {
      throw new Error(`Handler for task type "${type}" is already registered`)
    }
    this.handlers[type] = handler
  }

  /**
   * Add a task to the queue for later execution.
   */
  enqueue(id: string, type: string, params: any): void {
    if (!this.handlers[type]) {
      throw new Error(`No handler registered for task type "${type}"`)
    }
    this.queue.push({ id, type, params, enqueuedAt: Date.now() })
  }

  /**
   * Execute all tasks in the queue sequentially.
   */
  async runAll(): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = []
    while (this.queue.length) {
      const task = this.queue.shift()!
      try {
        const data = await this.handlers[task.type](task.params)
        results.push({
          id: task.id,
          result: data,
          executedAt: Date.now(),
        })
      } catch (err: any) {
        results.push({
          id: task.id,
          error: err.message,
          executedAt: Date.now(),
        })
      }
    }
    return results
  }

  /**
   * Check how many tasks are currently in the queue.
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Clear all queued tasks without executing them.
   */
  clearQueue(): void {
    this.queue = []
  }
}
