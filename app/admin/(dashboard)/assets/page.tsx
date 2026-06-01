"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import type { AssetWithOwner } from "@/lib/admin-types"
import {
  FolderOpen,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  Video,
  File,
  Calendar,
  User,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  Grid3X3,
  List,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const getAssetIcon = (type: string) => {
  const lower = type.toLowerCase()
  if (lower.includes("image") || lower.includes("photo")) {
    return <Image className="w-5 h-5 text-emerald-400" />
  }
  if (lower.includes("video")) {
    return <Video className="w-5 h-5 text-rose-400" />
  }
  if (lower.includes("document") || lower.includes("pdf")) {
    return <FileText className="w-5 h-5 text-amber-400" />
  }
  return <File className="w-5 h-5 text-indigo-400" />
}

const getStatusBadge = (status: string) => {
  const lower = status.toLowerCase()
  if (lower === "active" || lower === "verified") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
        <CheckCircle className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }
  if (lower === "pending") {
    return (
      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
        <Clock className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }
  return (
    <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-gray-500/20">
      <AlertCircle className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  )
}

function AssetDetailModal({
  asset,
  open,
  onClose,
}: {
  asset: AssetWithOwner | null
  open: boolean
  onClose: () => void
}) {
  if (!asset) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
              {getAssetIcon(asset.type)}
            </div>
            <div>
              <p className="text-lg font-semibold">{asset.name}</p>
              <p className="text-sm text-gray-400 font-normal capitalize">{asset.type}</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Asset details for {asset.name}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Status</p>
              {getStatusBadge(asset.status)}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Created</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium">
                  {new Date(asset.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-white/5 border border-white/5"
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Owner</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {asset.user_name?.[0]?.toUpperCase() || asset.user_email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{asset.user_name || "Unnamed"}</p>
                <p className="text-gray-500 text-xs">{asset.user_email}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 rounded-xl bg-white/5 border border-white/5"
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Asset ID</p>
            <code className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
              {asset.id}
            </code>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AssetCard({
  asset,
  index,
  onView,
}: {
  asset: AssetWithOwner
  index: number
  onView: (asset: AssetWithOwner) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group cursor-pointer"
      onClick={() => onView(asset)}
    >
      <Card className="bg-slate-900/50 border-white/5 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden">
        <CardContent className="p-4">
          {/* Asset Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            {getAssetIcon(asset.type)}
          </div>

          {/* Asset Info */}
          <h3 className="text-white font-medium truncate mb-1">{asset.name}</h3>
          <p className="text-gray-500 text-xs capitalize mb-3">{asset.type}</p>

          {/* Status */}
          <div className="mb-3">{getStatusBadge(asset.status)}</div>

          {/* Owner */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <User className="w-3 h-3" />
            <span className="truncate">{asset.user_email}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <Calendar className="w-3 h-3" />
            <span>{new Date(asset.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AssetTableRow({
  asset,
  index,
  onView,
}: {
  asset: AssetWithOwner
  index: number
  onView: (asset: AssetWithOwner) => void
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group hover:bg-white/5 transition-colors"
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            {getAssetIcon(asset.type)}
          </div>
          <div>
            <p className="text-white font-medium">{asset.name}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-gray-400 capitalize">{asset.type}</TableCell>
      <TableCell className="text-gray-400">{asset.location_country}{asset.location_state ? `, ${asset.location_state}` : ""}</TableCell>
      <TableCell className="text-gray-400">
        {asset.purchase_value ? `$${(asset.purchase_value).toLocaleString()}` : "—"}
      </TableCell>
      <TableCell className="text-gray-400">
        {asset.latest_valuation ? `$${(asset.latest_valuation).toLocaleString()}` : "—"}
      </TableCell>
      <TableCell>
        {asset.performance !== null ? (
          <span className={asset.performance >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {asset.performance >= 0 ? "+" : ""}{asset.performance.toFixed(1)}%
          </span>
        ) : (
          <span className="text-gray-500">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 flex items-center justify-center text-white text-xs font-medium">
            {asset.owner?.name?.[0]?.toUpperCase() || asset.owner?.email[0].toUpperCase()}
          </div>
          <span className="text-gray-400 text-sm truncate max-w-[150px]">
            {asset.owner?.email}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-slate-900 border-white/10 text-white"
          >
            <DropdownMenuItem
              onClick={() => onView(asset)}
              className="cursor-pointer hover:bg-white/5"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/5">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      <TableCell>{getStatusBadge(asset.status)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 flex items-center justify-center text-white text-xs font-medium">
            {asset.user_name?.[0]?.toUpperCase() || asset.user_email[0].toUpperCase()}
          </div>
          <span className="text-gray-400 text-sm truncate max-w-[150px]">
            {asset.user_email}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-gray-400">
        {new Date(asset.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-slate-900 border-white/10 text-white"
          >
            <DropdownMenuItem
              onClick={() => onView(asset)}
              className="cursor-pointer hover:bg-white/5"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/5">
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<AssetWithOwner[]>([])
  const [assetTypes, setAssetTypes] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<AssetWithOwner | null>(null)
  const limit = viewMode === "grid" ? 12 : 10

  const loadAssets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append("search", search)
      if (selectedType && selectedType !== "all") params.append("type", selectedType)

      const response = await fetch(`/api/admin/assets-list?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets)
        setTotal(data.total)
        // Extract unique asset types from the fetched data
        const types = Array.from(new Set(data.assets.map((a: any) => a.type)))
        setAssetTypes(types as string[])
      }
    } catch (error) {
      console.error("Error loading assets:", error)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, selectedType])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-amber-400" />
            Asset Management
          </h1>
          <p className="text-gray-400 mt-1">
            Browse and manage all user assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`h-8 w-8 p-0 ${
                viewMode === "list"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-8 p-0 ${
                viewMode === "grid"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAssets}
            disabled={loading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search assets by name or type..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500"
          />
        </div>
        <Select
          value={selectedType}
          onValueChange={(v) => {
            setSelectedType(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Asset Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10">
            <SelectItem value="all" className="text-white hover:bg-white/5">
              All Types
            </SelectItem>
            {assetTypes.map((type) => (
              <SelectItem
                key={type}
                value={type}
                className="text-white hover:bg-white/5 capitalize"
              >
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Assets Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {loading
                ? [...Array(8)].map((_, i) => (
                    <Card
                      key={i}
                      className="bg-slate-900/50 border-white/5 h-48 animate-pulse"
                    />
                  ))
                : assets.map((asset, index) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      index={index}
                      onView={setSelectedAsset}
                    />
                  ))}
            </AnimatePresence>
          </div>
        ) : (
          // List View
          <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-amber-400" />
                  All Assets
                </span>
                <span className="text-sm font-normal text-gray-400">
                  {total.toLocaleString()} total
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-400">Asset Name</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Location</TableHead>
                      <TableHead className="text-gray-400">Purchase Value</TableHead>
                      <TableHead className="text-gray-400">Current Value</TableHead>
                      <TableHead className="text-gray-400">Performance</TableHead>
                      <TableHead className="text-gray-400">Owner</TableHead>
                      <TableHead className="text-gray-400 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i} className="border-white/5">
                            <TableCell colSpan={5}>
                              <div className="h-12 bg-white/5 rounded animate-pulse" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : assets.length > 0 ? (
                        assets.map((asset, index) => (
                          <AssetTableRow
                            key={asset.id}
                            asset={asset}
                            index={index}
                            onView={setSelectedAsset}
                          />
                        ))
                      ) : (
                        <TableRow className="border-white/5">
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-gray-500"
                          >
                            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No assets found</p>
                            {(search || selectedType !== "all") && (
                              <p className="text-sm mt-1">
                                Try different filters
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  )
}
