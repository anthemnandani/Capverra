"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus, Edit, Trash2,
  User, Building2, Shield, Users,
  Loader2, AlertCircle, AlertTriangle,
} from "lucide-react"
import { IdentityModal, type IdentityFormData, type IdentityModalShape } from "@/components/identities/identity-modal"
import { getCountryName } from "@/lib/countries"

// ── API shape (snake_case from Supabase) ──────────────────────────────────────
interface Identity {
  id: string
  user_id: string | null
  name: string
  type: "individual" | "trust" | "llc" | "corporation" | "partnership" | "other"
  state_province: string | null
  primary_citizenship: string | null
  other_citizenships: string[]
  current_residency: string | null
  citizenship: string[]
  residency: string | null
  risk_profile: "low" | "medium" | "high" | "aggressive"
  goals: string[]
  additional_information: string | null
  notes: string | null
  tax_rate: number | null
  annual_income: number | null
  created_at: string
  updated_at: string
}

interface LinkedAsset {
  id: string
  name: string
  type: string
}

// ── Goal label lookup ─────────────────────────────────────────────────────────
const GOAL_LABELS: Record<string, string> = {
  "reduce-taxes-now":      "Reduce taxes now",
  "inheritance-tax":       "Inheritance tax",
  "increase-cashflow":     "Increase cash flow",
  "asset-protection":      "Asset protection",
  "business-optimization": "Business optimization",
  "retirement-planning":   "Retirement planning",
  "estate-planning":       "Estate planning",
  "investment-efficiency": "Investment efficiency",
}

