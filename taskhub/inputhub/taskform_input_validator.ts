import { z } from "zod"

/**
 * Schema for scheduling a new task via Typeform submission.
 */
export const TaskFormSchema = z.object({
  taskName: z.string().min(3, "Task name must be at least 3 characters").max(100, "Task name must be at most 100 characters"),
  taskType: z.enum(["anomalyScan", "tokenAnalytics", "whaleMonitor"], {
    required_error: "Task type is required",
    invalid_type_error: "Task type must be one of anomalyScan, tokenAnalytics, whaleMonitor",
  }),
  parameters: z
    .record(z.string(), z.string())
    .refine(obj => Object.keys(obj).length > 0, {
      message: "Parameters must include at least one key",
    }),
  scheduleCron: z
    .string()
    .regex(
      /^(\*|[0-5]?\d)\s+(\*|[01]?\d|2[0-3])\s+(\*|[1-9]|[12]\d|3[01])\s+(\*|[1-9]|1[0-2])\s+(\*|[0-6])$/,
      "Invalid cron expression (must be 5 fields: min hour day month weekday)"
    ),
})

export type TaskFormInput = z.infer<typeof TaskFormSchema>
