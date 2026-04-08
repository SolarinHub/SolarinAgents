<a id="readme-top"></a>

<p align="center">
  <img width="400" height="400" alt="Solarin" src="https://github.com/SolarinHub/SolarinAgents/blob/main/solarin-removebg-preview.png" />
</p>

<h1 align="center">Solarin</h1>

<div align="center">
  <p><strong>AI-native risk-first intelligence layer for Solana traders</strong></p>
  <p>
    Token structure • Wallet behavior • Narrative context • Cross-surface research • Credit-based AI execution
  </p>
</div>

<div align="center">

[![Web App](https://img.shields.io/badge/Web%20App-Open-3b82f6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://your-web-app-link)
[![Telegram Mini App](https://img.shields.io/badge/Telegram%20Mini%20App-Launch-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/your_mini_app)
[![Docs](https://img.shields.io/badge/Docs-Read-8b5cf6?style=for-the-badge&logo=readthedocs&logoColor=white)](https://your-docs-link)
[![X.com](https://img.shields.io/badge/X.com-Follow-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/your_account)
[![Telegram Community](https://img.shields.io/badge/Telegram%20Community-Join-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/your_group_or_channel)

</div>

---

<p align="center">
  <a href="#overview">Overview</a>
  ·
  <a href="#the-primitive-system-role">The Primitive</a>
  ·
  <a href="#input--output-concrete-contract">Input → Output</a>
  ·
  <a href="#fastest-integration-working-code-first">Fastest Integration</a>
  ·
  <a href="#embed-paths-where-it-lives">Embed Paths</a>
  ·
  <a href="#composable-units">Composable Units</a>
  ·
  <a href="#config-surface-control-without-pain">Config Surface</a>
  ·
  <a href="#production-notes-real-world-readiness">Production Notes</a>
  ·
  <a href="#constraints-no-surprises">Constraints</a>
</p>

---

## Overview

Solarin is a risk-first intelligence layer for Solana workflows

Instead of showing raw metrics and forcing users to interpret everything manually, it turns tokens, wallets, and market context into clear verdicts that can be used inside terminals, bots, dashboards, browser overlays, and trading flows

It is built for systems that need a fast answer to questions like these:

| Question | Solarin returns |
|---|---|
| Is this token structurally healthy | Verdict, key metrics, red and green flags |
| Is this wallet worth tracking | Trading personality, PnL shape, concentration, behavior patterns |
| What changed around this asset or theme | Compressed narrative brief with relevant context |
| Can I wire this into my own product | API-first agent calls, jobs, and event-driven flows |

> [!IMPORTANT]
> Solarin is non-custodial by design  
> It reads, scores, summarizes, and prepares context around decisions  
> Final execution always stays with the user's wallet and approvals

> [!TIP]
> The product is designed around one shared intelligence layer across web terminal, chat-native surfaces, browser overlays, and backend integrations  
> Same logic, same credits, same memory trail

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## The Primitive (System Role)

## What this is inside a system

Solarin behaves like an **opinionated risk-and-context engine** for Solana objects

Inside a larger system, it can play several roles depending on where you embed it:

| System role | What it does |
|---|---|
| Risk engine | Scores token structure and surfaces structural danger early |
| Behavior profiler | Interprets wallets as trading styles rather than raw balances |
| Narrative compressor | Turns scattered updates into short actionable briefs |
| Decision layer | Bridges analysis to the next step in a trading or monitoring flow |

In practical terms, Solarin is not a charting terminal, not a custody layer, and not a brokerage surface

It is the layer that answers  
**"How does this really look and what could go wrong"**

> [!NOTE]
> Best fit: systems that want plain-language judgment on top of on-chain data without rebuilding token analysis, wallet profiling, and narrative synthesis from scratch

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Input → Output (Concrete Contract)

## Concrete request and response shape

The contract is simple: you send Solarin an object and a mode, and it returns a structured result you can render anywhere

### Example request

```http
POST /v1/agents/run
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

```json
{
  "agent_type": "token",
  "mode": "quick",
  "network": "solana",
  "input": {
    "token_address": "So11111111111111111111111111111111111111112"
  },
  "language": "en"
}
```

### Example response

```json
{
  "run_id": "run_01hzk8example",
  "status": "completed",
  "result": {
    "verdict": "Structurally fragile token with concentrated holders and thin liquidity",
    "health_label": "fragile",
    "metrics": {
      "liquidity_depth_usd": 182430,
      "top_holders_share_pct": 47.8,
      "volatility_24h_pct": 18.2
    },
    "flags": [
      "holder concentration is elevated",
      "liquidity is relatively thin for size deployment",
      "recent price expansion lacks broad flow confirmation"
    ]
  }
}
```

This makes the output easy to reuse in:

- a Telegram reply
- a dashboard card
- an internal monitoring panel
- a browser extension overlay
- a cron-based watchlist pipeline

> [!WARNING]
> Solarin returns a structured opinion, not certainty  
> It should be treated as one strong signal in a broader decision stack

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Fastest Integration (Working Code First)

## Minimal runnable example

```js
import fetch from "node-fetch"

const API_KEY = process.env.SOLARIN_API_KEY

async function getTokenCheck(tokenAddress) {
  const res = await fetch("https://api.solarin.xyz/v1/agents/run", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      agent_type: "token",
      mode: "quick",
      network: "solana",
      input: { token_address: tokenAddress },
      language: "en"
    })
  })

  if (!res.ok) throw new Error(`Solarin error ${res.status}`)
  const data = await res.json()
  return data.result
}

getTokenCheck("So11111111111111111111111111111111111111112").then(console.log)
```

That is enough to plug Solarin into a backend endpoint, a bot command handler, a watchlist worker, or a private research tool

> [!TIP]
> Use `mode: "quick"` for user-facing responses that need to come back fast  
> Move heavy scans and multi-object analysis into jobs

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Embed Paths (Where It Lives)

Solarin is built to drop into multiple layers of a product stack without changing its core logic

| Path | Typical use | Why it fits |
|---|---|---|
| Backend API / service layer | Token checks, wallet profiles, narrative fetches | Clean place to keep secrets and normalize output |
| Script / batch / cron | Watchlist rescans, scheduled health reports, daily summaries | Good for periodic automation and monitoring |
| Worker / queue / async | Heavy reports, batched scans, long briefs | Best for jobs, retries, and webhook-driven flows |
| Frontend surface | Render results only | Useful for display, but direct API secrets should never live here |

### Backend

Best for synchronous flows where a user clicks or requests something and waits for a fast answer

### Script / batch

Useful for recurring jobs like rescoring tracked wallets or updating token health snapshots on a schedule

### Worker / async

Ideal when you want to create long-running jobs, wait for completion events, then fan results into alerts, dashboards, or messages

### Frontend

Frontend should consume Solarin results from your own backend rather than calling private endpoints directly

> [!CAUTION]
> Keep API keys server-side only  
> Do not expose workspace secrets inside browsers, public repos, or client-side bundles

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Composable Units

Solarin is easiest to integrate when treated as a small set of composable building blocks

### Core modules

| Module | Purpose |
|---|---|
| Token agent | Structural health checks for tokens |
| Wallet agent | Trading personality and behavioral profiling |
| Narrative agent | Short context and news compression |
| Jobs layer | Heavy or batched workloads |
| Events layer | Webhooks for async completion and follow-up automation |

### Adapters

Adapters are where Solarin output is translated into the shape your product needs

Examples include:

| Adapter target | Output style |
|---|---|
| Telegram / Discord bot | Short verdict + metrics + flags |
| Dashboard widget | Status pill, score, and compact breakdown |
| Internal monitor | Structured fields for rules and alerting |
| Browser extension | Inline overlay with quick context |

### Interfaces

The primary interfaces are:

- HTTPS JSON endpoints
- webhook events for async jobs
- structured results that can be rendered or piped into other systems

> [!IMPORTANT]
> Solarin is most effective when you keep its role narrow and clear  
> It should produce interpretation and context, while your own system decides how to display, persist, alert, or trade on top of it

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Config Surface (Control Without Pain)

A clean integration should be configurable without rewriting logic every time your environment changes

### Environment variables

| Variable | Purpose |
|---|---|
| `SOLARIN_API_KEY` | Auth for workspace-level API access |
| `SOLARIN_BASE_URL` | Optional override for environment or versioning |
| `SOLARIN_DEFAULT_NETWORK` | Default network selection, usually `solana` |
| `SOLARIN_DEFAULT_LANGUAGE` | Output language preference |
| `SOLARIN_TIMEOUT_MS` | Request timeout for sync calls |

### Runtime parameters

Runtime params let you shape the behavior of each request without touching deployment config

| Param | Example | Why it matters |
|---|---|---|
| `agent_type` | `token`, `wallet`, `narrative` | Selects the analysis unit |
| `mode` | `quick`, `full` | Controls cost and depth |
| `network` | `solana` | Keeps analysis chain-specific |
| `language` | `en` | Useful for user-facing surfaces |
| `input` | token address, wallet address, or question | Main object under analysis |

### Flags and control points

In your own app, it is useful to expose a few toggles above Solarin:

- quick vs deep mode
- sync run vs async job
- credit guardrails per user or workspace
- retry and timeout behavior
- webhook enabled vs polling only

> [!NOTE]
> A thin config surface is one of Solarin’s strengths  
> The same engine can serve a builder’s bot, a private desk dashboard, or a public research app with only small integration changes

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Production Notes (Real-World Readiness)

## Dependencies

At minimum, most integrations only need:

| Dependency | Why |
|---|---|
| HTTP client | Send API requests |
| Secret management | Store and rotate API keys safely |
| Logging layer | Track runs, jobs, failures, and trace IDs |
| Optional queue system | Handle heavy or async workloads cleanly |

## Performance

Solarin supports both fast-response flows and heavier async analysis patterns

| Pattern | Best use |
|---|---|
| Synchronous runs | Inline UX, commands, button clicks, small widgets |
| Async jobs | Batched scans, deep reports, pipelines, scheduled analysis |

Latency and throughput depend on request depth, object count, and plan limits, so production systems should separate user-facing quick calls from background-heavy work

## Scaling hints

- keep user-facing requests on quick mode
- push deep multi-object work into jobs
- cache recent outputs when freshness requirements allow
- set budget controls so noisy clients do not burn the full credit pool
- persist `run_id`, `job_id`, and trace identifiers for observability

## Failure handling

Good production behavior usually includes:

| Case | Recommended behavior |
|---|---|
| Invalid auth | Fail fast and do not retry blindly |
| Low credits | Surface a clear product-level message |
| Timeout | Retry only where idempotent and safe |
| Partial async failure | Preserve completed results and mark failed units |
| Duplicate events | Handle webhooks idempotently |

> [!WARNING]
> Treat webhook delivery as at-least-once  
> Your handlers should safely ignore duplicate completion events

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Constraints (No Surprises)

Every system becomes easier to trust when its limits are explicit

### Edge cases

| Edge case | What to expect |
|---|---|
| New or illiquid tokens | Limited structure confidence if on-chain depth is weak |
| Wallets with sparse history | Behavioral profiles may be shallow or inconclusive |
| Narrative spikes | Context can change faster than structure |
| Sudden market events | A clean token can still trade badly in chaotic conditions |

### Limits

Solarin is designed to improve decision quality, not remove uncertainty

It does not guarantee profitable trades, perfect timing, or complete protection from manipulation, volatility, or narrative reversals

### Unsupported or unsuitable flows

| Flow | Why it is a mismatch |
|---|---|
| Custody or asset holding | Solarin is non-custodial |
| Private key workflows | Never required and never appropriate |
| Blind client-side secret usage | Unsafe for production |
| Single-score absolutism | Results are strongest when combined with your own rules and context |

> [!CAUTION]
> Solarin should not be framed as financial advice  
> It is a structured decision-support layer for risk-aware users, builders, and research systems

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Security & Privacy

Solarin is built around a simple rule: useful intelligence should not require custody

| Principle | Meaning |
|---|---|
| Non-custodial by design | Wallets sign, Solarin does not hold assets |
| Read and route only | Analysis reads data, trade execution stays in the wallet |
| Minimal operational logging | Logs support security, reliability, and debugging |
| Clear retention boundaries | Sensitive technical data should be minimized and kept only as needed |

> [!IMPORTANT]
> Solarin never requires seed phrases or private keys  
> If a flow asks for them, it is not a valid Solarin flow

> [!NOTE]
> Operational logs may include wallet sign-ins, run status, job lifecycle events, timestamps, response codes, and abuse-prevention metadata  
> They exist for platform security, diagnostics, and product improvement rather than custody or surveillance

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Risk & Model Limitations

Solarin is a decision-support system for Solana participants who want faster structural judgment, wallet interpretation, and compressed market context

It is not a guarantee engine

Its outputs should help users kill weak ideas earlier, question hype faster, and move into deeper conviction with more clarity when something actually deserves attention

> [!WARNING]
> Structural health, wallet quality, and narrative context are all probabilistic views  
> Markets remain adversarial, fast-moving, and reflexive

> [!TIP]
> The strongest way to use Solarin is as a filter  
> quick check → deeper validation → optional action

<p align="right">(<a href="#readme-top">back to top</a>)</p>
