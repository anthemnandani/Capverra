"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft, Shield, Building2, Globe, DollarSign, Loader2,
  TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Landmark,
  Users, User, ChevronRight, Printer,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { AssetWithCalculations, Identity } from "@/lib/types"

// ── Jurisdiction shape (same as AssetDetailModal) ─────────────────────────────
interface Jurisdiction {
  id:   string
  name: string
  code: string
}

// ── AI response shape ─────────────────────────────────────────────────────────
interface OptimizationData {
  baseline: {
    identityName:       string
    identityType:       string
    location:           string
    effectiveTaxRate:   string
    annualTaxLiability: number
    capitalGainsTax:    number
    estateTaxExposure:  number
    totalTenYearBurden: number
    summary:            string
  }
  identityComparisons: Array<{
    identityName:       string
    identityType:       string
    location:           string
    effectiveTaxRate:   string
    annualTaxLiability: number
    capitalGainsTax:    number
    estateTaxExposure:  number
    totalTenYearBurden: number
    savingsVsBaseline:  number
    savingsPercentage:  string
    summary:            string
    advantages:         string[]
    disadvantages:      string[]
    recommendedStructure: string
  }>
  jurisdictionAnalysis: Array<{
    jurisdiction:       string
    code:               string
    recommendedVehicle: string
    effectiveTaxRate:   string
    annualTaxLiability: number
    capitalGainsTax:    number
    estateTaxExposure:  number
    totalTenYearBurden: number
    savingsVsBaseline:  number
    savingsPercentage:  string
    summary:            string
    keyBenefits:        string[]
    considerations:     string[]
    treatyAdvantages:   string
  }>
  timeHorizonAnalysis: {
    fiveYear:      { baselineTax: number; optimizedTax: number; savings: number }
    tenYear:       { baselineTax: number; optimizedTax: number; savings: number }
    twentyYear:    { baselineTax: number; optimizedTax: number; savings: number }
    holdUntilDeath:{ baselineTax: number; optimizedTax: number; savings: number }
  }
  recommendation: {
    bestStructure:            string
    reasoning:                string
    estimatedLifetimeSavings: number
    nextSteps:                string[]
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface OptimizationResultsModalProps {
  asset:         AssetWithCalculations | null
  identities:    Identity[]
  jurisdictions: Jurisdiction[]
  open:          boolean
  onOpenChange:  (open: boolean) => void
  onBack:        () => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export function OptimizationResultsModal({
  asset, identities, jurisdictions, open, onOpenChange, onBack,
}: OptimizationResultsModalProps) {
  const [isLoading,    setIsLoading]    = useState(false)
  const [data,         setData]         = useState<OptimizationData | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const formatMoney = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v)

  const getIdentityIcon = (type: string) => {
    if (type === "trust")   return <Users    className="size-4" />
    if (type === "llc" || type === "corporation" || type === "partnership")
                            return <Building2 className="size-4" />
    return                         <User     className="size-4" />
  }

  // ── Call API ──────────────────────────────────────────────────────────────
  const generateAnalysis = async () => {
    if (!asset) return
    setIsLoading(true)
    setError(null)

    try {
      // Build enriched identity objects for the prompt
      const identitiesPayload = identities.map((i) => ({
        name:     i.name,
        type:     i.type,
        location: [i.state_province, i.current_residency].filter(Boolean).join(", "),
        risk_profile: i.risk_profile,
        goals:    i.goals,
        tax_rate: i.tax_rate,
        annual_income: i.annual_income,
      }))

      const response = await fetch("/api/assets/optimize-advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: {
            name:                 asset.name,
            type:                 asset.type,
            location_state:       asset.location_state,
            location_country:     asset.location_country,
            currency:             asset.currency,
            purchase_value:       asset.purchase_value,
            purchase_date:        asset.purchase_date,
            latest_valuation:     asset.latest_valuation,
            latest_valuation_date: asset.latest_valuation_date,
            owner:                asset.owner,
          },
          identities: identitiesPayload,
          jurisdictions,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate analysis")

      const reader  = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullText  = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
      }

      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        setData(JSON.parse(jsonMatch[0]))
        setHasGenerated(true)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-trigger when modal opens
  useEffect(() => {
    if (open && !hasGenerated && !isLoading && asset) generateAnalysis()
  }, [open, hasGenerated, isLoading, asset])

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setHasGenerated(false)
      setData(null)
      setIsLoading(false)
      setError(null)
    }
  }, [open])

