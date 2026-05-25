"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  ArrowLeft, Shield, Building2, Globe, DollarSign,
  TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Landmark,
  Users, User, ChevronRight, Printer, Sparkles, RefreshCw, Save,
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
import { PrintReportButton } from "./printable-report"

// ── Jurisdiction shape ────────────────────────────────────────────────────────
interface Jurisdiction {
  id: string
  name: string
  code: string
}

// ── AI response shape ─────────────────────────────────────────────────────────
interface OptimizationData {
  assetSummary: {
    name: string
    type: string
    location: string
    purchaseValue: number
    currentValue: number
    performance: string
    currency: string
  }
  currentIdentitySummary: {
    identityName: string
    identityType: string
    location: string
    taxRate: string
    annualIncome: string
    riskProfile: string
    goals: string[]
    summary: string
  }
  baseline: {
    identityName: string
    identityType: string
    location: string
    effectiveTaxRate: string
    annualTaxLiability: number
    capitalGainsTax: number
    estateTaxExposure: number
    totalTenYearBurden: number
    summary: string
  }
  identityComparisons: Array<{
    identityName: string
    identityType: string
    location: string
    effectiveTaxRate: string
    annualTaxLiability: number
    capitalGainsTax: number
    estateTaxExposure: number
    totalTenYearBurden: number
    savingsVsBaseline: number
    savingsPercentage: string
    summary: string
    advantages: string[]
    disadvantages: string[]
    recommendedStructure: string
  }>
  jurisdictionAnalysis: Array<{
    jurisdiction: string
    code: string
    recommendedVehicle: string
    effectiveTaxRate: string
    annualTaxLiability: number
    capitalGainsTax: number
    estateTaxExposure: number
    totalTenYearBurden: number
    savingsVsBaseline: number
    savingsPercentage: string
    summary: string
    keyBenefits: string[]
    considerations: string[]
    treatyAdvantages: string
  }>
  timeHorizonAnalysis: {
    fiveYear: { baselineTax: number; optimizedTax: number; savings: number }
    tenYear: { baselineTax: number; optimizedTax: number; savings: number }
    twentyYear: { baselineTax: number; optimizedTax: number; savings: number }
    holdUntilDeath: { baselineTax: number; optimizedTax: number; savings: number }
  }
  recommendation: {
    bestStructure: string
    reasoning: string
    estimatedLifetimeSavings: number
    nextSteps: string[]
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface OptimizationResultsModalProps {
  asset: AssetWithCalculations | null
  identities: Identity[]
  jurisdictions: Jurisdiction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack: () => void
  /** Pre-loaded data for history view mode */
  initialData?: OptimizationData | null
}

// ── Loading steps ─────────────────────────────────────────────────────────────
const LOADING_STEPS = [
  "Summarizing asset profile…",
  "Analyzing identity structure…",
  "Comparing alternative identities…",
  "Evaluating offshore jurisdictions…",
  "Calculating tax savings by horizon…",
  "Generating recommendations…",
]

// ── Goal label map ────────────────────────────────────────────────────────────
const GOAL_LABELS: Record<string, string> = {
  "reduce-taxes-now": "Reduce current tax burden",
  "inheritance-tax": "Minimize inheritance tax",
  "increase-cashflow": "Increase cash flow",
  "asset-protection": "Asset protection",
  "business-optimization": "Business structure optimization",
  "retirement-planning": "Retirement planning",
  "estate-planning": "Estate planning",
  "investment-efficiency": "Investment tax efficiency",
}
const humanizeGoal = (g: string) => GOAL_LABELS[g] ?? g.replace(/-/g, " ")

// ── Component ─────────────────────────────────────────────────────────────────
export function OptimizationResultsModal({
  asset, identities, jurisdictions, open, onOpenChange, onBack, initialData,
}: OptimizationResultsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [data, setData] = useState<OptimizationData | null>(initialData ?? null)
  const [error, setError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(!!initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const isViewMode = !!initialData

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(Math.round(v))

  const identityIcon = (type: string) => {
    const t = (type ?? "").toLowerCase()
    if (t === "trust") return <Users className="size-4" />
    if (["llc", "corporation", "partnership", "entity"].includes(t))
      return <Building2 className="size-4" />
    return <User className="size-4" />
  }

  // ── Cycle loading messages ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) return
    const id = setInterval(
      () => setLoadingStep((p) => (p + 1) % LOADING_STEPS.length),
      2_200,
    )
    return () => clearInterval(id)
  }, [isLoading])

  // ── Auto-fill optional fields the model might not return ──────────────────
  const backfill = useCallback(
    (parsed: any): OptimizationData => {
      const assetPerf =
        asset?.value_change_percentage != null
          ? `${asset.value_change_percentage >= 0 ? "+" : ""}${asset.value_change_percentage.toFixed(2)}%`
          : "N/A"

      if (!parsed.assetSummary) {
        parsed.assetSummary = {
          name: asset?.name ?? "",
          type: asset?.type ?? "",
          location: [asset?.location_state, asset?.location_country].filter(Boolean).join(", ") || "—",
          purchaseValue: asset?.purchase_value ?? 0,
          currentValue: asset?.latest_valuation ?? 0,
          performance: assetPerf,
          currency: (asset as any)?.currency ?? "USD",
        }
      }

      if (!parsed.currentIdentitySummary) {
        const ci = identities[0]
        parsed.currentIdentitySummary = {
          identityName: ci?.name ?? asset?.owner?.name ?? "Unknown",
          identityType: ci?.type ?? asset?.owner?.type ?? "individual",
          location: [ci?.state_province, ci?.current_residency].filter(Boolean).join(", ") || "—",
          taxRate: ci?.tax_rate != null ? `${ci.tax_rate}%` : "Unknown",
          annualIncome: ci?.annual_income != null
            ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(ci.annual_income)
            : "Unknown",
          riskProfile: ci?.risk_profile ?? "medium",
          goals: (ci?.goals ?? []).map(humanizeGoal),
          summary: parsed.baseline?.summary ?? "",
        }
      }

      return parsed as OptimizationData
    },
    [asset, identities],
  )

  // ── Save report ───────────────────────────────────────────────────────────
  const saveReport = useCallback(
    async (reportData: OptimizationData) => {
      if (!asset || isSaving || savedId || isViewMode) return
      setIsSaving(true)
      try {
        const res = await fetch("/api/assets/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asset_id: asset.id,
            asset_name: asset.name,
            estimated_savings: reportData.recommendation?.estimatedLifetimeSavings ?? 0,
            currency: (asset as any).currency ?? "USD",
            summary: reportData.recommendation?.reasoning ?? reportData.currentIdentitySummary?.summary ?? "",
            identities: identities.map((i) => ({ name: i.name, type: i.type })),
            jurisdictions: jurisdictions.map((j) => ({ name: j.name, code: j.code })),
            report_data: reportData,
          }),
        })
        if (res.ok) {
          const saved = await res.json()
          setSavedId(saved.id)
        }
      } catch (err) {
        console.error("[saveReport]", err)
      } finally {
        setIsSaving(false)
      }
    },
    [asset, identities, jurisdictions, isSaving, savedId, isViewMode],
  )

  // ── Main generation ───────────────────────────────────────────────────────
  const generateAnalysis = useCallback(async () => {
    if (!asset || isLoading || isViewMode) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsLoading(true)
    setLoadingStep(0)
    setError(null)
    setData(null)
    setSavedId(null)

    try {
      const res = await fetch("/api/assets/optimize-advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          asset: {
            name: asset.name,
            type: asset.type,
            location_state: asset.location_state,
            location_country: asset.location_country,
            currency: (asset as any).currency ?? "USD",
            purchase_value: asset.purchase_value,
            purchase_date: asset.purchase_date,
            latest_valuation: asset.latest_valuation,
            latest_valuation_date: asset.latest_valuation_date,
            owner: asset.owner,
          },
          identities: identities.map((id) => ({
            name: id.name,
            type: id.type,
            location: [id.state_province, id.current_residency].filter(Boolean).join(", "),
            risk_profile: id.risk_profile,
            goals: id.goals,
            tax_rate: id.tax_rate,
            annual_income: id.annual_income != null ? Math.round(id.annual_income) : null,
          })),
          jurisdictions,
        }),
      })

      // ── HTTP-level errors (503, 429, 401, 400, 500) ───────────────────────
      if (!res.ok) {
        let msg = `Server error ${res.status}`
        try { msg = (await res.json()).error ?? msg } catch { /* noop */ }
        throw new Error(msg)
      }

      // ── Parse JSON response (route now returns plain JSON, not a stream) ──
      let parsed: any
      try {
        parsed = await res.json()
      } catch {
        throw new Error("AI returned an unexpected response format. Please try again.")
      }

      const final = backfill(parsed)
      setData(final)
      setHasGenerated(true)
      await saveReport(final)
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      console.error("[OptimizationResultsModal]", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }, [asset, identities, jurisdictions, isLoading, isViewMode, backfill, saveReport])

  // Auto-trigger on open
  useEffect(() => {
    if (open && !hasGenerated && !isLoading && asset && !isViewMode) generateAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Block modal close while loading
  const handleOpenChange = (next: boolean) => {
    if (!next && isLoading) return
    if (!next) abortRef.current?.abort()
    onOpenChange(next)
  }

  // Reset state when closed
  useEffect(() => {
    if (!open && !isViewMode) {
      setHasGenerated(false)
      setData(null)
      setIsLoading(false)
      setLoadingStep(0)
      setError(null)
      setSavedId(null)
    }
  }, [open, isViewMode])

  if (!asset) return null

  // ── Savings badge ─────────────────────────────────────────────────────────
  const SavingsBadge = ({ savings, pct }: { savings: number; pct: string }) =>
    savings > 0 ? (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
        <TrendingDown className="size-3 mr-1" /> Save {pct}
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        <TrendingUp className="size-3 mr-1" /> Higher cost
      </Badge>
    )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900 max-w-none print:shadow-none"
        style={{ width: "210mm", maxWidth: "95vw", height: "90vh", maxHeight: "90vh" }}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 shrink-0 print:hidden">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost" size="sm"
              className="text-white hover:bg-white/10 -ml-2"
              disabled={isLoading}
              onClick={() => { onBack(); onOpenChange(false) }}
            >
              <ArrowLeft className="size-4 mr-1" /> Back
            </Button>
            <div className="h-4 w-px bg-white/20" />
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <Sparkles className="size-3 mr-1" />
              {isViewMode ? "Saved Report" : "AI Tax Optimization"}
            </Badge>
            <div className="ml-auto flex items-center gap-2">
              {savedId && !isViewMode && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                  <Save className="size-3 mr-1" /> Saved to history
                </Badge>
              )}
              {isSaving && (
                <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 text-xs">
                  <RefreshCw className="size-3 mr-1 animate-spin" /> Saving…
                </Badge>
              )}
              {data && !isLoading && !isViewMode && (
                <Button
                  variant="ghost" size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={() => { setHasGenerated(false); setSavedId(null); generateAnalysis() }}
                >
                  <RefreshCw className="size-4 mr-1" /> Re-analyze
                </Button>
              )}
              {data && !isLoading && (
                <PrintReportButton
                  data={data}
                  assetName={asset.name}
                  className="inline-flex items-center text-sm text-white hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors"
                />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold">Tax Optimization Results</h1>
          <p className="text-slate-300 mt-1">
            Comprehensive AI analysis for{" "}
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

        {/* ── Print header ── */}
        <div className="hidden print:block px-6 py-4 border-b">
          <h1 className="text-xl font-bold">Tax Optimization Report</h1>
          <p className="text-sm text-slate-500">
            {asset.name} · Generated {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">

          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="relative">
                <div className="size-20 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="size-8 text-emerald-500" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Analyzing Tax Structures
                </h3>
                <p className="text-sm text-slate-500 min-h-[1.5rem] transition-all duration-500">
                  {LOADING_STEPS[loadingStep]}
                </p>
              </div>
              <div className="flex gap-1.5">
                {LOADING_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-all duration-500",
                      i === loadingStep ? "w-6 bg-emerald-500" : "w-2 bg-slate-300",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400">Please wait — this may take up to 30 seconds</p>
            </div>
          )}

          {/* ── Error ── */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="size-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold">Analysis Failed</h3>
              <p className="text-muted-foreground mt-2 text-center max-w-sm text-sm">{error}</p>
              {(error.includes("overloaded") || error.includes("Rate limit") || error.includes("wait")) && (
                <p className="text-xs text-slate-400 mt-1 text-center max-w-xs">
                  This is a temporary API capacity issue — you were not charged.
                </p>
              )}
              <Button className="mt-4" onClick={generateAnalysis}>Try Again</Button>
            </div>
          )}

          {/* ── Results ── */}
          {data && !isLoading && (
            <div className="space-y-6 print:space-y-4">

              {/* Asset Summary */}
              <Card className="border-slate-200 bg-white dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <Landmark className="size-4" />
                    </div>
                    Asset Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                    {[
                      { label: "Asset Name", value: data.assetSummary.name },
                      { label: "Type", value: data.assetSummary.type },
                      { label: "Location", value: data.assetSummary.location },
                      { label: "Currency", value: data.assetSummary.currency },
                      {
                        label: "Purchase Value",
                        value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
                          .format(Math.round(data.assetSummary.purchaseValue)),
                      },
                      {
                        label: "Current Value",
                        value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
                          .format(Math.round(data.assetSummary.currentValue)),
                      },
                      {
                        label: "Performance",
                        value: data.assetSummary.performance,
                        className: data.assetSummary.performance.startsWith("+")
                          ? "text-emerald-600"
                          : data.assetSummary.performance.startsWith("-")
                            ? "text-red-600" : "",
                      },
                    ].map(({ label, value, className }: { label: string; value: string; className?: string }) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                        <p className={cn("font-semibold", className)}>{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Current Identity Summary */}
              <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30 dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                        {identityIcon(data.currentIdentitySummary.identityType)}
                      </div>
                      Current Identity: {data.currentIdentitySummary.identityName}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">Associated Identity</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {[
                      { label: "Type", value: data.currentIdentitySummary.identityType },
                      { label: "Location", value: data.currentIdentitySummary.location },
                      { label: "Tax Rate", value: data.currentIdentitySummary.taxRate },
                      { label: "Annual Income", value: data.currentIdentitySummary.annualIncome },
                      { label: "Risk Profile", value: data.currentIdentitySummary.riskProfile },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                        <p className="font-medium capitalize">{value}</p>
                      </div>
                    ))}
                  </div>
                  {(data.currentIdentitySummary.goals ?? []).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Goals</p>
                      <div className="flex flex-wrap gap-1">
                        {data.currentIdentitySummary.goals.map((g, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-300 pt-1 border-t border-blue-100">
                    {data.currentIdentitySummary.summary}
                  </p>
                </CardContent>
              </Card>

              {/* Baseline */}
              <Card className="border-slate-300 bg-white dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-slate-100">
                        {identityIcon(data.baseline.identityType)}
                      </div>
                      Baseline: {data.baseline.identityName}
                    </CardTitle>
                    <Badge variant="outline">Current Structure</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                    {data.baseline.summary}
                  </p>
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
                        <TableCell>{fmt(data.baseline.annualTaxLiability)}</TableCell>
                        <TableCell>{fmt(data.baseline.capitalGainsTax)}</TableCell>
                        <TableCell>{fmt(data.baseline.estateTaxExposure)}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          {fmt(data.baseline.totalTenYearBurden)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Identity Comparisons */}
              {(data.identityComparisons ?? []).length > 0 && (
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
                                {identityIcon(identity.identityType)}
                              </div>
                              {identity.identityName}
                            </CardTitle>
                            <SavingsBadge
                              savings={identity.savingsVsBaseline}
                              pct={identity.savingsPercentage}
                            />
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
                                <TableCell className="text-sm text-right">
                                  {identity.effectiveTaxRate}
                                </TableCell>
                                <TableCell className="text-sm text-right">
                                  {identity.savingsVsBaseline > 0 ? (
                                    <span className="flex items-center justify-end gap-1 text-emerald-600">
                                      <TrendingDown className="size-3" /> Lower
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-end gap-1 text-red-500">
                                      <TrendingUp className="size-3" /> Higher
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="text-sm">10-Year Burden</TableCell>
                                <TableCell className="text-sm text-right">
                                  {fmt(identity.totalTenYearBurden)}
                                </TableCell>
                                <TableCell className={cn(
                                  "text-sm text-right font-semibold",
                                  identity.savingsVsBaseline > 0 ? "text-emerald-600" : "text-red-500",
                                )}>
                                  {identity.savingsVsBaseline > 0
                                    ? `-${fmt(identity.savingsVsBaseline)}`
                                    : `+${fmt(Math.abs(identity.savingsVsBaseline))}`}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
                                Advantages
                              </p>
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
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
                                Considerations
                              </p>
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
                          {identity.recommendedStructure && (
                            <p className="text-xs text-slate-500 pt-1">
                              <span className="font-medium">Recommended structure: </span>
                              {identity.recommendedStructure}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Jurisdiction Analysis */}
              {(data.jurisdictionAnalysis ?? []).length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Globe className="size-5 text-emerald-500" /> Jurisdiction Analysis
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.jurisdictionAnalysis.map((jur, i) => (
                      <Card
                        key={i}
                        className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                                <Globe className="size-4" />
                              </div>
                              {jur.jurisdiction}
                            </CardTitle>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <TrendingDown className="size-3 mr-1" />
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
                                <TableCell className="text-sm text-right">
                                  {jur.effectiveTaxRate}
                                </TableCell>
                                <TableCell className="text-sm text-right text-emerald-600">
                                  <span className="flex items-center justify-end gap-1">
                                    <TrendingDown className="size-3" /> Lower
                                  </span>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="text-sm">10-Year Burden</TableCell>
                                <TableCell className="text-sm text-right">
                                  {fmt(jur.totalTenYearBurden)}
                                </TableCell>
                                <TableCell className="text-sm text-right font-semibold text-emerald-600">
                                  -{fmt(jur.savingsVsBaseline)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
                              Key Benefits
                            </p>
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

              {/* Time Horizon */}
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
                          ["Sell in 5 Years", data.timeHorizonAnalysis.fiveYear],
                          ["Sell in 10 Years", data.timeHorizonAnalysis.tenYear],
                          ["Sell in 20 Years", data.timeHorizonAnalysis.twentyYear],
                          ["Hold Until Death", data.timeHorizonAnalysis.holdUntilDeath],
                        ] as const
                      ).map(([label, row], i) => (
                        <TableRow key={i} className={i === 3 ? "bg-slate-50 font-semibold" : ""}>
                          <TableCell className="font-medium">{label}</TableCell>
                          <TableCell className="text-right text-red-600">
                            {fmt(row.baselineTax)}
                          </TableCell>
                          <TableCell className="text-right">{fmt(row.optimizedTax)}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">
                            {fmt(row.savings)}
                          </TableCell>
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
                      <p className="text-xl font-bold text-slate-900">
                        {data.recommendation.bestStructure}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Estimated Lifetime Savings</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {fmt(data.recommendation.estimatedLifetimeSavings)}
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