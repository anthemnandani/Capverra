"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Globe, Shield, TrendingUp, DollarSign,
  Users, Building, PiggyBank, FileText, Loader2,
} from "lucide-react"
import { countries } from "@/lib/countries"

export interface IdentityModalShape {
  id: string
  name: string
  type: "individual" | "trust" | "llc" | "corporation" | "partnership" | "other"
  stateProvince: string
  primaryCitizenship: string
  otherCitizenships: string[]
  currentResidency: string
  riskProfile: "low" | "medium" | "high"
  goals: string[]
  notes?: string
  taxRate?: number | null       // NEW
  annualIncome?: number | null  // NEW
  createdAt: Date
}

export type IdentityFormData = Omit<IdentityModalShape, "id" | "createdAt">

interface IdentityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: IdentityFormData) => Promise<void> | void
  isSaving?: boolean
  identity?: IdentityModalShape | null
}

const STRATEGY_GOALS = [
  { id: "reduce-taxes-now",      label: "Reduce current tax burden",         icon: DollarSign   },
  { id: "inheritance-tax",       label: "Minimize inheritance tax",           icon: Users        },
  { id: "increase-cashflow",     label: "Increase cash flow",                 icon: TrendingUp   },
  { id: "asset-protection",      label: "Asset protection",                   icon: Shield       },
  { id: "business-optimization", label: "Business structure optimization",    icon: Building     },
  { id: "retirement-planning",   label: "Retirement planning",                icon: PiggyBank    },
  { id: "estate-planning",       label: "Estate planning",                    icon: FileText     },
  { id: "investment-efficiency", label: "Investment tax efficiency",          icon: TrendingUp   },
] as const

