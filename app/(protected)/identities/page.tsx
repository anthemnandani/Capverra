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
  Plus, Edit, Trash2,
  User, Building2, Shield, Users,
  Loader2, AlertCircle,
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
    case "low":        return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200"
    case "medium":     return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-200"
    case "high":
    case "aggressive": return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"
    default:           return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-200"
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
  const [identities,     setIdentities]     = useState<Identity[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState<string | null>(null)
  const [isModalOpen,    setIsModalOpen]    = useState(false)
  const [editingIdentity,setEditingIdentity]= useState<Identity | null>(null)
  const [deletingId,     setDeletingId]     = useState<string | null>(null)
  const [saving,         setSaving]         = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────
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
  const handleAddIdentity   = () => { setEditingIdentity(null); setIsModalOpen(true) }
  const handleEditIdentity  = (identity: Identity) => { setEditingIdentity(identity); setIsModalOpen(true) }
  const handleCloseModal    = () => { if (saving) return; setIsModalOpen(false); setEditingIdentity(null) }

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSaveIdentity = async (formData: IdentityFormData) => {
    setSaving(true)
    setError(null)
    const payload = formDataToPayload(formData)

    try {
      if (editingIdentity) {
        // ── UPDATE ──
        const res = await fetch(`/api/identities/${editingIdentity.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          // 503 = Supabase timeout — show friendly message
          if (res.status === 503) throw new Error("Auth service temporarily unavailable. Please retry.")
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        const updated: Identity = await res.json()
        setIdentities((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        // ── CREATE ──
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

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteIdentity = async (id: string) => {
    if (deletingId) return
    setDeletingId(id)
    setIdentities((prev) => prev.filter((i) => i.id !== id))  // optimistic

    try {
      const res = await fetch(`/api/identities/${id}`, { method: "DELETE" })
      if (!res.ok) {
        await fetchIdentities()  // roll back
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
                          {/* Name */}
                          <TableCell className="font-medium">{identity.name}</TableCell>

                          {/* Type */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(identity.type)}
                              <span className="capitalize">{getTypeLabel(identity.type)}</span>
                            </div>
                          </TableCell>

                          {/* State/Province */}
                          <TableCell>{identity.state_province || "—"}</TableCell>

                          {/* Citizenship */}
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

                          {/* Residency */}
                          <TableCell>
                            {identity.current_residency
                              ? getCountryName(identity.current_residency)
                              : identity.residency
                                ? getCountryName(identity.residency)
                                : "—"}
                          </TableCell>

                          {/* Risk Profile */}
                          <TableCell>
                            <Badge className={getRiskBadgeClass(identity.risk_profile)}>
                              {identity.risk_profile === "aggressive" ? "high" : identity.risk_profile}
                            </Badge>
                          </TableCell>

                          {/* Tax Rate */}
                          <TableCell>{formatTaxRate(identity.tax_rate)}</TableCell>

                          {/* Annual Income */}
                          <TableCell>{formatIncome(identity.annual_income)}</TableCell>

                          {/* Goals */}
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

                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost" size="sm"
                                disabled={!!deletingId || saving}
                                onClick={() => handleEditIdentity(identity)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                disabled={!!deletingId || saving}
                                onClick={() => handleDeleteIdentity(identity.id)}
                              >
                                {deletingId === identity.id
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

        {/* Modal */}
        <IdentityModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          isSaving={saving}
          onSave={handleSaveIdentity}
          identity={editingIdentity ? identityToModalShape(editingIdentity) : null}
        />
      </div>
    </div>
  )
}