  if (!asset) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900 max-w-none"
        style={{ width: "210mm", maxWidth: "95vw", height: "297mm", maxHeight: "95vh" }}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost" size="sm"
              className="text-white hover:bg-white/10 -ml-2"
              onClick={() => { onBack(); onOpenChange(false) }}
            >
              <ArrowLeft className="size-4 mr-1" /> Back
            </Button>
            <div className="h-4 w-px bg-white/20" />
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <TrendingUp className="size-3 mr-1" /> Optimization Analysis
            </Badge>
            {data && !isLoading && (
              <Button
                variant="ghost" size="sm"
                className="text-white hover:bg-white/10 ml-auto"
                onClick={() => window.print()}
              >
                <Printer className="size-4 mr-1" /> Print Report
              </Button>
            )}
          </div>
          <h1 className="text-2xl font-bold">Tax Optimization Results</h1>
          <p className="text-slate-300 mt-1">
            Comprehensive analysis for{" "}
            <span className="font-semibold text-white">{asset.name}</span>
          </p>
          <div className="flex flex-wrap items-center gap-6 mt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Landmark className="size-4 text-slate-400" />
              Type: <span className="font-medium ml-1">{asset.type}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="size-4 text-slate-400" />
              Value:{" "}
              <span className="font-medium ml-1">
                {asset.latest_valuation != null
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
                      .format(asset.latest_valuation)
                  : "—"}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="size-4 text-slate-400" />
              Identities: <span className="font-medium ml-1">{identities.length}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="size-4 text-slate-400" />
              Jurisdictions: <span className="font-medium ml-1">{jurisdictions.length}</span>
            </span>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="size-12 text-emerald-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Analyzing Tax Structures</h3>
              <p className="text-slate-500 mt-2">
                Comparing jurisdictions and calculating potential savings…
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="size-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold">Analysis Failed</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button className="mt-4" onClick={generateAnalysis}>Try Again</Button>
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-6">

