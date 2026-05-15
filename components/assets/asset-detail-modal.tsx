"use client"

import { useState } from "react"
import { Check, Users, Building2, User, MapPin, Sparkles } from "lucide-react"
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
import type { AssetWithCalculations, Identity } from "@/lib/types"

// ── Jurisdictions ────────────────────────────────────────────────────────────
const JURISDICTIONS = [
  { id: "bvi",           name: "British Virgin Islands (BVI)", code: "VG" },
  { id: "cayman",        name: "Cayman Islands",               code: "KY" },
  { id: "isle-of-man",   name: "Isle of Man",                  code: "IM" },
  { id: "mauritius",     name: "Mauritius",                    code: "MU" },
  { id: "luxembourg",    name: "Luxembourg",                   code: "LU" },
  { id: "singapore",     name: "Singapore",                    code: "SG" },
  { id: "hong-kong",     name: "Hong Kong",                    code: "HK" },
  { id: "cyprus",        name: "Cyprus",                       code: "CY" },
  { id: "malta",         name: "Malta",                        code: "MT" },
  { id: "jersey-guernsey", name: "Jersey / Guernsey",          code: "JE" },
  { id: "panama",        name: "Panama",                       code: "PA" },
  { id: "liechtenstein", name: "Liechtenstein",                code: "LI" },
  { id: "other",         name: "Other Suitable Jurisdiction",  code: "XX" },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const ownerTypeIcons: Record<string, React.ReactNode> = {
  Individual: <User  className="size-3.5" />,
  LLC:        <Building2 className="size-3.5" />,
  Trust:      <Users className="size-3.5" />,
  individual: <User  className="size-3.5" />,
  corporation:<Building2 className="size-3.5" />,
  partnership:<Building2 className="size-3.5" />,
  trust:      <Users className="size-3.5" />,
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
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface AssetDetailModalProps {
  asset: AssetWithCalculations | null
  allIdentities: Identity[]          // all identities from your DB
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AssetDetailModal({
  asset,
  allIdentities,
  open,
  onOpenChange,
}: AssetDetailModalProps) {
  const [selectedIdentities, setSelectedIdentities] = useState<string[]>([])
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)

  if (!asset) return null

  const currentIdentityId = asset.owner_id ?? ""
  const otherIdentities    = allIdentities.filter((i) => i.id !== currentIdentityId)
  const currentIdentity    = allIdentities.find((i)  => i.id === currentIdentityId)

  // ── Toggles ────────────────────────────────────────────────────────────────
  const handleIdentityToggle = (id: string) => {
    setSelectedIdentities((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2)  return prev
      return [...prev, id]
    })
  }

  const handleJurisdictionToggle = (id: string) => {
    setSelectedJurisdictions((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2)  return prev
      return [...prev, id]
    })
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
                      {[asset.location_state, asset.location_country].filter(Boolean).join(", ")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Purchase Value</TableCell>
                    <TableCell className="text-sm py-2">
                      {asset.purchase_value != null
                        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(asset.purchase_value)
                        : "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm py-2">Latest Valuation</TableCell>
                    <TableCell className="text-sm py-2">
                      {asset.latest_valuation != null
                        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(asset.latest_valuation)
                        : "—"}
                    </TableCell>
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
                        {currentIdentity
                          ? [currentIdentity.state_province, currentIdentity.current_residency]
                              .filter(Boolean).join(", ")
                          : "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ── Other identities selection ── */}
          {otherIdentities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Compare Other Identities
                </h3>
                <span className="text-xs text-muted-foreground">
                  Select up to 3 total:{" "}
                  <span className="font-medium text-foreground">
                    {1 + selectedIdentities.length}/3
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherIdentities.map((identity) => {
                  const isSelected  = selectedIdentities.includes(identity.id)
                  const isDisabled  = !isSelected && selectedIdentities.length >= 2

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
                              {[identity.state_province, identity.current_residency]
                                .filter(Boolean).join(", ") || "—"}
                            </p>
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
            <div className="border rounded-lg p-4">
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
            <Button onClick={() => setShowResults(true)} className="gap-2">
              <Sparkles className="size-4" />
              Optimize Now
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Optimization results modal (opened from here) */}
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