"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Loader2,
  Download,
  RefreshCw,
  BarChart3,
  Users,
  FolderOpen,
  Shield,
  TrendingUp,
  Eye,
  DollarSign,
  Globe,
  Building2,
  User,
  ArrowUpRight,
  ArrowDownRight,
  X,
  ChevronDown,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ReportData {
  id: string
  user_id: string
  user_email: string
  user_name: string
  asset_id: string
  asset_name: string
  asset_type: string
  asset_location: string
  asset_value: number
  generated_at: string
  estimated_savings: number
  currency: string
  summary: string
  identities: Array<{ name: string; type: string }>
  identity_count: number
  jurisdictions: Array<{ name: string; code: string }>
  jurisdiction_count: number
  report_data: any
}

interface FilterOption {
  id: string
  name?: string
  email?: string
  type?: string
}

// Format currency
const formatCurrency = (value: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Stats Card Component
function StatsCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  color,
}: {
  title: string
  value: string | number
  subValue?: string
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
  color: string
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {trend === "up" && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
                {trend === "down" && <ArrowDownRight className="w-3 h-3 text-red-500" />}
                {subValue}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Report Detail Modal
function ReportDetailModal({
  report,
  open,
  onClose,
}: {
  report: ReportData | null
  open: boolean
  onClose: () => void
}) {
  if (!report) return null

  const data = report.report_data

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">{report.asset_name}</span>
              <p className="text-sm font-normal text-muted-foreground">
                Generated {new Date(report.generated_at).toLocaleDateString()}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Optimization report for {report.user_name} ({report.user_email})
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Summary Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Summary
              </h3>
              <Card className="bg-accent/50 border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{report.summary || "No summary available"}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-foreground">
                        Est. Savings: <strong className="text-emerald-500">{formatCurrency(report.estimated_savings, report.currency)}</strong>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Asset Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-500" />
                Asset Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-accent/50 border border-border">
                  <p className="text-xs text-muted-foreground">Asset Name</p>
                  <p className="text-sm font-medium text-foreground">{report.asset_name}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/50 border border-border">
                  <p className="text-xs text-muted-foreground">Asset Type</p>
                  <p className="text-sm font-medium text-foreground capitalize">{report.asset_type}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/50 border border-border">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium text-foreground">{report.asset_location}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/50 border border-border">
                  <p className="text-xs text-muted-foreground">Current Value</p>
                  <p className="text-sm font-medium text-foreground">{formatCurrency(report.asset_value)}</p>
                </div>
              </div>
            </div>

            {/* Identities Used */}
            {report.identities && report.identities.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-500" />
                  Identities Analyzed ({report.identity_count})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.identities.map((identity, idx) => (
                    <Badge key={idx} variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30">
                      {identity.name} ({identity.type})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Jurisdictions Analyzed */}
            {report.jurisdictions && report.jurisdictions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-500" />
                  Jurisdictions Analyzed ({report.jurisdiction_count})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.jurisdictions.map((jurisdiction, idx) => (
                    <Badge key={idx} variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                      {jurisdiction.name} ({jurisdiction.code})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {data?.recommendation && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  AI Recommendation
                </h3>
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <CardContent className="p-4">
                    <p className="font-medium text-emerald-500 mb-2">{data.recommendation.bestStructure}</p>
                    <p className="text-sm text-muted-foreground">{data.recommendation.reasoning}</p>
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">Estimated Lifetime Savings</p>
                      <p className="text-lg font-bold text-emerald-500">
                        {formatCurrency(data.recommendation.estimatedLifetimeSavings || 0)}
                      </p>
                    </div>
                    {data.recommendation.nextSteps && data.recommendation.nextSteps.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-foreground mb-2">Next Steps:</p>
                        <ul className="space-y-1">
                          {data.recommendation.nextSteps.map((step: string, idx: number) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-emerald-500">{idx + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Report Row Component
function ReportRow({ report, onView }: { report: ReportData; onView: (report: ReportData) => void }) {
  return (
    <TableRow className="hover:bg-accent/50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{report.user_name}</p>
            <p className="text-xs text-muted-foreground">{report.user_email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-amber-500" />
          <div>
            <p className="font-medium text-foreground text-sm">{report.asset_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{report.asset_type}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-cyan-500" />
          <span className="text-sm text-foreground">{report.identity_count}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm font-semibold text-emerald-500">
          {formatCurrency(report.estimated_savings, report.currency)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span className="text-sm">{new Date(report.generated_at).toLocaleDateString()}</span>
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(report)}
          className="text-primary hover:text-primary hover:bg-primary/10"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      </TableCell>
    </TableRow>
  )
}

// Main Component
export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedAsset, setSelectedAsset] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [filters, setFilters] = useState<{
    users: FilterOption[]
    assets: FilterOption[]
    identities: FilterOption[]
  }>({ users: [], assets: [], identities: [] })

  const limit = 15

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append("search", search)
      if (selectedUser && selectedUser !== "all") params.append("userId", selectedUser)
      if (selectedAsset && selectedAsset !== "all") params.append("assetId", selectedAsset)

      const response = await fetch(`/api/admin/reports-list?${params}`)

      if (!response.ok) {
        console.error(`[v0] API error: ${response.status}`)
        return
      }

      const data = await response.json()
      setReports(data.reports || [])
      setTotal(data.total || 0)
      if (data.filters) {
        setFilters(data.filters)
      }
    } catch (error) {
      console.error("[v0] Error loading reports:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedUser, selectedAsset])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const totalPages = Math.ceil(total / limit)

  // Calculate stats
  const totalSavings = reports.reduce((sum, r) => sum + (r.estimated_savings || 0), 0)
  const uniqueUsers = new Set(reports.map((r) => r.user_id)).size
  const uniqueAssets = new Set(reports.map((r) => r.asset_id)).size
  const totalIdentities = reports.reduce((sum, r) => sum + (r.identity_count || 0), 0)

  // Filter reports by tab
  const getFilteredReports = () => {
    if (activeTab === "all") return reports
    if (activeTab === "high-savings") return reports.filter((r) => r.estimated_savings >= 50000)
    if (activeTab === "recent") {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      return reports.filter((r) => new Date(r.generated_at) >= oneWeekAgo)
    }
    return reports
  }

  const filteredReports = getFilteredReports()

  const handleViewReport = (report: ReportData) => {
    setSelectedReport(report)
    setDetailModalOpen(true)
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedUser("all")
    setSelectedAsset("all")
    setPage(1)
  }

  const hasActiveFilters = search || selectedUser !== "all" || selectedAsset !== "all"

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Optimization Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            View all AI-generated optimization reports created by users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReports}
            disabled={loading}
            className="bg-card border-border text-foreground hover:bg-accent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsCard
          title="Total Reports"
          value={total}
          subValue={`${filteredReports.length} shown`}
          icon={FileText}
          color="bg-primary"
        />
        <StatsCard
          title="Total Savings"
          value={formatCurrency(totalSavings)}
          subValue="across all reports"
          icon={DollarSign}
          trend="up"
          color="bg-emerald-500"
        />
        <StatsCard
          title="Unique Users"
          value={uniqueUsers}
          subValue={`${filters.users.length} total users`}
          icon={Users}
          color="bg-indigo-500"
        />
        <StatsCard
          title="Assets Analyzed"
          value={uniqueAssets}
          subValue={`${totalIdentities} identities used`}
          icon={FolderOpen}
          color="bg-amber-500"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by asset name or summary..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Select
            value={selectedUser}
            onValueChange={(v) => {
              setSelectedUser(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full lg:w-[200px] bg-background border-border text-foreground">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground">
                All Users
              </SelectItem>
              {filters.users.map((user) => (
                <SelectItem key={user.id} value={user.id} className="text-foreground">
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedAsset}
            onValueChange={(v) => {
              setSelectedAsset(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full lg:w-[200px] bg-background border-border text-foreground">
              <FolderOpen className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Asset" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground">
                All Assets
              </SelectItem>
              {filters.assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id} className="text-foreground">
                  {asset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Tabs & Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All Reports
            </TabsTrigger>
            <TabsTrigger value="high-savings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              High Savings ($50k+)
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Recent (7 days)
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredReports.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">User</TableHead>
                        <TableHead className="text-muted-foreground">Asset</TableHead>
                        <TableHead className="text-muted-foreground">Identities</TableHead>
                        <TableHead className="text-muted-foreground">Est. Savings</TableHead>
                        <TableHead className="text-muted-foreground">Generated</TableHead>
                        <TableHead className="text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredReports.map((report) => (
                          <ReportRow key={report.id} report={report} onView={handleViewReport} />
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-foreground font-semibold mb-2">No Reports Found</h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      {hasActiveFilters
                        ? "No reports match your current filters. Try adjusting your search criteria."
                        : "No optimization reports have been generated yet."}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="mt-4">
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} reports
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-card border-border text-foreground hover:bg-accent disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-card border-border text-foreground hover:bg-accent disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  )
}
