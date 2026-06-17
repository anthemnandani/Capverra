"use client"

import type React from "react"
import { useEffect, useMemo, useState, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AssetWithCalculations, Identity } from "@/lib/types"
import { AddAssetDialog } from "./add-asset-dialog"
import { AssetDetailModal } from "./asset-detail-modal"
import { TrendingUp, TrendingDown, User, Building2, Shield, Sparkles, FileText, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportsHistoryModal } from "./reports-history-modal"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"
import { usePlan } from "@/hooks/use-plan"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────
type Currency = "USD" | "EUR" | "GBP" | "ZAR" | "CHF" | "JPY" | "AUD" | "CAD"
const currencies: Currency[] = ["USD", "EUR", "GBP", "ZAR", "CHF", "JPY", "AUD", "CAD"]
const currencySymbols: Record<Currency, string> = {
  USD: "$", EUR: "€", GBP: "£", ZAR: "R", CHF: "CHF", JPY: "¥", AUD: "A$", CAD: "C$",
}

const ASSET_TYPE_COLORS: Record<string, string> = {
  "Real Estate":            "bg-emerald-600 text-white hover:bg-emerald-600",
  Stocks:                   "bg-amber-600 text-white hover:bg-amber-600",
  Bonds:                    "bg-purple-600 text-white hover:bg-purple-600",
  Cryptocurrency:           "bg-orange-600 text-white hover:bg-orange-600",
  "Mutual Funds":           "bg-cyan-600 text-white hover:bg-cyan-600",
  ETFs:                     "bg-indigo-600 text-white hover:bg-indigo-600",
  "Private Equity":         "bg-rose-600 text-white hover:bg-rose-600",
  "Hedge Funds":            "bg-pink-600 text-white hover:bg-pink-600",
  Commodities:              "bg-amber-600 text-white hover:bg-amber-600",
  "Art & Collectibles":     "bg-violet-600 text-white hover:bg-violet-600",
  "Business Interest":      "bg-teal-600 text-white hover:bg-teal-600",
  "Cash & Cash Equivalents":"bg-green-600 text-white hover:bg-green-600",
}

const ownerTypeIcons: Record<string, React.ReactNode> = {
  Individual: <User className="size-3.5" />,
  LLC:        <Building2 className="size-3.5" />,
  Trust:      <Shield className="size-3.5" />,
}

// ── Editable Cells ────────────────────────────────────────────────────────────
function EditableTextCell({ value, onSave, className = "" }: {
  value: string; onSave: (v: string) => void; className?: string
}) {
  const [editing,   setEditing]   = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select() } }, [editing])
  const save   = () => { onSave(editValue); setEditing(false) }
  const cancel = () => { setEditValue(value); setEditing(false) }
  const onKey  = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save(); else if (e.key === "Escape") cancel()
  }
  if (editing) return (
    <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={onKey} onBlur={save} className="h-8 min-w-[100px]" />
  )
  return (
    <span onClick={() => setEditing(true)}
      className={`cursor-pointer rounded px-1 py-0.5 hover:bg-muted transition-colors ${className}`}>
      {value}
    </span>
  )
}

function EditableCurrencyCell({ value, currency = "USD", onSave }: {
  value: number; currency?: string; onSave: (v: number) => void
}) {
  const [editing,   setEditing]   = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select() } }, [editing])
  const save  = () => { onSave(parseFloat(editValue.replace(/[^0-9.]/g, "")) || 0); setEditing(false) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save()
    else if (e.key === "Escape") { setEditValue(value.toString()); setEditing(false) }
  }
  const fmt = (v: number) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: currency in currencySymbols ? currency : "USD",
  }).format(v)
  if (editing) return (
    <Input ref={inputRef} type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={onKey} onBlur={save} className="h-8 w-[140px] text-right" />
  )
  return (
    <span onClick={() => { setEditValue(value.toString()); setEditing(true) }}
      className="cursor-pointer rounded px-1 py-0.5 hover:bg-muted transition-colors">
      {fmt(value)}
    </span>
  )
}

