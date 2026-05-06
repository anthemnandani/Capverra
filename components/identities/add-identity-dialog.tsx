"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NewIdentity {
  name: string
  type: string
  citizenship: string[]
  residency: string
  risk_profile: string
  goals: string[]
  additional_information: string
  notes: string
}

interface AddIdentityDialogProps {
  onIdentityAdded: (identity: NewIdentity) => Promise<void> | void
}

const IDENTITY_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "entity", label: "Entity" },
  { value: "trust", label: "Trust" },
  { value: "partnership", label: "Partnership" },
  { value: "corporation", label: "Corporation" },
  { value: "llc", label: "LLC" },
]

const RISK_PROFILES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "aggressive", label: "Aggressive" },
]

const COMMON_GOALS = [
  "Increase cashflow",
  "Estate planning",
  "Tax optimization",
  "Wealth preservation",
  "Growth investing",
  "Risk mitigation",
  "Retirement planning",
  "Legacy planning",
]

export function AddIdentityDialog({ onIdentityAdded }: AddIdentityDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    residency: "",
    risk_profile: "",
    additional_information: "",
    notes: "",
  })

  const [citizenship, setCitizenship] = useState<string[]>([])
  const [newCitizenship, setNewCitizenship] = useState("")
  const [goals, setGoals] = useState<string[]>([])
  const [newGoal, setNewGoal] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newIdentity: NewIdentity = {
      ...formData,
      citizenship,
      goals,
    }

    try {
      await onIdentityAdded(newIdentity)

      toast({
        title: "Success",
        description: "Identity created successfully",
      })

      setFormData({
        name: "",
        type: "",
        residency: "",
        risk_profile: "",
        additional_information: "",
        notes: "",
      })
      setCitizenship([])
      setGoals([])
      setOpen(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to create identity",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addCitizenship = () => {
    if (newCitizenship.trim() && !citizenship.includes(newCitizenship.trim())) {
      setCitizenship([...citizenship, newCitizenship.trim()])
      setNewCitizenship("")
    }
  }

  const removeCitizenship = (country: string) => {
    setCitizenship(citizenship.filter((c) => c !== country))
  }

  const addGoal = (goal: string) => {
    if (!goals.includes(goal)) {
      setGoals([...goals, goal])
    }
  }

  const addCustomGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      setGoals([...goals, newGoal.trim()])
      setNewGoal("")
    }
  }

  const removeGoal = (goal: string) => {
    setGoals(goals.filter((g) => g !== goal))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add Identity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Identity</DialogTitle>
          <DialogDescription>Create a new identity profile with all relevant information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {IDENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Citizenship</Label>
            <div className="flex gap-2">
              <Input
                value={newCitizenship}
                onChange={(e) => setNewCitizenship(e.target.value)}
                placeholder="Add country"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCitizenship())}
              />
              <Button type="button" onClick={addCitizenship} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {citizenship.map((country) => (
                <Badge key={country} variant="secondary" className="flex items-center gap-1">
                  {country}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeCitizenship(country)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="residency">Residency</Label>
              <Input
                id="residency"
                value={formData.residency}
                onChange={(e) => setFormData({ ...formData, residency: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk_profile">Risk Profile *</Label>
              <Select
                value={formData.risk_profile}
                onValueChange={(value) => setFormData({ ...formData, risk_profile: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select risk profile" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_PROFILES.map((profile) => (
                    <SelectItem key={profile.value} value={profile.value}>
                      {profile.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Goals</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_GOALS.map((goal) => (
                <Button
                  key={goal}
                  type="button"
                  variant={goals.includes(goal) ? "default" : "outline"}
                  size="sm"
                  onClick={() => addGoal(goal)}
                >
                  {goal}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add custom goal"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomGoal())}
              />
              <Button type="button" onClick={addCustomGoal} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {goals.map((goal) => (
                <Badge key={goal} variant="secondary" className="flex items-center gap-1">
                  {goal}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeGoal(goal)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_information">Additional Information</Label>
            <Textarea
              id="additional_information"
              value={formData.additional_information}
              onChange={(e) => setFormData({ ...formData, additional_information: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Identity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
