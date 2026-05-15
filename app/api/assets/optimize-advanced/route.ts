import { type NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    // ── Auth guard ────────────────────────────────────────────────────────────
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { asset, identities, jurisdictions } = await request.json()

    // ── Build prompts ─────────────────────────────────────────────────────────
    const identitiesInfo = identities
      .map(
        (
          id: {
            name: string
            type: string
            location: string
            risk_profile?: string
            goals?: string[]
            tax_rate?: number | null
            annual_income?: number | null
          },
          index: number,
        ) =>
          `Identity ${index + 1}:
  - Name: ${id.name}
  - Type: ${id.type}
  - Location: ${id.location}
  - Risk Profile: ${id.risk_profile ?? "medium"}
  - Goals: ${(id.goals ?? []).join(", ") || "not specified"}
  ${id.tax_rate != null ? `- Current Tax Rate: ${id.tax_rate}%` : ""}
  ${id.annual_income != null ? `- Annual Income: $${id.annual_income.toLocaleString()}` : ""}`,
      )
      .join("\n\n")

    const jurisdictionsInfo =
      jurisdictions.map((j: { name: string; code: string }) => j.name).join(", ") ||
      "BVI, Cayman Islands"

    const systemPrompt = `You are an expert international tax strategist and wealth structuring advisor with deep knowledge of global jurisdictions, holding structures, trust law, corporate vehicles, and cross-border tax treaties. You advise ultra-high-net-worth individuals on legal tax optimization strategies.

IMPORTANT RULES:
- Never ask clarifying questions. Make reasonable assumptions where data is missing and state them clearly.
- All advice must be legal and compliant. Never suggest tax evasion — only lawful avoidance and optimization.
- Always note that the user should seek qualified legal and tax counsel before implementing any strategy.
- Use actual dollar figures in all examples. Base them on the data provided, and where you must assume, state the assumption explicitly.
- Format your response as valid JSON that can be parsed.`

    const prompt = `## IDENTITIES TO COMPARE

The user has selected the following identities to compare tax liability against:

${identitiesInfo}

## OFFSHORE JURISDICTIONS TO ANALYZE

The user wants analysis of these specific jurisdictions: ${jurisdictionsInfo}

## ASSET TO OPTIMIZE

- Asset Name: ${asset.name}
- Asset Type: ${asset.type}
- Current Location: ${asset.location_state ?? ""}, ${asset.location_country ?? ""}
- Currency: ${asset.currency ?? "USD"}
- Purchase Value: ${asset.purchase_value}
- Purchase Date: ${asset.purchase_date}
- Latest Valuation: ${asset.latest_valuation}
- Latest Valuation Date: ${asset.latest_valuation_date}
- Current Owner: ${asset.owner?.name ?? "Unknown"} (${asset.owner?.type ?? "Unknown"})

---

You must respond with a JSON object in exactly this format. Do not include any text before or after the JSON:

{
  "baseline": {
    "identityName": "string - name of the baseline/current identity",
    "identityType": "string - trust/individual/company",
    "location": "string - location",
    "effectiveTaxRate": "string - e.g. 37%",
    "annualTaxLiability": number,
    "capitalGainsTax": number,
    "estateTaxExposure": number,
    "totalTenYearBurden": number,
    "summary": "string - 2-3 sentence executive summary of the baseline situation"
  },
  "identityComparisons": [
    {
      "identityName": "string",
      "identityType": "string",
      "location": "string",
      "effectiveTaxRate": "string",
      "annualTaxLiability": number,
      "capitalGainsTax": number,
      "estateTaxExposure": number,
      "totalTenYearBurden": number,
      "savingsVsBaseline": number,
      "savingsPercentage": "string - e.g. 15%",
      "summary": "string - 2-3 sentence executive summary",
      "advantages": ["string array of 2-3 key advantages"],
      "disadvantages": ["string array of 1-2 key disadvantages"],
      "recommendedStructure": "string - recommended holding structure"
    }
  ],
  "jurisdictionAnalysis": [
    {
      "jurisdiction": "string - jurisdiction name",
      "code": "string - country code",
      "recommendedVehicle": "string - e.g. IBC, LLC, Trust",
      "effectiveTaxRate": "string",
      "annualTaxLiability": number,
      "capitalGainsTax": number,
      "estateTaxExposure": number,
      "totalTenYearBurden": number,
      "savingsVsBaseline": number,
      "savingsPercentage": "string",
      "summary": "string - 2-3 sentence executive summary of why this jurisdiction works",
      "keyBenefits": ["string array of 3-4 key benefits"],
      "considerations": ["string array of 2-3 considerations or risks"],
      "treatyAdvantages": "string - relevant tax treaties"
    }
  ],
  "timeHorizonAnalysis": {
    "fiveYear": {
      "baselineTax": number,
      "optimizedTax": number,
      "savings": number
    },
    "tenYear": {
      "baselineTax": number,
      "optimizedTax": number,
      "savings": number
    },
    "twentyYear": {
      "baselineTax": number,
      "optimizedTax": number,
      "savings": number
    },
    "holdUntilDeath": {
      "baselineTax": number,
      "optimizedTax": number,
      "savings": number
    }
  },
  "recommendation": {
    "bestStructure": "string - name of the best overall structure",
    "reasoning": "string - 2-3 sentences explaining why",
    "estimatedLifetimeSavings": number,
    "nextSteps": ["string array of 3-5 actionable next steps"]
  }
}

Provide realistic tax figures based on the asset value and jurisdictions. Make reasonable assumptions and be specific with dollar amounts.`

    // ── Stream via Anthropic SDK ───────────────────────────────────────────────
    const stream = await client.messages.stream({
      model:      "claude-sonnet-4-5",
      max_tokens: 4000,
      system:     systemPrompt,
      messages:   [{ role: "user", content: prompt }],
    })

    // Pipe the text stream directly to the response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(readable, {
      headers: {
        "Content-Type":  "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("Error generating advanced optimization:", error)
    return NextResponse.json(
      { error: "Failed to generate optimization analysis" },
      { status: 500 },
    )
  }
}