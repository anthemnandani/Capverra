/**
 * POST /api/assets/optimize-advanced
 *
 * Production-grade tax optimization using claude-haiku-4-5-20251001.
 *
 * Key design decisions vs the previous version:
 *
 * 1. NON-STREAMING  — `messages.create` instead of `messages.stream`.
 *    Reason: With streaming, an "overloaded_error" arrives *inside* the SSE
 *    stream after the HTTP 200 header is already sent, so the client has no
 *    way to distinguish it from a successful (but truncated) JSON payload.
 *    Non-streaming surfaces the error *before* we write a single byte to the
 *    client, letting us return a proper HTTP 503 that the client can handle.
 *
 * 2. CORRECT OVERLOAD DETECTION — the Anthropic SDK wraps the overloaded
 *    error in an APIError whose `.status` is `undefined` (because the error
 *    comes from the SSE body, not the HTTP status line).  We must check
 *    `err.error?.type` or `err.type` instead of `err.status === 529`.
 *
 * 3. EXPONENTIAL BACKOFF RETRY — 3 attempts, 4 s / 8 s delay with ±1 s
 *    jitter.  Covers transient spikes without hammering the API.
 *
 * 4. COMPACT PROMPT — summaries capped at 30 words, arrays at 3 items.
 *    Keeps output well within 5 000-token budget on the Haiku tier.
 *
 * 5. SAFE JSON EXTRACTION — slices from first `{` to last `}` so stray
 *    preamble / trailing text never breaks JSON.parse.
 *
 * 6. PROPER HTTP STATUS CODES
 *    503 → overloaded (client shows "try again in 30–60 s")
 *    429 → rate-limited
 *    401 → unauthenticated
 *    400 → bad request
 *    500 → unexpected server error
 *
 * CHANGELOG (savingsExplanation enhancement):
 *    - Strengthened prompt rules for savingsExplanation so the model always
 *      explains HOW savings are generated, WHAT remains unaffected, and any
 *      caveats — without adding new fields or increasing token budget.
 */