function EditableSelectCell<T extends string>({ value, options, onSave, renderValue }: {
  value: T; options: T[]; onSave: (v: T) => void; renderValue?: (v: T) => React.ReactNode
}) {
  const [editing, setEditing] = useState(false)
  if (editing) return (
    <Select value={value} onValueChange={(v) => { onSave(v as T); setEditing(false) }}>
      <SelectTrigger className="h-8 w-[160px]" autoFocus onBlur={() => setEditing(false)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
  return (
    <span onClick={() => setEditing(true)} className="cursor-pointer">
      {renderValue ? renderValue(value) : value}
    </span>
  )
}

function EditableDateCell({ value, onSave }: {
  value: string | null | undefined; onSave: (v: string) => void
}) {
  const [editing,   setEditing]   = useState(false)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const display  = value ? new Date(value).toLocaleDateString() : "-"
  useEffect(() => {
    if (editing && inputRef.current) {
      if (value) {
        const d = new Date(value)
        setEditValue(d.toISOString().split("T")[0])
      }
      inputRef.current.focus()
    }
  }, [editing, value])
  const save  = () => { if (editValue) onSave(editValue); setEditing(false) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save(); else if (e.key === "Escape") setEditing(false)
  }
  if (editing) return (
    <Input ref={inputRef} type="date" value={editValue}
      onChange={(e) => setEditValue(e.target.value)} onKeyDown={onKey} onBlur={save}
      className="h-8 w-[140px]" />
  )
  return (
    <span onClick={() => setEditing(true)}
      className="cursor-pointer rounded px-1 py-0.5 hover:bg-muted transition-colors">
      {display}
    </span>
  )
}

function EditableOwnerCell({ identities, ownerId, onSave }: {
  identities: Array<{ id: string; name: string; type: string }>
  ownerId: string | undefined
  onSave: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const owner = identities.find((i) => i.id === ownerId)
  if (editing) return (
    <Select value={ownerId ?? ""} onValueChange={(v) => { onSave(v); setEditing(false) }}>
      <SelectTrigger className="h-auto w-[260px]" autoFocus onBlur={() => setEditing(false)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {identities.map((i) => (
          <SelectItem key={i.id} value={i.id}>
            <div className="flex items-center gap-2">
              {ownerTypeIcons[i.type] ?? <User className="size-3.5" />}
              <span className="font-medium">{i.name}</span>
              <span className="text-muted-foreground">({i.type})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  if (!owner) return (
    <span className="text-muted-foreground cursor-pointer" onClick={() => setEditing(true)}>
      Unknown
    </span>
  )
  return (
    <div onClick={() => setEditing(true)}
      className="cursor-pointer rounded px-1 py-0.5 hover:bg-muted transition-colors">
      <div className="flex items-center gap-2">
        {ownerTypeIcons[owner.type] ?? <User className="size-3.5" />}
        <div className="flex flex-col">
          <span className="font-medium leading-tight">{owner.name}</span>
          <span className="text-xs text-muted-foreground">{owner.type}</span>
        </div>
      </div>
    </div>
  )
}

// ── Plan Status Banner ────────────────────────────────────────────────────────
function PlanStatusBanner({
  onUpgrade,
}: {
  onUpgrade: () => void
}) {
  const { planStatus, isLoading } = usePlan()

  if (isLoading) return null

  const isExhausted = planStatus.reports_remaining <= 0
  const isLow       = !isExhausted && planStatus.reports_remaining === 1

  if (!isExhausted && !isLow) return null

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-4 py-3 rounded-lg border text-sm mb-4",
      isExhausted
        ? "bg-destructive/5 border-destructive/20 text-destructive dark:bg-destructive/10"
        : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
    )}>
      <div className="flex items-center gap-2">
        <Zap className="size-4 shrink-0" />
        <span>
          {isExhausted
            ? `Your ${planStatus.plan_name} plan has no reports remaining. Upgrade to continue generating tax optimizations.`
            : `Only 1 report remaining on your ${planStatus.plan_name} plan.`}
        </span>
      </div>
      <Button
        size="sm"
        variant={isExhausted ? "default" : "outline"}
        className={cn(
          "shrink-0 whitespace-nowrap",
          isExhausted && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        onClick={onUpgrade}
      >
        {isExhausted ? "Upgrade Plan" : "View Plans"}
      </Button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function AssetsTable() {
  const [assets,           setAssets]           = useState<AssetWithCalculations[]>([])
  const [identities,       setIdentities]       = useState<Identity[]>([])
  const [loading,          setLoading]          = useState(true)
  const [reportsAsset,     setReportsAsset]     = useState<AssetWithCalculations | null>(null)
  const [reportsModalOpen, setReportsModalOpen] = useState(false)
  const [detailAsset,      setDetailAsset]      = useState<AssetWithCalculations | null>(null)
  const [detailModalOpen,  setDetailModalOpen]  = useState(false)
  const [showUpgrade,      setShowUpgrade]      = useState(false)

  // Pre-fetch plan on table mount so modal opens instantly
  const { planStatus } = usePlan()

  const identityOptions = useMemo(
    () => identities.map((i) => ({ id: i.id, name: i.name, type: i.type })),
    [identities],
  )

  const loadAssetsAndIdentities = async () => {
    const [assetsRes, identitiesRes] = await Promise.all([
      fetch("/api/assets",     { cache: "no-store" }),
      fetch("/api/identities", { cache: "no-store" }),
    ])
    if (!assetsRes.ok)     throw new Error("Failed to fetch assets")
    if (!identitiesRes.ok) throw new Error("Failed to fetch identities")
    const [assetsData, identitiesData] = await Promise.all([
      assetsRes.json(),
      identitiesRes.json(),
    ])
    setAssets(assetsData)
    setIdentities(identitiesData)
  }

  useEffect(() => {
    loadAssetsAndIdentities()
      .catch((err) => console.error("Failed to load assets:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleAssetAdded = async (
    newAsset: Omit<AssetWithCalculations, "id" | "created_at" | "updated_at" | "value_change_amount" | "value_change_percentage">,
  ) => {
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAsset),
    })
    if (!response.ok) throw new Error("Failed to create asset")
    const asset = await response.json()
    setAssets((current) => [asset, ...current])
  }

  const updateAsset = async (id: string, field: string, value: unknown) => {
    setAssets((curr) => curr.map((a) => a.id === id ? { ...a, [field]: value } : a))
    try {
      await fetch(`/api/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
    } catch (err) {
      console.error("Failed to update asset:", err)
    }
  }

  const formatCurrency = (value: number | null | undefined, currency = "USD") => {
    if (value === null || value === undefined) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency in currencySymbols ? currency : "USD",
    }).format(value)
  }

  const tableHeaders = [
    "Actions", "Asset Name", "Type", "Owner", "Location", "Currency",
    "Purchase Value", "Purchase Date", "Latest Valuation", "Valuation Date", "Performance",
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Assets</CardTitle>
            <AddAssetDialog identities={identityOptions} onAssetAdded={handleAssetAdded} />
          </div>
        </CardHeader>
        <CardContent>

          {/* ── Plan status banner — shown above table when limit hit ── */}
          <PlanStatusBanner onUpgrade={() => setShowUpgrade(true)} />

          {/* Skeleton */}
          {loading && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>{tableHeaders.map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: tableHeaders.length }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Empty state */}
          {!loading && assets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No assets found</p>
              <AddAssetDialog identities={identityOptions} onAssetAdded={handleAssetAdded} />
            </div>
          )}

          {/* Table */}
          {!loading && assets.length > 0 && (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableHeaders.map((h) => <TableHead key={h}>{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => {
                    const pv       = asset.purchase_value ?? 0
                    const lv       = asset.latest_valuation ?? 0
                    const pct      = asset.value_change_percentage
                    const amt      = asset.value_change_amount
                    const currency = (asset as AssetWithCalculations & { currency?: string }).currency ?? "USD"
                    const isLimitHit = planStatus.reports_remaining <= 0

                    return (
                      <TableRow key={asset.id}>
                        {/* ── Actions ── */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                             <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 bg-accent/10 hover:bg-accent/20 text-accent-foreground border-accent/20"
                            onClick={() => {
                              setDetailAsset(asset)
                              setDetailModalOpen(true)
                            }}
                          >
                            <Sparkles className="size-4" />
                            Optimize
                          </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => {
                                setReportsAsset(asset)
                                setReportsModalOpen(true)
                              }}
                            >
                              <FileText className="size-4" />
                              Reports
                            </Button>
                          </div>
                        </TableCell>

                        {/* Asset Name */}
                        <TableCell className="font-medium">
                          <EditableTextCell
                            value={asset.name}
                            onSave={(v) => updateAsset(asset.id, "name", v)}
                          />
                        </TableCell>

                        {/* Type */}
                        <TableCell>
                          <EditableSelectCell
                            value={asset.type}
                            options={[
                              "Real Estate", "Stocks", "Bonds", "Mutual Funds", "ETFs",
                              "Private Equity", "Hedge Funds", "Commodities", "Cryptocurrency",
                              "Art & Collectibles", "Business Interest", "Cash & Cash Equivalents", "Other",
                            ]}
                            onSave={(v) => updateAsset(asset.id, "type", v)}
                            renderValue={(v) => (
                              <Badge className={`${ASSET_TYPE_COLORS[v] ?? "bg-gray-600 text-white hover:bg-gray-600"} cursor-pointer`}>
                                {v}
                              </Badge>
                            )}
                          />
                        </TableCell>

                        {/* Owner */}
                        <TableCell>
                          <EditableOwnerCell
                            identities={identityOptions}
                            ownerId={asset.owner_id}
                            onSave={(v) => updateAsset(asset.id, "owner_id", v)}
                          />
                        </TableCell>

                        {/* Location */}
                        <TableCell>
                          <EditableTextCell
                            value={[asset.location_state, asset.location_country].filter(Boolean).join(", ")}
                            onSave={(v) => {
                              const parts = v.split(",").map((s) => s.trim())
                              if (parts.length >= 2) {
                                updateAsset(asset.id, "location_state",   parts[0])
                                updateAsset(asset.id, "location_country", parts.slice(1).join(", "))
                              } else {
                                updateAsset(asset.id, "location_country", v)
                              }
                            }}
                          />
                        </TableCell>

                        {/* Currency */}
                        <TableCell>
                          <EditableSelectCell
                            value={(currency as Currency) in currencySymbols ? currency as Currency : "USD"}
                            options={currencies}
                            onSave={(v) => updateAsset(asset.id, "currency", v)}
                            renderValue={(v) => (
                              <span className="cursor-pointer rounded px-1 py-0.5 hover:bg-muted transition-colors">
                                {v} ({currencySymbols[v]})
                              </span>
                            )}
                          />
                        </TableCell>

                        {/* Purchase Value */}
                        <TableCell className="text-right">
                          <EditableCurrencyCell
                            value={pv} currency={currency}
                            onSave={(v) => updateAsset(asset.id, "purchase_value", v)}
                          />
                        </TableCell>

                        {/* Purchase Date */}
                        <TableCell>
                          <EditableDateCell
                            value={asset.purchase_date}
                            onSave={(v) => updateAsset(asset.id, "purchase_date", v)}
                          />
                        </TableCell>

                        {/* Latest Valuation */}
                        <TableCell className="text-right">
                          <EditableCurrencyCell
                            value={lv} currency={currency}
                            onSave={(v) => updateAsset(asset.id, "latest_valuation", v)}
                          />
                        </TableCell>

                        {/* Valuation Date */}
                        <TableCell>
                          <EditableDateCell
                            value={asset.latest_valuation_date}
                            onSave={(v) => updateAsset(asset.id, "latest_valuation_date", v)}
                          />
                        </TableCell>

                        {/* Performance */}
                        <TableCell>
                          {pct !== null && pct !== undefined ? (
                            <div className="flex items-center gap-1">
                              {pct >= 0
                                ? <TrendingUp  className="h-4 w-4 text-emerald-600" />
                                : <TrendingDown className="h-4 w-4 text-red-600" />}
                              <span className={pct >= 0 ? "text-emerald-600" : "text-red-600"}>
                                {pct > 0 ? "+" : ""}{pct.toFixed(2)}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({formatCurrency(amt, currency)})
                              </span>
                            </div>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      <AssetDetailModal
        asset={detailAsset}
        allIdentities={identities}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      <ReportsHistoryModal
        asset={reportsAsset}
        open={reportsModalOpen}
        onOpenChange={setReportsModalOpen}
      />

      {/* Standalone upgrade modal triggered from table banner / Upgrade button */}
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        currentPlanId={planStatus.plan_id}
        reason="report_limit"
      />
    </>
  )
}