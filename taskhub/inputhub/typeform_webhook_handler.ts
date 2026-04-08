import type { TaskFormInput } from "./taskFormSchemas"
import { TaskFormSchema } from "./taskFormSchemas"

/**
 * Result shape for processing a Typeform webhook payload
 */
export interface TypeformProcessResult {
  success: boolean
  message: string
  task?: ScheduledTask
}

/**
 * Minimal scheduled task representation
 */
export interface ScheduledTask {
  id: string
  name: string
  type: string
  parameters: Record<string, string>
  cron: string
  createdAt: string
}

/**
 * Basic 5-field cron validator (minute hour day-of-month month day-of-week)
 * Accepts numbers, '*', ranges and step expressions like */5
 */
const CRON_5F_REGEX =
  /^(\*|([0-5]?\d)(-([0-5]?\d))?(\/([1-5]?\d))?)\s+(\*|([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?(\/([1-9]|[12]\d|3[01]))?)\s+(\*|([1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?(\/([1-9]|[12]\d|3[01]))?)\s+(\*|(1[0-2]|[1-9])(-(1[0-2]|[1-9]))?(\/([1-9]|1[0-2]))?)\s+(\*|([0-7])(-([0-7]))?(\/([1-7])))$/

/**
 * Deterministic non-random ID from input using a simple 32-bit hash
 * Avoids randomness per project preferences
 */
function deterministicId(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0")
  return `tsk_${hex}`
}

/**
 * Extract readable validation issues from Zod error
 */
function zodIssuesToMessage(issues: Array<{ path: (string | number)[]; message: string }>): string {
  return issues
    .map(i => {
      const p = i.path.join(".") || "<root>"
      return `${p}: ${i.message}`
    })
    .join("; ")
}

/**
 * Normalize and validate a cron string (5-field)
 */
function normalizeCron(cron: string): string {
  const c = cron.trim().replace(/\s+/g, " ")
  if (!CRON_5F_REGEX.test(c)) {
    throw new Error(`Invalid CRON expression: "${cron}"`)
  }
  return c
}

/**
 * Processes a Typeform webhook payload to schedule a new task
 */
export async function handleTypeformSubmission(raw: unknown): Promise<TypeformProcessResult> {
  const parsed = TaskFormSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      message: `Validation error: ${zodIssuesToMessage(parsed.error.issues as any)}`,
    }
  }

  // Strongly type the parsed payload
  const { taskName, taskType, parameters, scheduleCron } = parsed.data as TaskFormInput

  // Additional guards (beyond schema)
  const name = taskName.trim()
  if (!name) {
    return { success: false, message: "Validation error: taskName cannot be empty" }
  }
  if (!parameters || Object.keys(parameters).length === 0) {
    return { success: false, message: "Validation error: parameters must include at least one key" }
  }

  let cron: string
  try {
    cron = normalizeCron(scheduleCron)
  } catch (err: any) {
    return { success: false, message: err.message }
  }

  // Build a deterministic ID derived from task fields
  const idSeed = `${name}|${taskType}|${cron}|${Object.keys(parameters).sort().join(",")}`
  const taskId = deterministicId(idSeed)

  // Create the task object (ready for a downstream scheduler to consume)
  const task: ScheduledTask = {
    id: taskId,
    name,
    type: taskType,
    parameters,
    cron,
    createdAt: new Date().toISOString(),
  }

  // Here you could forward `task` to your scheduler/queue (HTTP/RPC/db), e.g.:
  // await scheduler.enqueue(task) — omitted intentionally to keep this function pure

  return {
    success: true,
    message: `Task "${name}" scheduled with ID ${taskId}`,
    task,
  }
}