              {/* Baseline */}
              <Card className="border-slate-300 bg-white dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-slate-100">
                        {getIdentityIcon(data.baseline.identityType)}
                      </div>
                      Baseline: {data.baseline.identityName}
                    </CardTitle>
                    <Badge variant="outline">Current Structure</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">{data.baseline.summary}</p>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Effective Tax Rate</TableHead>
                        <TableHead className="text-xs">Annual Tax</TableHead>
                        <TableHead className="text-xs">Capital Gains Tax</TableHead>
                        <TableHead className="text-xs">Estate Tax</TableHead>
                        <TableHead className="text-xs">10-Year Burden</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold">{data.baseline.effectiveTaxRate}</TableCell>
                        <TableCell>{formatMoney(data.baseline.annualTaxLiability)}</TableCell>
                        <TableCell>{formatMoney(data.baseline.capitalGainsTax)}</TableCell>
                        <TableCell>{formatMoney(data.baseline.estateTaxExposure)}</TableCell>
                        <TableCell className="font-semibold text-red-600">{formatMoney(data.baseline.totalTenYearBurden)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Identity comparisons */}
              {data.identityComparisons.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="size-5 text-blue-500" /> Identity Comparisons
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.identityComparisons.map((identity, i) => (
                      <Card key={i} className="border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                                {getIdentityIcon(identity.identityType)}
                              </div>
                              {identity.identityName}
                            </CardTitle>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <TrendingUp className="size-3 mr-1" />
                              Save {identity.savingsPercentage}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-slate-600">{identity.summary}</p>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-blue-50/50">
                                <TableHead className="text-xs">Metric</TableHead>
                                <TableHead className="text-xs text-right">Value</TableHead>
                                <TableHead className="text-xs text-right">vs Baseline</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="text-sm">Effective Tax Rate</TableCell>
                                <TableCell className="text-sm text-right">{identity.effectiveTaxRate}</TableCell>
                                <TableCell className="text-sm text-right text-emerald-600">
                                  <span className="flex items-center justify-end gap-1">
                                    <TrendingDown className="size-3" /> Lower
                                  </span>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="text-sm">10-Year Burden</TableCell>
                                <TableCell className="text-sm text-right">{formatMoney(identity.totalTenYearBurden)}</TableCell>
                                <TableCell className="text-sm text-right font-semibold text-emerald-600">
                                  -{formatMoney(identity.savingsVsBaseline)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Advantages</p>
                              <ul className="space-y-1">
                                {identity.advantages.map((adv, j) => (
                                  <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                                    <CheckCircle2 className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                                    {adv}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Considerations</p>
                              <ul className="space-y-1">
                                {identity.disadvantages.map((dis, j) => (
                                  <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                                    <AlertCircle className="size-3 text-amber-500 mt-0.5 shrink-0" />
                                    {dis}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 pt-1">
                            <span className="font-medium">Recommended structure: </span>
                            {identity.recommendedStructure}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Jurisdiction analysis */}
              {data.jurisdictionAnalysis.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Globe className="size-5 text-emerald-500" /> Jurisdiction Analysis
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.jurisdictionAnalysis.map((jur, i) => (
                      <Card key={i} className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                                <Globe className="size-4" />
                              </div>
                              {jur.jurisdiction}
                            </CardTitle>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <TrendingUp className="size-3 mr-1" />
                              Save {jur.savingsPercentage}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Recommended:{" "}
                            <span className="font-medium text-slate-700">{jur.recommendedVehicle}</span>
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-slate-600">{jur.summary}</p>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-emerald-50/50">
                                <TableHead className="text-xs">Metric</TableHead>
                                <TableHead className="text-xs text-right">Value</TableHead>
                                <TableHead className="text-xs text-right">vs Baseline</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="text-sm">Effective Tax Rate</TableCell>
                                <TableCell className="text-sm text-right">{jur.effectiveTaxRate}</TableCell>
                                <TableCell className="text-sm text-right text-emerald-600">
                                  <span className="flex items-center justify-end gap-1">
                                    <TrendingDown className="size-3" /> Lower
                                  </span>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="text-sm">10-Year Burden</TableCell>
                                <TableCell className="text-sm text-right">{formatMoney(jur.totalTenYearBurden)}</TableCell>
                                <TableCell className="text-sm text-right font-semibold text-emerald-600">
                                  -{formatMoney(jur.savingsVsBaseline)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Key Benefits</p>
                            <ul className="space-y-1">
                              {jur.keyBenefits.map((b, j) => (
                                <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                                  <CheckCircle2 className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {jur.treatyAdvantages && (
                            <div className="text-xs bg-slate-50 rounded-lg p-2">
                              <span className="font-semibold text-slate-500">Treaty Advantages: </span>
                              <span className="text-slate-600">{jur.treatyAdvantages}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Time horizon */}
              <Card className="border-slate-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="size-5 text-purple-500" />
                    Tax Savings by Time Horizon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Time Horizon</TableHead>
                        <TableHead className="text-xs text-right">Baseline Tax</TableHead>
                        <TableHead className="text-xs text-right">Optimized Tax</TableHead>
                        <TableHead className="text-xs text-right">Estimated Savings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(
                        [
                          ["Sell in 5 Years",   data.timeHorizonAnalysis.fiveYear],
                          ["Sell in 10 Years",  data.timeHorizonAnalysis.tenYear],
                          ["Sell in 20 Years",  data.timeHorizonAnalysis.twentyYear],
                          ["Hold Until Death",  data.timeHorizonAnalysis.holdUntilDeath],
                        ] as const
                      ).map(([label, row], i) => (
                        <TableRow key={i} className={i === 3 ? "bg-slate-50 font-semibold" : ""}>
                          <TableCell className="font-medium">{label}</TableCell>
                          <TableCell className="text-right text-red-600">{formatMoney(row.baselineTax)}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.optimizedTax)}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">{formatMoney(row.savings)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recommendation */}
              <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-emerald-500" /> Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-emerald-200">
                    <div>
                      <p className="text-sm text-slate-500">Best Structure</p>
                      <p className="text-xl font-bold text-slate-900">{data.recommendation.bestStructure}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Estimated Lifetime Savings</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatMoney(data.recommendation.estimatedLifetimeSavings)}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-600">{data.recommendation.reasoning}</p>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Next Steps</p>
                    <ul className="space-y-2">
                      {data.recommendation.nextSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <ChevronRight className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-xs text-slate-500 pt-4 border-t border-slate-200">
                    <strong>Disclaimer:</strong> This analysis is for informational purposes only and does
                    not constitute legal, tax, or financial advice. Please consult with qualified legal,
                    tax, and compliance advisors in the relevant jurisdictions before taking any action.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}