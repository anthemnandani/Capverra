"use client"

import { useState } from "react"
import { Check, Users, Building2, User, MapPin, Sparkles, AlertCircle } from "lucide-react"
import { OptimizationResultsModal } from "@/components/assets/optimization-results-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

// ── FIX: resolve country code → country name for display ─────────────────────
const getCountryName = (code: string | null | undefined): string => {
  if (!code) return ""
  const found = countries.find((c) => c.code === code)
  return found ? found.name : code
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  trust:       "bg-blue-100   text-blue-700",
  Trust:       "bg-blue-100   text-blue-700",
  LLC:         "bg-purple-100 text-purple-700",
  llc:         "bg-purple-100 text-purple-700",
  corporation: "bg-purple-100 text-purple-700",
  partnership: "bg-amber-100  text-amber-700",
  entity:      "bg-purple-100 text-purple-700",
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface AssetDetailModalProps {
  asset:         AssetWithCalculations | null
  allIdentities: Identity[]
  open:          boolean
  onOpenChange:  (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AssetDetailModal({
  asset,
  allIdentities,
  open,
  onOpenChange,
}: AssetDetailModalProps) {
  const [selectedIdentities,    setSelectedIdentities]    = useState<string[]>([])
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([])
  const [showResults,           setShowResults]           = useState(false)
  // FIX: validation error state
  const [jurisdictionError,     setJurisdictionError]     = useState(false)

  if (!asset) return null

  const currentIdentityId = asset.owner_id ?? ""
  const otherIdentities   = allIdentities.filter((i) => i.id !== currentIdentityId)
  const currentIdentity   = allIdentities.find((i)  => i.id === currentIdentityId)

  // ── Toggles ────────────────────────────────────────────────────────────────
  const handleIdentityToggle = (id: string) => {
    setSelectedIdentities((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2)  return prev
      return [...prev, id]
    })
  }

  const handleJurisdictionToggle = (id: string) => {
    setJurisdictionError(false) // FIX: clear error on interaction
    setSelectedJurisdictions((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2)  return prev
      return [...prev, id]
    })
  }

  // ── FIX: validate before opening results ──────────────────────────────────
  const handleOptimizeNow = () => {
    if (selectedJurisdictions.length === 0) {
      setJurisdictionError(true)
      return
    }
    setJurisdictionError(false)
    setShowResults(true)
  }

  // ── Derived selections ─────────────────────────────────────────────────────
  const selectedIdentityObjects: Identity[] = [
    ...(currentIdentity ? [currentIdentity] : []),
    ...selectedIdentities
      .map((id) => allIdentities.find((i) => i.id === id))
      .filter(Boolean) as Identity[],
  ]

  const selectedJurisdictionObjects = selectedJurisdictions
    .map((id) => JURISDICTIONS.find((j) => j.id === id))
    .filter(Boolean) as typeof JURISDICTIONS

  // ── Performance display ────────────────────────────────────────────────────
  const pct = asset.value_change_percentage
  const isPositive = (pct ?? 0) >= 0

  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)
      : "—"

  // FIX: build identity location string correctly
  // state_province is a free-text field, current_residency is a country code
  const buildIdentityLocation = (identity: Identity | undefined): string => {
    if (!identity) return "—"
    const parts = [
      identity.state_province,
      getCountryName(identity.current_residency),
    ].filter(Boolean)
    return parts.join(", ") || "—"
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{asset.name}</DialogTitle>
          <DialogDescription>
            View asset details, compare identities, and run AI tax optimization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">

          {/* ── Asset info table ── */}
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
                    <TableCell className="py-2">
                      <Badge variant="outline">{asset.type}</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Location</TableCell>
                    <TableCell className="text-sm py-2">
                      {/* FIX: resolve country code to name */}
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

          {/* ── Current identity table ── */}
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
                        className={cn(
                          "capitalize text-xs",
                          identityTypeBadgeStyles[asset.owner?.type ?? ""] ?? "",
                        )}
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
                        {/* FIX: use corrected location builder */}
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
                          .format(Math.round(currentIdentity.annual_income))} {/* FIX: round */}
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

          {/* ── All other identities — select up to 2 to compare ── */}
          {otherIdentities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Compare Other Identities
                </h3>
                <span className="text-xs text-muted-foreground">
                  Select up to 2 additional:{" "}
                  <span className="font-medium text-foreground">
                    {selectedIdentities.length}/2
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherIdentities.map((identity) => {
                  const isSelected = selectedIdentities.includes(identity.id)
                  const isDisabled = !isSelected && selectedIdentities.length >= 2

                  return (
                    <Card
                      key={identity.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50",
                        isSelected  && "border-primary bg-primary/5",
                        isDisabled  && "opacity-50 cursor-not-allowed",
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
                                className={cn(
                                  "capitalize text-xs",
                                  identityTypeBadgeStyles[identity.type] ?? "",
                                )}
                              >
                                {identity.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                              <MapPin className="size-2.5 shrink-0" />
                              {/* FIX: use corrected location builder */}
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
            </div>
          )}

          {/* ── Jurisdiction selection ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Optimization Jurisdictions
              </h3>
              <span className="text-xs text-muted-foreground">
                Select up to 2:{" "}
                <span className="font-medium text-foreground">
                  {selectedJurisdictions.length}/2
                </span>
              </span>
            </div>
            {/* FIX: show validation error if no jurisdiction selected */}
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
                  const isDisabled = !isSelected && selectedJurisdictions.length >= 2

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
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {/* FIX: use validated handler */}
            <Button onClick={handleOptimizeNow} className="gap-2">
              <Sparkles className="size-4" />
              Optimize Now
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Optimization results modal */}
      <OptimizationResultsModal
        asset={asset}
        identities={selectedIdentityObjects}
        jurisdictions={selectedJurisdictionObjects}
        open={showResults}
        onOpenChange={setShowResults}
        onBack={() => setShowResults(false)}
      />
    </Dialog>
  )
}