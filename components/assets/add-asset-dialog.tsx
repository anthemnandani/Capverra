"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Currency = "USD" | "EUR" | "GBP" | "ZAR" | "CHF" | "JPY" | "AUD" | "CAD"

const currencies: Currency[] = ["USD", "EUR", "GBP", "ZAR", "CHF", "JPY", "AUD", "CAD"]
const currencySymbols: Record<Currency, string> = {
  USD: "$", EUR: "€", GBP: "£", ZAR: "R", CHF: "CHF", JPY: "¥", AUD: "A$", CAD: "C$",
}

interface NewAsset {
  name: string
  type: string
  owner_id: string
  owner?: { id: string; name: string }
  location_state: string
  location_country: string
  currency: string
  purchase_value: number | null
  purchase_date: string | null
  latest_valuation: number | null
  latest_valuation_date: string | null
}

interface AddAssetDialogProps {
  identities: Array<{ id: string; name: string; type: string }>
  onAssetAdded: (asset: NewAsset) => Promise<void> | void
}

const ASSET_TYPES = [
  "Real Estate", "Stocks", "Bonds", "Mutual Funds", "ETFs", "Private Equity",
  "Hedge Funds", "Commodities", "Cryptocurrency", "Art & Collectibles",
  "Business Interest", "Cash & Cash Equivalents", "Other",
]

export function AddAssetDialog({ identities, onAssetAdded }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "", type: "", owner_id: "",
    location_state: "", location_country: "", currency: "USD",
    purchase_value: "", purchase_date: "",
    latest_valuation: "", latest_valuation_date: "",
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const selectedOwner = identities.find((i) => i.id === formData.owner_id)
    const newAsset: NewAsset = {
      name: formData.name,
      type: formData.type,
      owner_id: formData.owner_id,
      owner: selectedOwner ? { id: selectedOwner.id, name: selectedOwner.name } : undefined,
      location_state: formData.location_state,
      location_country: formData.location_country,
      currency: formData.currency,
      purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
      purchase_date: formData.purchase_date || null,
      latest_valuation: formData.latest_valuation ? parseFloat(formData.latest_valuation) : null,
      latest_valuation_date: formData.latest_valuation_date || null,
    }

    try {
      await onAssetAdded(newAsset)
      toast({ title: "Success", description: "Asset created successfully" })
      setFormData({
        name: "", type: "", owner_id: "",
        location_state: "", location_country: "", currency: "USD",
        purchase_value: "", purchase_date: "",
        latest_valuation: "", latest_valuation_date: "",
      })
      setOpen(false)
    } catch {
      toast({ title: "Error", description: "Failed to create asset", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Create a new asset record with valuation and ownership details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name + Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name <span className="text-destructive">*</span></Label>
                <Input id="name" value={formData.name} onChange={set("name")} required />
              </div>
              <div className="space-y-2">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))} required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select asset type" /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <Label>Owner <span className="text-destructive">*</span></Label>
              <Select value={formData.owner_id} onValueChange={(v) => setFormData((p) => ({ ...p, owner_id: v }))} required>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select owner" /></SelectTrigger>
                <SelectContent>
                  {identities.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{i.name}</span>
                        <span className="text-muted-foreground">({i.type})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_state">State/Province</Label>
                <Input id="location_state" value={formData.location_state} onChange={set("location_state")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location_country">Country <span className="text-destructive">*</span></Label>
                <Input id="location_country" value={formData.location_country} onChange={set("location_country")} required />
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Currency <span className="text-destructive">*</span></Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData((p) => ({ ...p, currency: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c}</span>
                        <span className="text-muted-foreground">
                          ({currencySymbols[c]})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Value + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_value">Purchase Value</Label>
                <Input id="purchase_value" type="number" step="0.01" placeholder="0.00"
                  value={formData.purchase_value} onChange={set("purchase_value")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={set("purchase_date")} />
              </div>
            </div>

            {/* Latest Valuation + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latest_valuation">Latest Valuation</Label>
                <Input id="latest_valuation" type="number" step="0.01" placeholder="0.00"
                  value={formData.latest_valuation} onChange={set("latest_valuation")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latest_valuation_date">Latest Valuation Date</Label>
                <Input id="latest_valuation_date" type="date" value={formData.latest_valuation_date}
                  onChange={set("latest_valuation_date")} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Asset"}</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}