const IDENTITY_TYPES = [
  { value: "individual",  label: "Individual"  },
  { value: "trust",       label: "Trust"       },
  { value: "llc",         label: "LLC"         },
  { value: "corporation", label: "Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "other",       label: "Other"       },
] as const

const RISK_OPTIONS = [
  {
    value: "low"    as const,
    label: "Conservative",
    description: "Prefer simple, well-established strategies with minimal regulatory risk",
  },
  {
    value: "medium" as const,
    label: "Moderate",
    description: "Open to moderately complex strategies with reasonable risk-reward balance",
  },
  {
    value: "high"   as const,
    label: "Aggressive",
    description:
      "Comfortable with complex strategies and higher regulatory uncertainty for maximum optimization",
  },
]

export function IdentityModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  identity,
}: IdentityModalProps) {
  const [name,               setName]              = useState("")
  const [type,               setType]              = useState<IdentityModalShape["type"] | "">("")
  const [stateProvince,      setStateProvince]      = useState("")
  const [primaryCitizenship, setPrimaryCitizenship] = useState("")
  const [currentResidency,   setCurrentResidency]   = useState("")
  const [riskProfile,        setRiskProfile]        = useState<IdentityModalShape["riskProfile"]>("medium")
  const [selectedGoals,      setSelectedGoals]      = useState<string[]>([])
  const [notes,              setNotes]              = useState("")
  const [taxRate,            setTaxRate]            = useState<string>("")   // NEW
  const [annualIncome,       setAnnualIncome]       = useState<string>("")   // NEW
  const [goalsError,         setGoalsError]         = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (identity) {
      setName(identity.name)
      setType(identity.type)
      setStateProvince(identity.stateProvince ?? "")
      setPrimaryCitizenship(identity.primaryCitizenship ?? "")
      setCurrentResidency(identity.currentResidency ?? "")
      setRiskProfile(identity.riskProfile ?? "medium")
      setSelectedGoals(identity.goals ?? [])
      setNotes(identity.notes ?? "")
      setTaxRate(identity.taxRate != null ? String(identity.taxRate) : "")         // NEW
      setAnnualIncome(identity.annualIncome != null ? String(identity.annualIncome) : "") // NEW
    } else {
      setName("")
      setType("")
      setStateProvince("")
      setPrimaryCitizenship("")
      setCurrentResidency("")
      setRiskProfile("medium")
      setSelectedGoals([])
      setNotes("")
      setTaxRate("")       // NEW
      setAnnualIncome("")  // NEW
    }
    setGoalsError(false)
  }, [identity, isOpen])

  const toggleGoal = (goalId: string) => {
    setGoalsError(false)
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedGoals.length === 0) {
      setGoalsError(true)
      return
    }
    await onSave({
      name,
      type: type as IdentityModalShape["type"],
      stateProvince,
      primaryCitizenship,
      otherCitizenships: identity?.otherCitizenships ?? [],
      currentResidency,
      riskProfile,
      goals: selectedGoals,
      notes: notes || undefined,
      taxRate: taxRate !== "" ? parseFloat(taxRate) : null,           // NEW
      annualIncome: annualIncome !== "" ? parseFloat(annualIncome) : null, // NEW
    })
  }

  const isSubmitDisabled =
    isSaving ||
    !name.trim() ||
    !type ||
    !stateProvince.trim() ||
    !primaryCitizenship ||
    !currentResidency

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => { if (!open && !isSaving) onClose() }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>{identity ? "Edit Identity" : "Add New Identity"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="im-name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="im-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name or entity name"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="im-type">
                    Identity Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(v: IdentityModalShape["type"]) => setType(v)}
                    disabled={isSaving}
                    required
                  >
                    <SelectTrigger id="im-type">
                      <SelectValue placeholder="Select identity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {IDENTITY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="im-state">
                  State/Province <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="im-state"
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
                  placeholder="e.g. California, Ontario, Western Cape"
                  required
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Citizenship */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Citizenship Information
              </CardTitle>
              <CardDescription>
                Tell us about citizenship status to understand tax obligations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="im-citizenship">
                  Citizenship <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={primaryCitizenship}
                  onValueChange={setPrimaryCitizenship}
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger id="im-citizenship">
                    <SelectValue placeholder="Select citizenship" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Residency */}
          <Card>
            <CardHeader>
              <CardTitle>Current Residency</CardTitle>
              <CardDescription>Where do you currently reside for tax purposes?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="im-residency">
                  Tax Residency <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={currentResidency}
                  onValueChange={setCurrentResidency}
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger id="im-residency">
                    <SelectValue placeholder="Select current tax residency" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details — NEW CARD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Details
              </CardTitle>
              <CardDescription>
                Provide your tax rate and income to improve strategy recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="im-taxrate">Tax Rate (%)</Label>
                  <Input
                    id="im-taxrate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    placeholder="e.g. 28.5"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="im-income">Annual Income</Label>
                  <Input
                    id="im-income"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g. 500000"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Profile <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription>
                How comfortable are you with complex strategies and potential regulatory changes?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {RISK_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id={`risk-${opt.value}`}
                      name="riskProfile"
                      value={opt.value}
                      checked={riskProfile === opt.value}
                      onChange={() => setRiskProfile(opt.value)}
                      disabled={isSaving}
                      className="mt-1"
                      required
                    />
                    <div className="flex-1">
                      <Label htmlFor={`risk-${opt.value}`} className="font-medium">
                        {opt.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strategy Goals */}
          <Card className={goalsError ? "border-red-400" : ""}>
            <CardHeader>
              <CardTitle>
                Strategy Goals <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription>Select all objectives that align with your financial goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STRATEGY_GOALS.map(({ id, label, icon: Icon }) => (
                  <div key={id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`goal-${id}`}
                      checked={selectedGoals.includes(id)}
                      onCheckedChange={() => toggleGoal(id)}
                      disabled={isSaving}
                    />
                    <Label htmlFor={`goal-${id}`} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
              {goalsError && (
                <p className="text-sm text-red-500 mt-3">Please select at least one strategy goal.</p>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Any specific circumstances, goals, or concerns we should know about?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="im-notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="im-notes"
                  placeholder="Tell us about any specific circumstances, business structures, investment preferences, or other relevant details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : identity ? "Update Identity" : "Create Identity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}