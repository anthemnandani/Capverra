"use client"

import { useState, useEffect } from "react"
import {
  Check, Users, Building2, User, MapPin,
  Sparkles, AlertCircle, Loader2, Zap,
} from "lucide-react"
import { OptimizationResultsModal } from "@/components/assets/optimization-results-modal"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"
import { usePlan } from "@/hooks/use-plan"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { countries } from "@/lib/countries"
import type { AssetWithCalculations, Identity } from "@/lib/types"

// ── Jurisdictions ─────────────────────────────────────────────────────────────
const JURISDICTIONS = [
  { id: "bvi",             name: "British Virgin Islands (BVI)", code: "VG" },
  { id: "cayman",          name: "Cayman Islands",               code: "KY" },
  { id: "isle-of-man",     name: "Isle of Man",                  code: "IM" },
  { id: "mauritius",       name: "Mauritius",                    code: "MU" },
  { id: "luxembourg",      name: "Luxembourg",                   code: "LU" },
  { id: "singapore",       name: "Singapore",                    code: "SG" },
  { id: "hong-kong",       name: "Hong Kong",                    code: "HK" },
  { id: "cyprus",          name: "Cyprus",                       code: "CY" },
  { id: "malta",           name: "Malta",                        code: "MT" },
  { id: "jersey-guernsey", name: "Jersey / Guernsey",            code: "JE" },
  { id: "panama",          name: "Panama",                       code: "PA" },
  { id: "liechtenstein",   name: "Liechtenstein",                code: "LI" },
  { id: "other",           name: "Other Suitable Jurisdiction",  code: "XX" },
]

const getCountryName = (code: string | null | undefined): string => {
  if (!code) return ""
  const found = countries.find((c) => c.code === code)
  return found ? found.name : code
}

const ownerTypeIcons: Record<string, React.ReactNode> = {
  Individual:  <User      className="size-3.5" />,
  LLC:         <Building2 className="size-3.5" />,
  Trust:       <Users     className="size-3.5" />,
  individual:  <User      className="size-3.5" />,
  corporation: <Building2 className="size-3.5" />,
  partnership: <Building2 className="size-3.5" />,
  trust:       <Users     className="size-3.5" />,
  entity:      <Building2 className="size-3.5" />,
}

const identityTypeBadgeStyles: Record<string, string> = {
  Individual:  "bg-green-100  text-green-700",
  individual:  "bg-green-100  text-green-700",
  trust:       "bg-amber-100  text-amber-700",
  Trust:       "bg-amber-100  text-amber-700",
  LLC:         "bg-purple-100 text-purple-700",
  llc:         "bg-purple-100 text-purple-700",
  corporation: "bg-purple-100 text-purple-700",
  partnership: "bg-amber-100  text-amber-700",
  entity:      "bg-purple-100 text-purple-700",
}

interface AssetDetailModalProps {
  asset:         AssetWithCalculations | null
  allIdentities: Identity[]
  open:          boolean
  onOpenChange:  (open: boolean) => void
}

