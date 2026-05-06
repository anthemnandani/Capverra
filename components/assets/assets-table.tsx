"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AssetWithCalculations, Identity } from "@/lib/types"
import { AddAssetDialog } from "./add-asset-dialog"
import { AssetOptimizationDialog } from "./asset-optimization-dialog"
import { TrendingUp, TrendingDown } from "lucide-react"

export function AssetsTable() {
  const [assets, setAssets] = useState<AssetWithCalculations[]>([])
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)

  const identityOptions = useMemo(
    () => identities.map((identity) => ({ id: identity.id, name: identity.name, type: identity.type })),
    [identities],
  )

  const loadAssetsAndIdentities = async () => {
    const [assetsResponse, identitiesResponse] = await Promise.all([
      fetch("/api/assets", { cache: "no-store" }),
      fetch("/api/identities", { cache: "no-store" }),
    ])

    if (!assetsResponse.ok) {
      throw new Error("Failed to fetch assets")
    }

    if (!identitiesResponse.ok) {
      throw new Error("Failed to fetch identities")
    }

    const [assetsData, identitiesData] = await Promise.all([assetsResponse.json(), identitiesResponse.json()])
    setAssets(assetsData)
    setIdentities(identitiesData)
  }

  useEffect(() => {
    loadAssetsAndIdentities()
      .catch((error) => console.error("Failed to load assets:", error))
      .finally(() => setLoading(false))
  }, [])

  const handleAssetAdded = async (
    newAsset: Omit<AssetWithCalculations, "id" | "created_at" | "updated_at" | "value_change_amount" | "value_change_percentage">,
  ) => {
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newAsset),
    })

    if (!response.ok) {
      throw new Error("Failed to create asset")
    }

    const asset = await response.json()
    setAssets((current) => [asset, ...current])
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  const getAssetTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "Real Estate": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Stocks: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Bonds: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Cryptocurrency: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    }
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Assets</CardTitle>
          <AddAssetDialog identities={identityOptions} onAssetAdded={handleAssetAdded} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading assets...</p>
          </div>
        ) : null}
        {!loading && assets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No assets found</p>
            <AddAssetDialog identities={identityOptions} onAssetAdded={handleAssetAdded} />
          </div>
        ) : !loading ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Purchase Value</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Latest Valuation</TableHead>
                  <TableHead>Valuation Date</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <Badge className={getAssetTypeColor(asset.type)}>{asset.type}</Badge>
                    </TableCell>
                    <TableCell>{asset.owner?.name || "Unknown"}</TableCell>
                    <TableCell>
                      {asset.location_state ? `${asset.location_state}, ` : ""}
                      {asset.location_country}
                    </TableCell>
                    <TableCell>{formatCurrency(asset.purchase_value)}</TableCell>
                    <TableCell>{formatDate(asset.purchase_date)}</TableCell>
                    <TableCell>{formatCurrency(asset.latest_valuation)}</TableCell>
                    <TableCell>{formatDate(asset.latest_valuation_date)}</TableCell>
                    <TableCell>
                      {asset.value_change_percentage !== null && asset.value_change_percentage !== undefined ? (
                        <div className="flex items-center gap-1">
                          {asset.value_change_percentage >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={asset.value_change_percentage >= 0 ? "text-green-600" : "text-red-600"}>
                            {asset.value_change_percentage > 0 ? "+" : ""}
                            {asset.value_change_percentage.toFixed(2)}%
                          </span>
                          <div className="text-xs text-muted-foreground">
                            ({formatCurrency(asset.value_change_amount)})
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <AssetOptimizationDialog asset={asset} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
