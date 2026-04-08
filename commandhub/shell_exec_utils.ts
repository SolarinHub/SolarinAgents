import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs"

/**
 * Execute a shell command and return stdout or throw on error
 * Improvements: added promisified variant, logging, optional stderr capture,
 * safe output limits, and helper utilities
 */

const execAsync = promisify(exec)

export interface ExecResult {
  stdout: string
  stderr: string
  code: number
  timedOut: boolean
}

export function execCommand(
  command: string,
  timeoutMs: number = 30_000,
  captureStderr: boolean = false,
  maxBuffer: number = 5 * 1024 * 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = exec(command, { timeout: timeoutMs, maxBuffer }, (error, stdout, stderr) => {
      if (error) {
        const msg = captureStderr
          ? `Command failed: ${stderr || error.message}`
          : `Command failed: ${error.message}`
        return reject(new Error(msg))
      }
      resolve(stdout.trim())
    })
  })
}

/**
 * Execute a command and return structured result (stdout, stderr, exit code, timeout info)
 */
export async function execDetailed(
  command: string,
  timeoutMs: number = 30_000,
  maxBuffer: number = 5 * 1024 * 1024
): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs, maxBuffer })
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      code: 0,
      timedOut: false,
    }
  } catch (err: any) {
    const timedOut = err.killed && err.signal === "SIGTERM"
    return {
      stdout: (err.stdout || "").trim(),
      stderr: (err.stderr || "").trim(),
      code: typeof err.code === "number" ? err.code : 1,
      timedOut,
    }
  }
}

/**
 * Append command output to a log file
 */
export async function execAndLog(
  command: string,
  logFile: string,
  timeoutMs: number = 30_000
): Promise<void> {
  const result = await execDetailed(command, timeoutMs)
  const entry = `[${new Date().toISOString()}] CMD: ${command}\nEXIT: ${result.code}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}\n\n`
  fs.appendFileSync(logFile, entry, "utf8")
}
