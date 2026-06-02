"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import type { AdminReport } from "@/lib/admin-types"
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  BarChart3,
  Users,
  FolderOpen,
  Shield,
  TrendingUp,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const reportTypeConfig: Record<
  AdminReport["report_type"],
  { icon: React.ElementType; color: string; label: string }
> = {
  users: { icon: Users, color: "text-indigo-400", label: "Users Report" },
  assets: { icon: FolderOpen, color: "text-amber-400", label: "Assets Report" },
  identities: { icon: Shield, color: "text-cyan-400", label: "Identities Report" },
  optimization: { icon: TrendingUp, color: "text-emerald-400", label: "Optimization Report" },
  analytics: { icon: BarChart3, color: "text-purple-400", label: "Analytics Report" },
}

const getStatusBadge = (status: AdminReport["status"]) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      )
    case "processing":
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </Badge>
      )
    case "pending":
      return (
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    case "failed":
      return (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      )
  }
}

function CreateReportModal({
  open,
  onClose,
  adminId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  adminId: string
  onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<AdminReport["report_type"]>("users")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please enter a report title")
      return
    }

    setLoading(true)
    try {
      const result = await createReport(
        adminId,
        reportType,
        title.trim(),
        description.trim() || undefined
      )

      if (result.success) {
        toast.success("Report created successfully")
        onCreated()
        onClose()
        setTitle("")
        setDescription("")
      } else {
        toast.error(result.error || "Failed to create report")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            Create New Report
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Generate a new report to analyze platform data
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="report-type" className="text-gray-300">
              Report Type
            </Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as AdminReport["report_type"])}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {(Object.keys(reportTypeConfig) as AdminReport["report_type"][]).map((type) => {
                  const config = reportTypeConfig[type]
                  const Icon = config.icon
                  return (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-white hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">
              Report Title
            </Label>
            <Input
              id="title"
              placeholder="Enter report title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ReportCard({
  report,
  index,
}: {
  report: AdminReport
  index: number
}) {
  const config = reportTypeConfig[report.report_type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="bg-slate-900/50 border-white/5 hover:border-indigo-500/30 transition-all duration-300 h-full">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon className={`w-6 h-6 ${config.color}`} />
            </div>
            {getStatusBadge(report.status)}
          </div>

          {/* Content */}
          <h3 className="text-white font-semibold mb-1 line-clamp-1">{report.title}</h3>
          <p className="text-gray-500 text-sm mb-3 capitalize">{config.label}</p>

          {report.description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{report.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {new Date(report.created_at).toLocaleDateString()}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [adminUser, setAdminUser] = useState<any>(null)
  const limit = 12

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append("search", search)
      if (selectedType && selectedType !== "all") params.append("type", selectedType)

      const response = await fetch(`/api/admin/reports-list?${params}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] API error: ${response.status}`, errorText)
        return
      }
      
      const data = await response.json()
      console.log("[v0] Reports data loaded:", { total: data.total, count: data.reports?.length })
      setReports(data.reports || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("[v0] Error loading reports:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedType])

  useEffect(() => {
    loadReports()
  }, [loadReports])

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
            <FileText className="w-6 h-6 text-purple-400" />
            Reports
          </h1>
          <p className="text-gray-400 mt-1">
            View and generate platform reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReports}
            disabled={loading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10">
            <SelectItem value="all" className="text-white hover:bg-white/5">
              All Types
            </SelectItem>
            {(Object.keys(reportTypeConfig) as AdminReport["report_type"][]).map((type) => (
              <SelectItem
                key={type}
                value={type}
                className="text-white hover:bg-white/5"
              >
                {reportTypeConfig[type].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Reports Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-slate-900/50 border-white/5 h-48 animate-pulse" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {reports.map((report, index) => (
                <ReportCard key={report.id} report={report} index={index} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Card className="bg-slate-900/50 border-white/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">No Reports Yet</h3>
              <p className="text-gray-500 text-center mb-4">
                Create your first report to start analyzing platform data
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
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

      {/* Create Report Modal */}
      {adminUser && (
        <CreateReportModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          adminId={adminUser.id}
          onCreated={loadReports}
        />
      )}
    </div>
  )
}
