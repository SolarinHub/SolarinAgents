import { z } from "zod"

/**
 * Base types for any action (zod-validated)
 */

export type ActionSchema = z.ZodObject<z.ZodRawShape>

export interface ActionResponse<T> {
  notice: string
  data?: T
  error?: string
}

export interface ActionExecuteArgs<S extends ActionSchema, Ctx = unknown> {
  payload: z.infer<S>
  context: Ctx
}

export interface BaseAction<
  S extends ActionSchema,
  R,
  Ctx = unknown
> {
  /** Unique action identifier */
  id: string
  /** Short human-friendly summary */
  summary: string
  /** Zod schema describing input payload */
  input: S
  /** Execute the action with validated payload and context */
  execute(args: ActionExecuteArgs<S, Ctx>): Promise<ActionResponse<R>>
}

/**
 * Helpers for consistent responses and input validation
 */

export function ok<T>(notice: string, data?: T): ActionResponse<T> {
  return { notice, data }
}

export function fail<T = never>(notice: string, error?: string): ActionResponse<T> {
  return { notice, error: error ?? notice }
}

/**
 * Validate an unknown payload against a Zod schema.
 * Throws a descriptive error if validation fails.
 */
export function validatePayload<S extends ActionSchema>(
  schema: S,
  payload: unknown
): z.infer<S> {
  const result = schema.safeParse(payload)
  if (!result.success) {
    const message = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")
    throw new Error(`Invalid action payload: ${message}`)
  }
  return result.data
}

/**
 * Factory for quickly creating actions with embedded validation.
 */
export function makeAction<
  S extends ActionSchema,
  R,
  Ctx = unknown
>(params: {
  id: string
  summary: string
  input: S
  handler: (args: ActionExecuteArgs<S, Ctx>) => Promise<ActionResponse<R>>
}): BaseAction<S, R, Ctx> {
  const { id, summary, input, handler } = params
  return {
    id,
    summary,
    input,
    async execute(args) {
      const validated = validatePayload(input, args.payload)
      return handler({ payload: validated, context: args.context })
    },
  }
}