function goalLabel(id: string) {
  return GOAL_LABELS[id] ?? id.replace(/-/g, " ")
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTypeIcon(type: string) {
  switch (type) {
    case "individual":  return <User      className="h-4 w-4" />
    case "trust":       return <Shield    className="h-4 w-4" />
    case "partnership": return <Users     className="h-4 w-4" />
    default:            return <Building2 className="h-4 w-4" />
  }
}

function getTypeLabel(type: string) {
  if (type === "llc") return "LLC"
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function getRiskBadgeClass(profile: string) {
  switch (profile) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
    case "high":
    case "aggressive":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

function formatIncome(value: number | null) {
  if (value == null) return "—"
  return new Intl.NumberFormat("en-US").format(value)
}

function formatTaxRate(value: number | null) {
  if (value == null) return "—"
  return `${value}%`
}

/** API snake_case → modal camelCase */
function identityToModalShape(identity: Identity): IdentityModalShape {
  return {
    id:                 identity.id,
    name:               identity.name,
    type:               identity.type,
    stateProvince:      identity.state_province ?? "",
    primaryCitizenship: identity.primary_citizenship ?? "",
    otherCitizenships:  identity.other_citizenships ?? [],
    currentResidency:   identity.current_residency ?? "",
    riskProfile:        identity.risk_profile === "aggressive" ? "high" : identity.risk_profile,
    goals:              identity.goals ?? [],
    notes:              identity.notes ?? "",
    taxRate:            identity.tax_rate ?? null,
    annualIncome:       identity.annual_income ?? null,
    createdAt:          new Date(identity.created_at),
  }
}

/** Modal camelCase → API snake_case payload */
function formDataToPayload(data: IdentityFormData) {
  return {
    name:                   data.name,
    type:                   data.type,
    state_province:         data.stateProvince || null,
    primary_citizenship:    data.primaryCitizenship || null,
    other_citizenships:     data.otherCitizenships ?? [],
    current_residency:      data.currentResidency || null,
    citizenship:            data.primaryCitizenship ? [data.primaryCitizenship] : [],
    residency:              data.currentResidency || null,
    risk_profile:           data.riskProfile,
    goals:                  data.goals ?? [],
    additional_information: null,
    notes:                  data.notes || null,
    tax_rate:               data.taxRate ?? null,
    annual_income:          data.annualIncome ?? null,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IdentitiesPage() {
  const [identities,      setIdentities]      = useState<Identity[]>([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState<string | null>(null)
  const [isModalOpen,     setIsModalOpen]     = useState(false)
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null)
  const [deletingId,      setDeletingId]      = useState<string | null>(null)
  const [checkingId,      setCheckingId]      = useState<string | null>(null)
  const [saving,          setSaving]          = useState(false)

  // ── Warning dialog state ──────────────────────────────────────────────────
  const [warnDialogOpen,    setWarnDialogOpen]    = useState(false)
  const [warnIdentity,      setWarnIdentity]      = useState<Identity | null>(null)
  const [warnLinkedAssets,  setWarnLinkedAssets]  = useState<LinkedAsset[]>([])

  // ── Fetch identities ──────────────────────────────────────────────────────
  const fetchIdentities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/identities", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setIdentities(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load identities")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchIdentities() }, [fetchIdentities])

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const handleAddIdentity  = () => { setEditingIdentity(null); setIsModalOpen(true) }
  const handleEditIdentity = (identity: Identity) => { setEditingIdentity(identity); setIsModalOpen(true) }
  const handleCloseModal   = () => { if (saving) return; setIsModalOpen(false); setEditingIdentity(null) }

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSaveIdentity = async (formData: IdentityFormData) => {
    setSaving(true)
    setError(null)
    const payload = formDataToPayload(formData)

    try {
      if (editingIdentity) {
        const res = await fetch(`/api/identities/${editingIdentity.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (res.status === 503) throw new Error("Auth service temporarily unavailable. Please retry.")
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        const updated: Identity = await res.json()
        setIdentities((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const res = await fetch("/api/identities", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (res.status === 503) throw new Error("Auth service temporarily unavailable. Please retry.")
          if (res.status === 401) throw new Error("Session expired. Please refresh the page and log in again.")
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        const created: Identity = await res.json()
        setIdentities((prev) => [created, ...prev])
      }
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete: step 1 — check for linked assets first ───────────────────────
  const handleDeleteClick = async (identity: Identity) => {
    if (checkingId || deletingId) return
    setCheckingId(identity.id)
    try {
      const res = await fetch(`/api/identities/${identity.id}/linked-assets`)
      if (!res.ok) throw new Error("Check failed")
      const { assets }: { assets: LinkedAsset[] } = await res.json()

      if (assets.length > 0) {
        // Has linked assets → show warning dialog
        setWarnIdentity(identity)
        setWarnLinkedAssets(assets)
        setWarnDialogOpen(true)
      } else {
        // Safe to delete directly
        await executeDelete(identity.id)
      }
    } catch {
      setError("Could not check linked assets. Please try again.")
    } finally {
      setCheckingId(null)
    }
  }

  // ── Delete: step 2 — actually delete ─────────────────────────────────────
  const executeDelete = async (id: string) => {
    setDeletingId(id)
    setIdentities((prev) => prev.filter((i) => i.id !== id)) // optimistic

    try {
      const res = await fetch(`/api/identities/${id}`, { method: "DELETE" })
      if (!res.ok) {
        await fetchIdentities() // roll back
        const body = await res.json().catch(() => ({}))
        if (res.status === 503) throw new Error("Auth service temporarily unavailable. Please retry.")
        if (res.status === 401) throw new Error("Session expired. Please refresh the page and log in again.")
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const handleWarnClose = () => {
    setWarnDialogOpen(false)
    setWarnIdentity(null)
    setWarnLinkedAssets([])
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Identities</h1>
              <p className="text-lg text-muted-foreground">
                Manage your tax entities and strategic profiles
              </p>
            </div>
            <Button onClick={handleAddIdentity} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Identity
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button className="ml-auto text-xs underline" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* Main card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Identities</CardTitle>
          </CardHeader>
          <CardContent>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading identities…</span>
              </div>
            )}

            {/* Empty state */}
            {!loading && identities.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No identities created yet</p>
                <Button onClick={handleAddIdentity} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Identity
                </Button>
              </div>
            )}

            {/* Table */}
            {!loading && identities.length > 0 && (
              <div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>State/Province</TableHead>
                        <TableHead>Citizenship</TableHead>
                        <TableHead>Residency</TableHead>
                        <TableHead>Risk Profile</TableHead>
                        <TableHead>Tax Rate</TableHead>
                        <TableHead>Annual Income</TableHead>
                        <TableHead>Goals</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {identities.map((identity) => (
                        <TableRow
                          key={identity.id}
                          className={deletingId === identity.id ? "opacity-40" : ""}
                        >
                          <TableCell className="font-medium">{identity.name}</TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(identity.type)}
                              <span className="capitalize">{getTypeLabel(identity.type)}</span>
                            </div>
                          </TableCell>

                          <TableCell>{identity.state_province || "—"}</TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {identity.primary_citizenship && (
                                <Badge variant="outline" className="text-xs">
                                  {getCountryName(identity.primary_citizenship)}
                                </Badge>
                              )}
                              {!identity.primary_citizenship &&
                                (identity.citizenship ?? []).map((c) => (
                                  <Badge key={c} variant="outline" className="text-xs">
                                    {getCountryName(c)}
                                  </Badge>
                                ))}
                              {(identity.other_citizenships ?? []).map((c) => (
                                <Badge key={c} variant="outline" className="text-xs text-muted-foreground">
                                  {getCountryName(c)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>

                          <TableCell>
                            {identity.current_residency
                              ? getCountryName(identity.current_residency)
                              : identity.residency
                                ? getCountryName(identity.residency)
                                : "—"}
                          </TableCell>

                          <TableCell>
                            <Badge className={getRiskBadgeClass(identity.risk_profile)}>
                              {identity.risk_profile === "aggressive" ? "high" : identity.risk_profile}
                            </Badge>
                          </TableCell>

                          <TableCell>{formatTaxRate(identity.tax_rate)}</TableCell>

                          <TableCell>{formatIncome(identity.annual_income)}</TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(identity.goals ?? []).slice(0, 2).map((g) => (
                                <Badge key={g} variant="secondary" className="text-xs">
                                  {goalLabel(g)}
                                </Badge>
                              ))}
                              {(identity.goals ?? []).length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{identity.goals.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost" size="sm"
                                disabled={!!deletingId || !!checkingId || saving}
                                onClick={() => handleEditIdentity(identity)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                disabled={!!deletingId || !!checkingId || saving}
                                onClick={() => handleDeleteClick(identity)}
                              >
                                {deletingId === identity.id || checkingId === identity.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                  * If you hold more than one citizenship or have multiple tax residencies, please create a
                  separate identity for each. This ensures accurate tax strategy recommendations for each
                  jurisdiction.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Identity modal */}
        <IdentityModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          isSaving={saving}
          onSave={handleSaveIdentity}
          identity={editingIdentity ? identityToModalShape(editingIdentity) : null}
        />

        {/* ── Linked-assets warning dialog (info only — no delete) ── */}
        <AlertDialog open={warnDialogOpen} onOpenChange={handleWarnClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Cannot delete — identity is linked to assets
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    <span className="font-medium text-foreground">{warnIdentity?.name}</span> cannot
                    be deleted because it is currently the owner of the following
                    asset{warnLinkedAssets.length > 1 ? "s" : ""}:
                  </p>
                  <ul className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 divide-y divide-amber-200 dark:divide-amber-800">
                    {warnLinkedAssets.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <Building2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="font-medium text-foreground">{a.name}</span>
                        <span className="text-muted-foreground">· {a.type}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Please remove or reassign these assets before deleting this identity.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleWarnClose}>
                OK, got it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  )
}