export function AssetDetailModal({
  asset, allIdentities, open, onOpenChange,
}: AssetDetailModalProps) {
  const [selectedIdentities,    setSelectedIdentities]    = useState<string[]>([])
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([])
  const [showResults,           setShowResults]           = useState(false)
  const [showUpgrade,           setShowUpgrade]           = useState(false)
  const [jurisdictionError,     setJurisdictionError]     = useState(false)

  // ── Plan status ───────────────────────────────────────────────────────────
  const { planStatus, isLoading: planLoading, refetch: refetchPlan } = usePlan()

  // Max identities user can pick = plan limit - 1 (current identity always included)
  const maxAdditionalIdentities = Math.max(0, planStatus.identity_limit - 1)
  const maxJurisdictions        = planStatus.jurisdiction_limit

  // Reset selections when modal opens (in case limits changed after upgrade)
  useEffect(() => {
    if (open) {
      refetchPlan()
      setSelectedIdentities([])
      setSelectedJurisdictions([])
      setJurisdictionError(false)
    }
  }, [open, refetchPlan])

  if (!asset) return null

  const currentIdentityId = asset.owner_id ?? ""
  const otherIdentities   = allIdentities.filter((i) => i.id !== currentIdentityId)
  const currentIdentity   = allIdentities.find((i)  => i.id === currentIdentityId)

  // ── Toggles ───────────────────────────────────────────────────────────────
  const handleIdentityToggle = (id: string) => {
    setSelectedIdentities((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= maxAdditionalIdentities) return prev
      return [...prev, id]
    })
  }

  const handleJurisdictionToggle = (id: string) => {
    setJurisdictionError(false)
    setSelectedJurisdictions((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= maxJurisdictions) return prev
      return [...prev, id]
    })
  }

  // ── Optimize Now ──────────────────────────────────────────────────────────
  const handleOptimizeNow = () => {
    // 1. Check report limit first
    if (!planStatus.has_active_plan && planStatus.plan_id === "free") {
      // Free plan — check remaining via planStatus
      if (planStatus.reports_remaining <= 0) {
        setShowUpgrade(true)
        return
      }
    } else if (planStatus.has_active_plan && planStatus.reports_remaining <= 0) {
      setShowUpgrade(true)
      return
    } else if (!planStatus.has_active_plan && planStatus.plan_id !== "free") {
      // Exhausted paid plan
      setShowUpgrade(true)
      return
    }

    // 2. Check jurisdiction selection
    if (selectedJurisdictions.length === 0) {
      setJurisdictionError(true)
      return
    }

    setJurisdictionError(false)
    setShowResults(true)
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const selectedIdentityObjects: Identity[] = [
    ...(currentIdentity ? [currentIdentity] : []),
    ...selectedIdentities
      .map((id) => allIdentities.find((i) => i.id === id))
      .filter(Boolean) as Identity[],
  ]

  const selectedJurisdictionObjects = selectedJurisdictions
    .map((id) => JURISDICTIONS.find((j) => j.id === id))
    .filter(Boolean) as typeof JURISDICTIONS

  const pct        = asset.value_change_percentage
  const isPositive = (pct ?? 0) >= 0

  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)
      : "—"

  const buildIdentityLocation = (identity: Identity | undefined): string => {
    if (!identity) return "—"
    const parts = [
      identity.state_province,
      getCountryName(identity.current_residency),
    ].filter(Boolean)
    return parts.join(", ") || "—"
  }

  // ── Plan limit pill ───────────────────────────────────────────────────────
  const LimitPill = () => {
    if (planLoading) return null
    const isExhausted = planStatus.reports_remaining <= 0
    return (
      <div className={cn(
        "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border w-fit",
        isExhausted
          ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
          : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
      )}>
        <Sparkles className="size-3" />
        {isExhausted
          ? `${planStatus.plan_name} plan exhausted`
          : `${planStatus.reports_remaining} report${planStatus.reports_remaining === 1 ? "" : "s"} remaining · ${planStatus.plan_name}`
        }
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">{asset.name}</DialogTitle>
              <DialogDescription>
                View asset details, compare identities, and run AI tax optimization
              </DialogDescription>
            </div>
            <LimitPill />
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">

          {/* ── Asset info ── */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Asset Information
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-1/2 text-xs">Property</TableHead>
                    <TableHead className="text-xs">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Asset Name</TableCell>
                    <TableCell className="text-sm py-2">{asset.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Type</TableCell>
                    <TableCell className="py-2"><Badge variant="outline">{asset.type}</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Location</TableCell>
                    <TableCell className="text-sm py-2">
                      {[asset.location_state, getCountryName(asset.location_country)]
                        .filter(Boolean).join(", ") || "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Purchase Value</TableCell>
                    <TableCell className="text-sm py-2">{formatCurrency(asset.purchase_value)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Latest Valuation</TableCell>
                    <TableCell className="text-sm py-2">{formatCurrency(asset.latest_valuation)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Performance</TableCell>
                    <TableCell className="py-2">
                      {pct != null ? (
                        <span className={cn("text-sm font-medium", isPositive ? "text-emerald-600" : "text-red-600")}>
                          {isPositive ? "+" : ""}{pct.toFixed(2)}%
                        </span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ── Current identity ── */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Associated Identity
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-1/2 text-xs">Property</TableHead>
                    <TableHead className="text-xs">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Identity Name</TableCell>
                    <TableCell className="py-2">
                      <span className="flex items-center gap-2 text-sm">
                        {ownerTypeIcons[asset.owner?.type ?? "Individual"] ?? <User className="size-3.5" />}
                        {asset.owner?.name ?? "Unknown"}
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Type</TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant="outline"
                        className={cn("capitalize text-xs", identityTypeBadgeStyles[asset.owner?.type ?? ""] ?? "")}
                      >
                        {asset.owner?.type ?? "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Location</TableCell>
                    <TableCell className="py-2">
                      <span className="flex items-center gap-1.5 text-sm">
                        <MapPin className="size-3 text-muted-foreground" />
                        {buildIdentityLocation(currentIdentity)}
                      </span>
                    </TableCell>
                  </TableRow>
                  {currentIdentity?.tax_rate != null && (
                    <TableRow>
                      <TableCell className="font-medium text-sm py-2">Tax Rate</TableCell>
                      <TableCell className="text-sm py-2">{currentIdentity.tax_rate}%</TableCell>
                    </TableRow>
                  )}
                  {currentIdentity?.annual_income != null && (
                    <TableRow>
                      <TableCell className="font-medium text-sm py-2">Annual Income</TableCell>
                      <TableCell className="text-sm py-2">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
                          .format(Math.round(currentIdentity.annual_income))}
                      </TableCell>
                    </TableRow>
                  )}
                  {(currentIdentity?.goals ?? []).length > 0 && (
                    <TableRow>
                      <TableCell className="font-medium text-sm py-2">Goals</TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {(currentIdentity?.goals ?? []).slice(0, 3).map((g) => (
                            <Badge key={g} variant="secondary" className="text-xs capitalize">
                              {g.replace(/-/g, " ")}
                            </Badge>
                          ))}
                          {(currentIdentity?.goals ?? []).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{currentIdentity!.goals.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ── Compare other identities — plan-limited ── */}
          {otherIdentities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Compare Other Identities
                </h3>
                <span className="text-xs text-muted-foreground">
                  {maxAdditionalIdentities === 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Zap className="size-3" />
                      Upgrade to compare identities
                    </span>
                  ) : (
                    <>
                      Select up to {maxAdditionalIdentities} additional:{" "}
                      <span className="font-medium text-foreground">
                        {selectedIdentities.length}/{maxAdditionalIdentities}
                      </span>
                    </>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherIdentities.map((identity) => {
                  const isSelected = selectedIdentities.includes(identity.id)
                  const isDisabled = (!isSelected && selectedIdentities.length >= maxAdditionalIdentities)
                    || maxAdditionalIdentities === 0

                  return (
                    <Card
                      key={identity.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50",
                        isSelected && "border-primary bg-primary/5",
                        isDisabled && "opacity-50 cursor-not-allowed",
                      )}
                      onClick={() => !isDisabled && handleIdentityToggle(identity.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="p-1 rounded bg-muted shrink-0">
                                {ownerTypeIcons[identity.type] ?? <User className="size-3.5" />}
                              </div>
                              <p className="font-medium text-sm truncate">{identity.name}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge
                                variant="outline"
                                className={cn("capitalize text-xs", identityTypeBadgeStyles[identity.type] ?? "")}
                              >
                                {identity.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                              <MapPin className="size-2.5 shrink-0" />
                              {buildIdentityLocation(identity)}
                            </p>
                            {identity.tax_rate != null && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Tax Rate: {identity.tax_rate}%
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="p-0.5 rounded-full bg-primary text-primary-foreground shrink-0">
                              <Check className="size-2.5" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Upgrade nudge when identity limit hit */}
              {maxAdditionalIdentities === 0 && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline underline-offset-2 transition-colors"
                >
                  Upgrade your plan to compare multiple identities →
                </button>
              )}
            </div>
          )}

          {/* ── Jurisdiction selection — plan-limited ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Optimization Jurisdictions
              </h3>
              <span className="text-xs text-muted-foreground">
                Select up to {maxJurisdictions}:{" "}
                <span className="font-medium text-foreground">
                  {selectedJurisdictions.length}/{maxJurisdictions}
                </span>
              </span>
            </div>

            {jurisdictionError && (
              <div className="flex items-center gap-2 text-sm text-red-600 mb-2 px-1">
                <AlertCircle className="size-4 shrink-0" />
                Please select at least one jurisdiction to run the optimization.
              </div>
            )}

            <div className={cn(
              "border rounded-lg p-4",
              jurisdictionError && "border-red-300 bg-red-50/30"
            )}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                {JURISDICTIONS.map((jurisdiction) => {
                  const isSelected = selectedJurisdictions.includes(jurisdiction.id)
                  const isDisabled = !isSelected && selectedJurisdictions.length >= maxJurisdictions

                  return (
                    <div key={jurisdiction.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`jur-${jurisdiction.id}`}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => handleJurisdictionToggle(jurisdiction.id)}
                      />
                      <Label
                        htmlFor={`jur-${jurisdiction.id}`}
                        className={cn(
                          "text-sm font-normal cursor-pointer",
                          isDisabled && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {jurisdiction.name}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-4 border-t">
            {/* Upgrade nudge in footer */}
            {planStatus.reports_remaining <= 0 ? (
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline underline-offset-2 transition-colors flex items-center gap-1"
              >
                <Zap className="size-3" />
                Upgrade plan to generate more reports →
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">
                {planStatus.reports_remaining} report{planStatus.reports_remaining === 1 ? "" : "s"} remaining
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleOptimizeNow}
                className="gap-2"
                disabled={planLoading}
              >
                {planLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Optimize Now
              </Button>
            </div>
          </div>

        </div>
      </DialogContent>

      {/* ── Results modal ── */}
      <OptimizationResultsModal
        asset={asset}
        identities={selectedIdentityObjects}
        jurisdictions={selectedJurisdictionObjects}
        open={showResults}
        onOpenChange={setShowResults}
        onBack={() => setShowResults(false)}
      />

      {/* ── Upgrade modal ── */}
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        currentPlanId={planStatus.plan_id}
        reason="report_limit"
      />
    </Dialog>
  )
}