import { type NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic    = "force-dynamic"
export const maxDuration = 60   // seconds — needed for Vercel

// ── Singleton client ──────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Type helpers ──────────────────────────────────────────────────────────────
interface IdentityInput {
  name:          string
  type:          string
  location:      string
  risk_profile?: string
  goals?:        string[]
  tax_rate?:     number | null
  annual_income?: number | null
}

interface JurisdictionInput { name: string; code: string }

// ── Overload / rate-limit detector ────────────────────────────────────────────
/**
 * The Anthropic SDK throws an APIError for both HTTP-level and SSE-level
 * errors.  For overloaded_error the HTTP status is sometimes `undefined`
 * because the error arrives in the SSE stream after a 200 is already sent.
 * We must inspect `err.error.type` (the nested API error object) as well.
 */
function classifyError(err: unknown): "overloaded" | "rateLimit" | "other" {
  if (!(err instanceof Anthropic.APIError)) return "other"

  const nestedType = (err as any).error?.error?.type ?? (err as any).error?.type ?? ""
  const topType    = (err as any).type ?? ""

  if (
    err.status === 529 ||
    err.status === 503 ||
    nestedType === "overloaded_error" ||
    topType    === "overloaded_error"
  ) return "overloaded"

  if (err.status === 429) return "rateLimit"

  return "other"
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────
async function withRetry<T>(
  fn:            () => Promise<T>,
  maxAttempts  = 3,
  baseDelayMs  = 4_000,
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const kind = classifyError(err)
      if ((kind !== "overloaded" && kind !== "rateLimit") || attempt === maxAttempts) throw err
      const delay = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 1_000
      console.warn(
        `[optimize-advanced] attempt ${attempt} → ${kind}. Retrying in ${Math.round(delay)} ms…`,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompts(
  asset:         Record<string, unknown>,
  identities:    IdentityInput[],
  jurisdictions: JurisdictionInput[],
): { system: string; user: string } {
  // ── system prompt — intentionally short ──────────────────────────────────
  const system = `You are an expert international tax strategist. Advise on LEGAL tax optimization only. Respond ONLY with a single valid JSON object — no markdown, no commentary, no trailing text.`

  // ── compact identity lines ────────────────────────────────────────────────
  const idLines = identities
    .map((id, i) => {
      const parts = [
        `${i + 1}. ${id.name} (${id.type}) @ ${id.location || "unknown"}`,
        `risk:${id.risk_profile ?? "medium"}`,
        id.tax_rate     != null ? `tax:${id.tax_rate}%`                              : null,
        id.annual_income != null ? `income:$${Math.round(id.annual_income)}`          : null,
        (id.goals ?? []).length ? `goals:${id.goals!.slice(0, 3).join("|")}`         : null,
      ].filter(Boolean)
      return parts.join(" | ")
    })
    .join("\n")

  const jurLines = jurisdictions.map((j) => j.name).join(", ")

  const assetPv  = asset.purchase_value  != null ? `$${Math.round(Number(asset.purchase_value))}`  : "unknown"
  const assetLv  = asset.latest_valuation != null ? `$${Math.round(Number(asset.latest_valuation))}` : "unknown"
  const assetLoc = [asset.location_state, asset.location_country].filter(Boolean).join(", ") || "unknown"
  const owner    = `${(asset.owner as any)?.name ?? "unknown"} (${(asset.owner as any)?.type ?? "unknown"})`

  // ── JSON schema — embedded once ───────────────────────────────────────────
  const schema = `{
  "assetSummary":{"name":"str","type":"str","location":"str","purchaseValue":0,"currentValue":0,"performance":"str","currency":"str"},
  "currentIdentitySummary":{"identityName":"str","identityType":"str","location":"str","taxRate":"str","annualIncome":"str","riskProfile":"str","goals":["str"],"summary":"str"},
  "baseline":{"identityName":"str","identityType":"str","location":"str","effectiveTaxRate":"str","annualTaxLiability":0,"capitalGainsTax":0,"estateTaxExposure":0,"totalTenYearBurden":0,"summary":"str"},
  "identityComparisons":[{"identityName":"str","identityType":"str","location":"str","effectiveTaxRate":"str","annualTaxLiability":0,"capitalGainsTax":0,"estateTaxExposure":0,"totalTenYearBurden":0,"savingsVsBaseline":0,"savingsPercentage":"str","summary":"str","advantages":["str"],"disadvantages":["str"],"recommendedStructure":"str"}],
  "jurisdictionAnalysis":[{"jurisdiction":"str","code":"str","recommendedVehicle":"str","effectiveTaxRate":"str","annualTaxLiability":0,"capitalGainsTax":0,"estateTaxExposure":0,"totalTenYearBurden":0,"savingsVsBaseline":0,"savingsPercentage":"str","summary":"str","keyBenefits":["str"],"considerations":["str"],"treatyAdvantages":"str"}],
  "timeHorizonAnalysis":{"fiveYear":{"baselineTax":0,"optimizedTax":0,"savings":0},"tenYear":{"baselineTax":0,"optimizedTax":0,"savings":0},"twentyYear":{"baselineTax":0,"optimizedTax":0,"savings":0},"holdUntilDeath":{"baselineTax":0,"optimizedTax":0,"savings":0}},
  "recommendation":{"bestStructure":"str","reasoning":"str","estimatedLifetimeSavings":0,"nextSteps":["str"],"savingsExplanation":{"mechanismPoints":["str"],"neutralImpacts":["str"],"risksIfAny":["str"]}}
}`

  const user = `ASSET: ${asset.name} | type:${asset.type} | loc:${assetLoc} | currency:${asset.currency ?? "USD"} | purchased:${assetPv} on ${asset.purchase_date ?? "?"} | current:${assetLv} on ${asset.latest_valuation_date ?? "?"} | owner:${owner}

IDENTITIES (index 0 = baseline/current owner):
${idLines || "0. " + owner + " (current owner)"}

JURISDICTIONS TO ANALYZE: ${jurLines || "BVI, Cayman Islands"}

Rules:
- Use realistic dollar integers (no decimals).
- savingsVsBaseline is POSITIVE when cheaper than baseline, NEGATIVE when more expensive.
- All advice must be legal. Add disclaimer in currentIdentitySummary.summary.
- Populate ALL array fields; do not return empty arrays.
- Keep every summary field under 30 words.
- Maximum 3 items in any array (advantages, disadvantages, keyBenefits, considerations, nextSteps, goals, neutralImpacts, risksIfAny).

CRITICAL — savingsExplanation (always populate; no empty strings or arrays):
- mechanismPoints: 2–4 short bullet strings. Each ≤15 words. Each must name ONE specific reason why the recommended structure saves tax. Cover different mechanisms — do NOT repeat the same point in different words. Good examples: "BVI LLC: 0% corporate tax on non-BVI sourced income", "Profit stays in entity until withdrawal — defers personal tax", "No capital gains tax on asset sale within Cayman structure", "US-UK treaty reduces withholding on dividends from 30% to 15%". Bad: vague phrases like "reduces tax burden" or "optimizes structure".
- neutralImpacts: exactly 3 items, each ≤12 words. State what does NOT change (e.g. "Legal title and asset ownership stay with current owner", "Existing contracts and banking relationships unaffected", "Day-to-day operations require no changes").
- risksIfAny: 1–2 items, each ≤12 words. Real caveats only (e.g. "Annual BVI filing fee ~$450 required", "Substance rules need local director appointment"). Use ["None identified"] only if genuinely none.

Respond with ONLY the JSON object matching this exact schema (replace 0 and "str" with real values):
${schema}`

  return { system, user }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let asset: Record<string, unknown>
  let identities: IdentityInput[]
  let jurisdictions: JurisdictionInput[]

  try {
    const body = await request.json()
    asset         = body.asset
    identities    = body.identities    ?? []
    jurisdictions = body.jurisdictions ?? []
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!asset?.name) {
    return NextResponse.json({ error: "asset.name is required" }, { status: 400 })
  }
  if (jurisdictions.length === 0) {
    return NextResponse.json(
      { error: "Select at least one jurisdiction before optimizing." },
      { status: 400 },
    )
  }

  // ── Build prompts ─────────────────────────────────────────────────────────
  const { system, user: userPrompt } = buildPrompts(asset, identities, jurisdictions)

  // ── Call Anthropic (non-streaming, with retry) ────────────────────────────
  let message: Anthropic.Message
  try {
    message = await withRetry(() =>
      anthropic.messages.create({
        model:       "claude-haiku-4-5-20251001",
        max_tokens:  5000,   // raised from 3000 — large schema needs headroom
        temperature: 0.2,    // low temperature reduces stray formatting
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    )
  } catch (err) {
    const kind = classifyError(err)
    console.error(`[optimize-advanced] Final error (${kind}):`, err)

    if (kind === "overloaded") {
      return NextResponse.json(
        { error: "The AI service is currently overloaded. Please wait 30–60 seconds and try again." },
        { status: 503 },
      )
    }
    if (kind === "rateLimit") {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait a minute before trying again." },
        { status: 429 },
      )
    }
    return NextResponse.json(
      { error: "Failed to generate optimization analysis. Please try again." },
      { status: 500 },
    )
  }

  // ── Extract text ──────────────────────────────────────────────────────────
  const rawText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")

  // Strip accidental markdown fences
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  // ── Safe JSON extraction — slice from first { to last } ───────────────────
  // Handles preamble text, trailing commentary, or minor truncation artifacts.
  const firstBrace = cleaned.indexOf("{")
  const lastBrace  = cleaned.lastIndexOf("}")

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    console.error("[optimize-advanced] No JSON object found in response:", cleaned.slice(0, 300))
    return NextResponse.json(
      { error: "AI returned an unexpected response format. Please try again." },
      { status: 500 },
    )
  }

  const jsonString = cleaned.slice(firstBrace, lastBrace + 1)

  // ── Parse and validate ────────────────────────────────────────────────────
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (parseErr) {
    console.error("[optimize-advanced] JSON.parse failed:", parseErr)
    console.error("[optimize-advanced] Extracted string (first 500 chars):", jsonString.slice(0, 500))
    return NextResponse.json(
      { error: "AI returned malformed JSON. Please try again." },
      { status: 500 },
    )
  }

  // ── Return parsed object as JSON (avoids double-stringify issues) ─────────
  return NextResponse.json(parsed, {
    status:  200,
    headers: { "Cache-Control": "no-store" },
  })
}