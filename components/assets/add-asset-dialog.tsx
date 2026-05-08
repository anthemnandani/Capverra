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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { countries } from "@/lib/countries"

type Currency =
  | "USD"
  | "EUR"
  | "GBP"
  | "ZAR"
  | "CHF"
  | "JPY"
  | "AUD"
  | "CAD"

const currencies: Currency[] = [
  "USD",
  "EUR",
  "GBP",
  "ZAR",
  "CHF",
  "JPY",
  "AUD",
  "CAD",
]

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  ZAR: "R",
  CHF: "CHF",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
}

interface NewAsset {
  name: string
  type: string
  owner_id: string
  owner?: {
    id: string
    name: string
  }
  location_state: string
  location_country: string
  currency: string
  purchase_value: number | null
  purchase_date: string | null
  latest_valuation: number | null
  latest_valuation_date: string | null
}

interface AddAssetDialogProps {
  identities: Array<{
    id: string
    name: string
    type: string
  }>
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

const INITIAL_FORM_STATE = {
  name: "",
  type: "",
  owner_id: "",
  location_state: "",
  location_country: "",
  currency: "USD",
  purchase_value: "",
  purchase_date: "",
  latest_valuation: "",
  latest_valuation_date: "",
}

export function AddAssetDialog({
  identities,
  onAssetAdded,
}: AddAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  const [formData, setFormData] = useState(INITIAL_FORM_STATE)

  const handleInputChange =
    (key: keyof typeof INITIAL_FORM_STATE) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [key]: e.target.value,
      }))
    }

  const handleSelectChange = (
    key: keyof typeof INITIAL_FORM_STATE,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (loading) return

    setLoading(true)

    try {
      const selectedOwner = identities.find(
        (identity) => identity.id === formData.owner_id
      )

      const newAsset: NewAsset = {
        name: formData.name.trim(),
        type: formData.type,
        owner_id: formData.owner_id,
        owner: selectedOwner
          ? {
              id: selectedOwner.id,
              name: selectedOwner.name,
            }
          : undefined,
        location_state: formData.location_state.trim(),
        location_country: formData.location_country,
        currency: formData.currency,
        purchase_value: Number(formData.purchase_value),
        purchase_date: formData.purchase_date,
        latest_valuation: Number(formData.latest_valuation),
        latest_valuation_date: formData.latest_valuation_date,
      }

      await onAssetAdded(newAsset)

      toast({
        title: "Success",
        description: "Asset created successfully",
      })

      resetForm()
      setOpen(false)
    } catch (error) {
      console.error("[ADD_ASSET_ERROR]", error)

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
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (loading) return

        setOpen(value)

        if (!value) {
          resetForm()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
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
          <div className="grid gap-5 py-4">
            {/* Asset Name + Type */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Asset Name{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="name"
                  placeholder="Enter asset name"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Asset Type{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    handleSelectChange("type", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
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

            {/* Owner */}
            <div className="space-y-2">
              <Label>
                Owner <span className="text-destructive">*</span>
              </Label>

              <Select
                value={formData.owner_id}
                onValueChange={(value) =>
                  handleSelectChange("owner_id", value)
                }
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>

                <SelectContent>
                  {identities.map((identity) => (
                    <SelectItem
                      key={identity.id}
                      value={identity.id}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {identity.name}
                        </span>

                        <span className="text-muted-foreground">
                          ({identity.type})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location_state">
                  State / Province{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="location_state"
                  placeholder="Enter state or province"
                  value={formData.location_state}
                  onChange={handleInputChange("location_state")}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Country <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={formData.location_country}
                  onValueChange={(value) =>
                    handleSelectChange(
                      "location_country",
                      value
                    )
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>

                  <SelectContent className="max-h-72">
                    {countries.map((country) => (
                      <SelectItem
                        key={country.code}
                        value={country.code}
                      >
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>
                Currency <span className="text-destructive">*</span>
              </Label>

              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  handleSelectChange("currency", value)
                }
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>

                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem
                      key={currency}
                      value={currency}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {currency}
                        </span>

                        <span className="text-muted-foreground">
                          ({currencySymbols[currency]})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Value + Purchase Date */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_value">
                  Purchase Value{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="purchase_value"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.purchase_value}
                  onChange={handleInputChange("purchase_value")}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_date">
                  Purchase Date{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={handleInputChange("purchase_date")}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Latest Valuation + Latest Valuation Date */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latest_valuation">
                  Latest Valuation{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="latest_valuation"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.latest_valuation}
                  onChange={handleInputChange("latest_valuation")}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latest_valuation_date">
                  Latest Valuation Date{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="latest_valuation_date"
                  type="date"
                  value={formData.latest_valuation_date}
                  onChange={handleInputChange(
                    "latest_valuation_date"
                  )}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Asset"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}