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
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NewAsset {
  name: string
  type: string
  owner_id: string
  owner?: { id: string; name: string }
  location_state: string
  location_country: string
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
  "Real Estate",
  "Stocks",
  "Bonds",
  "Mutual Funds",
  "ETFs",
  "Private Equity",
  "Hedge Funds",
  "Commodities",
  "Cryptocurrency",
  "Art & Collectibles",
  "Business Interest",
  "Cash & Cash Equivalents",
  "Other",
]

export function AddAssetDialog({ identities, onAssetAdded }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    owner_id: "",
    location_state: "",
    location_country: "",
    purchase_value: "",
    purchase_date: "",
    latest_valuation: "",
    latest_valuation_date: "",
  })

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
      purchase_value: formData.purchase_value ? Number.parseFloat(formData.purchase_value) : null,
      purchase_date: formData.purchase_date || null,
      latest_valuation: formData.latest_valuation ? Number.parseFloat(formData.latest_valuation) : null,
      latest_valuation_date: formData.latest_valuation_date || null,
    }

    try {
      await onAssetAdded(newAsset)

      toast({
        title: "Success",
        description: "Asset created successfully",
      })

      setFormData({
        name: "",
        type: "",
        owner_id: "",
        location_state: "",
        location_country: "",
        purchase_value: "",
        purchase_date: "",
        latest_valuation: "",
        latest_valuation_date: "",
      })
      setOpen(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to create asset",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>Create a new asset record with valuation and ownership details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
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
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_id">Owner *</Label>
            <Select
              value={formData.owner_id}
              onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {identities.map((identity) => (
                  <SelectItem key={identity.id} value={identity.id}>
                    {identity.name} ({identity.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location_state">State/Province</Label>
              <Input
                id="location_state"
                value={formData.location_state}
                onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_country">Country *</Label>
              <Input
                id="location_country"
                value={formData.location_country}
                onChange={(e) => setFormData({ ...formData, location_country: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_value">Purchase Value</Label>
              <Input
                id="purchase_value"
                type="number"
                step="0.01"
                value={formData.purchase_value}
                onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latest_valuation">Latest Valuation</Label>
              <Input
                id="latest_valuation"
                type="number"
                step="0.01"
                value={formData.latest_valuation}
                onChange={(e) => setFormData({ ...formData, latest_valuation: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latest_valuation_date">Latest Valuation Date</Label>
              <Input
                id="latest_valuation_date"
                type="date"
                value={formData.latest_valuation_date}
                onChange={(e) => setFormData({ ...formData, latest_valuation_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
