import type { BaseAction, ActionResponse } from "./action_types"
import { z } from "zod"

interface AgentContext {
  apiEndpoint: string
  apiKey: string
  timeoutMs?: number
  metadata?: Record<string, any>
}

/**
 * Central Agent: routes calls to registered actions
 * Improvements: type safety, validation, listing, removal, and bulk registration
 */
export class Agent {
  private actions = new Map<string, BaseAction<any, any, AgentContext>>()

  /**
   * Register a new action
   */
  register<S extends z.ZodObject<any>, R>(
    action: BaseAction<S, R, AgentContext>
  ): void {
    this.actions.set(action.id, action)
  }

  /**
   * Register multiple actions at once
   */
  registerMany(actions: Array<BaseAction<any, any, AgentContext>>): void {
    for (const a of actions) {
      this.register(a)
    }
  }

  /**
   * Remove an action by id
   */
  unregister(actionId: string): boolean {
    return this.actions.delete(actionId)
  }

  /**
   * List all registered action IDs
   */
  listActions(): string[] {
    return Array.from(this.actions.keys())
  }

  /**
   * Get a registered action
   */
  getAction(id: string): BaseAction<any, any, AgentContext> | undefined {
    return this.actions.get(id)
  }

  /**
   * Invoke a registered action by id
   */
  async invoke<R>(
    actionId: string,
    payload: unknown,
    ctx: AgentContext
  ): Promise<ActionResponse<R>> {
    const action = this.actions.get(actionId)
    if (!action) throw new Error(`Unknown action "${actionId}"`)

    try {
      // validate payload with schema
      const validated = action.input.parse(payload)
      return await action.execute({ payload: validated, context: ctx })
    } catch (err: any) {
      return { notice: "Execution failed", error: err.message }
    }
  }
}
