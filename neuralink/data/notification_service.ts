import nodemailer from "nodemailer"

export interface AlertConfig {
  email?: {
    host: string
    port: number
    user: string
    pass: string
    from: string
    to: string[]
    secure?: boolean
  }
  console?: boolean
  prefix?: string // optional prefix for all alerts
}

export interface AlertSignal {
  title: string
  message: string
  level: "info" | "warning" | "critical"
  timestamp?: number
}

export class AlertService {
  constructor(private cfg: AlertConfig) {}

  private async sendEmail(signal: AlertSignal): Promise<void> {
    if (!this.cfg.email) return
    const { host, port, user, pass, from, to, secure } = this.cfg.email
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: secure ?? false,
      auth: { user, pass },
    })
    const prefix = this.cfg.prefix ? `[${this.cfg.prefix}] ` : ""
    await transporter.sendMail({
      from,
      to,
      subject: `${prefix}[${signal.level.toUpperCase()}] ${signal.title}`,
      text: signal.message,
    })
  }

  private logConsole(signal: AlertSignal): void {
    if (!this.cfg.console) return
    const prefix = this.cfg.prefix ? `[${this.cfg.prefix}]` : "[Alert]"
    const ts = signal.timestamp ? new Date(signal.timestamp).toISOString() : new Date().toISOString()
    console.log(
      `${prefix}[${signal.level.toUpperCase()}][${ts}] ${signal.title}\n${signal.message}`
    )
  }

  async dispatch(signals: AlertSignal[]): Promise<void> {
    for (const sig of signals) {
      try {
        await this.sendEmail(sig)
      } catch (err: any) {
        console.error("Failed to send email alert:", err.message)
      }
      this.logConsole(sig)
    }
  }

  /**
   * Dispatch a single alert signal
   */
  async dispatchOne(signal: AlertSignal): Promise<void> {
    await this.dispatch([signal])
  }
}
