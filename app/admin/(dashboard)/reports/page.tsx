"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  RefreshCw,
  BarChart3,
  Users,
  FolderOpen,
  Shield,
  TrendingUp,
  Eye,
  DollarSign,
  Globe,
  User,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Printer,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AssetWithCalculations, Identity } from "@/lib/types"
import { OptimizationResultsModal } from "@/components/assets/optimization-results-modal"

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

/**
 * Build a minimal AssetWithCalculations stub from a ReportData row so that
 * OptimizationResultsModal (which expects a full asset object) renders correctly.
 */
function buildAssetStub(report: ReportData): AssetWithCalculations {
  const [state, country] = (report.asset_location ?? "").split(",").map((s) => s.trim())
  return {
    id: report.asset_id,
    name: report.asset_name,
    type: report.asset_type,
    location_state: state ?? null,
    location_country: country ?? null,
    purchase_value: report.report_data?.assetSummary?.purchaseValue ?? null,
    purchase_date: null,
    latest_valuation: report.asset_value,
    latest_valuation_date: null,
    value_change_percentage: null,
    owner: null,
    currency: report.currency ?? "USD",
  } as unknown as AssetWithCalculations
}

// ── HTML Print Styles ─────────────────────────────────────────────────────────
const getPrintStyles = () => `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 11pt; line-height: 1.55; color: #1e293b; background: #fff; }
@page { size: A4; margin: 15mm 14mm; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
.cover { background: linear-gradient(135deg,#0f172a 0%,#3d2f0f 60%,#0f172a 100%); color:#fff; padding:28px 26px 22px; border-radius:6px; margin-bottom:22px; }
.cover-meta { font-size:9pt; color:#94a3b8; margin-bottom:6px; text-transform:uppercase; }
.cover h1 { font-size:22pt; font-weight:700; margin-bottom:4px; }
.cover-sub { font-size:11pt; color:#cbd5e1; }
.cover-stats { display:flex; flex-wrap:wrap; gap:18px; margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,.15); font-size:9.5pt; color:#94a3b8; }
.cover-stats span strong { display:block; font-size:11pt; color:#fff; }
h2 { font-size:13pt; font-weight:700; color:#0f172a; margin:20px 0 10px; padding-bottom:5px; border-bottom:2px solid #e2e8f0; }
.card { border:1px solid #e2e8f0; border-radius:6px; padding:13px 15px; margin-bottom:12px; background:#fff; }
.kv-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:9px 14px; margin-bottom:8px; }
.kv-grid .label { font-size:8pt; color:#64748b; margin-bottom:1px; }
.kv-grid .value { font-size:10.5pt; font-weight:600; }
.data-table { width:100%; border-collapse:collapse; margin:8px 0; font-size:9.5pt; }
.data-table th { background:#f8fafc; color:#475569; font-size:8pt; text-transform:uppercase; padding:5px 8px; text-align:left; border-bottom:1px solid #e2e8f0; }
.data-table td { padding:5px 8px; border-bottom:1px solid #f1f5f9; }
.data-table .fw { font-weight:600; }
.data-table .red { color:#dc2626; font-weight:600; }
.data-table .green { color:#059669; font-weight:600; }
.rec-box { background:linear-gradient(135deg,#f0fdf4 0%,#fff 100%); border:1.5px solid #6ee7b7; border-radius:6px; padding:15px 17px; margin-bottom:14px; }
.highlight-row { display:flex; justify-content:space-between; background:#fff; border:1px solid #a7f3d0; border-radius:5px; padding:11px 13px; margin-bottom:11px; }
.best-value { font-size:15pt; font-weight:800; color:#0f172a; }
.savings-value { font-size:16pt; font-weight:800; color:#059669; text-align:right; }
.disclaimer { font-size:8pt; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:10px; margin-top:10px; }
.footer { text-align:center; font-size:8pt; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:10px; margin-top:18px; }
`

// ── Print via hidden iframe (no popup flash) ──────────────────────────────────
function printViaIframe(html: string) {
  const iframe = document.createElement("iframe")
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;visibility:hidden;pointer-events:none"
  document.body.appendChild(iframe)

  const cleanup = () => {
    setTimeout(() => {
      try { if (document.body.contains(iframe)) document.body.removeChild(iframe) } catch { /* noop */ }
    }, 1_000)
  }

  const printFrame = () => {
    try {
      const win = iframe.contentWindow
      if (!win) { cleanup(); return }
      win.focus()
      win.print()
      win.onafterprint = cleanup
    } catch {
      // Fallback: blob URL in new tab
      const blob = new Blob([html], { type: "text/html" })
      const url  = URL.createObjectURL(blob)
      const popup = window.open(url, "_blank")
      popup?.addEventListener("afterprint", () => popup.close())
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      cleanup()
    }
  }

  if (typeof iframe.srcdoc !== "undefined") {
    iframe.srcdoc = html
    iframe.onload  = printFrame
  } else {
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document
    if (!doc) { cleanup(); return }
    doc.open(); doc.write(html); doc.close()
    iframe.onload = printFrame
  }
}

// ── Print helpers ─────────────────────────────────────────────────────────────
const exportReportToPDF = (report: ReportData) => {
  const data = report.report_data
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const chip = (text: string, bg = "#e2e8f0", fg = "#374151") =>
    `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:8.5pt;font-weight:600;background:${bg};color:${fg}">${text}</span>`

  const identityCards = (data?.identityComparisons ?? []).map((id: any) => `
    <div class="card" style="border-left:3px solid #C9A96A">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <strong>${id.identityName}</strong>
        <span style="font-size:9pt;color:#64748b">${id.identityType} · ${id.location}</span>
        ${id.savingsVsBaseline > 0 ? chip(`Save ${id.savingsPercentage}`, "#d1fae5", "#065f46") : chip("Higher cost", "#fee2e2", "#991b1b")}
      </div>
      <p style="font-size:9.5pt;color:#475569;margin-bottom:8px">${id.summary ?? ""}</p>
      <table class="data-table"><thead><tr><th>Metric</th><th>Value</th><th>vs Baseline</th></tr></thead><tbody>
        <tr><td class="fw">Effective Tax Rate</td><td>${id.effectiveTaxRate}</td><td class="${id.savingsVsBaseline > 0 ? "green" : "red"}">${id.savingsVsBaseline > 0 ? "Lower" : "Higher"}</td></tr>
        <tr><td class="fw">10-Year Burden</td><td>${formatCurrency(id.totalTenYearBurden)}</td><td class="${id.savingsVsBaseline > 0 ? "green" : "red"} fw">${id.savingsVsBaseline > 0 ? "-" + formatCurrency(id.savingsVsBaseline) : "+" + formatCurrency(Math.abs(id.savingsVsBaseline))}</td></tr>
      </tbody></table>
    </div>`).join("")

  const jurCards = (data?.jurisdictionAnalysis ?? []).map((j: any) => `
    <div class="card" style="border-left:3px solid #10b981">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <strong>${j.jurisdiction}</strong>
        <span style="font-size:9pt;color:#64748b">${j.code}</span>
        ${chip(`Save ${j.savingsPercentage}`, "#d1fae5", "#065f46")}
      </div>
      <p style="font-size:9pt;color:#374151;margin-bottom:6px">Recommended: <strong>${j.recommendedVehicle}</strong></p>
      <p style="font-size:9.5pt;color:#475569;margin-bottom:8px">${j.summary ?? ""}</p>
      <table class="data-table"><thead><tr><th>Metric</th><th>Value</th><th>vs Baseline</th></tr></thead><tbody>
        <tr><td class="fw">Effective Tax Rate</td><td>${j.effectiveTaxRate}</td><td class="green">Lower</td></tr>
        <tr><td class="fw">10-Year Burden</td><td>${formatCurrency(j.totalTenYearBurden)}</td><td class="green fw">-${formatCurrency(j.savingsVsBaseline)}</td></tr>
      </tbody></table>
    </div>`).join("")

  const tha = data?.timeHorizonAnalysis
  const horizonRows = tha
    ? ([["Sell in 5 Years", tha.fiveYear], ["Sell in 10 Years", tha.tenYear], ["Sell in 20 Years", tha.twentyYear], ["Hold Until Death", tha.holdUntilDeath]] as const)
        .map(([label, row]) => row
          ? `<tr><td class="fw">${label}</td><td class="red">${formatCurrency(row.baselineTax)}</td><td>${formatCurrency(row.optimizedTax)}</td><td class="green fw">${formatCurrency(row.savings)}</td></tr>`
          : "").join("")
    : ""

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Tax Report — ${report.asset_name}</title><style>${getPrintStyles()}</style></head><body>
<div class="cover">
  <div class="cover-meta">Tax Optimization Report · Admin Export · Confidential</div>
  <h1>${report.asset_name}</h1>
  <div class="cover-sub">Comprehensive AI Tax Analysis & Structure Optimization</div>
  <div class="cover-stats">
    <span>User<strong>${report.user_name}</strong></span>
    <span>Email<strong>${report.user_email}</strong></span>
    <span>Asset Type<strong>${report.asset_type}</strong></span>
    <span>Location<strong>${report.asset_location}</strong></span>
    <span>Current Value<strong>${formatCurrency(report.asset_value)}</strong></span>
    <span>Identities<strong>${report.identity_count}</strong></span>
    <span>Jurisdictions<strong>${report.jurisdiction_count}</strong></span>
    <span>Est. Savings<strong>${formatCurrency(report.estimated_savings)}</strong></span>
    <span>Generated<strong>${today}</strong></span>
  </div>
</div>
<h2>Report Summary</h2>
<div class="card"><p style="font-size:10pt">${report.summary ?? "No summary available"}</p></div>
<h2>Asset Details</h2>
<div class="card"><div class="kv-grid">
  <div><div class="label">Asset Name</div><div class="value">${report.asset_name}</div></div>
  <div><div class="label">Type</div><div class="value">${report.asset_type}</div></div>
  <div><div class="label">Location</div><div class="value">${report.asset_location}</div></div>
  <div><div class="label">Current Value</div><div class="value">${formatCurrency(report.asset_value)}</div></div>
</div></div>
${data?.baseline ? `<h2>Baseline: ${data.baseline.identityName ?? "Current Structure"}</h2>
<div class="card" style="border:2px solid #cbd5e1">
  <p style="font-size:9.5pt;color:#475569;margin-bottom:8px">${data.baseline.summary ?? ""}</p>
  <table class="data-table"><thead><tr><th>Effective Tax Rate</th><th>Annual Tax</th><th>Capital Gains Tax</th><th>Estate Tax</th><th>10-Year Burden</th></tr></thead>
  <tbody><tr><td class="fw">${data.baseline.effectiveTaxRate ?? "N/A"}</td><td>${formatCurrency(data.baseline.annualTaxLiability ?? 0)}</td><td>${formatCurrency(data.baseline.capitalGainsTax ?? 0)}</td><td>${formatCurrency(data.baseline.estateTaxExposure ?? 0)}</td><td class="red">${formatCurrency(data.baseline.totalTenYearBurden ?? 0)}</td></tr></tbody>
  </table>
</div>` : ""}
${(data?.identityComparisons ?? []).length > 0 ? `<h2>Identity Comparisons</h2>${identityCards}` : ""}
${(data?.jurisdictionAnalysis ?? []).length > 0 ? `<h2>Jurisdiction Analysis</h2>${jurCards}` : ""}
${tha ? `<h2>Tax Savings by Time Horizon</h2><div class="card"><table class="data-table"><thead><tr><th>Time Horizon</th><th>Baseline Tax</th><th>Optimized Tax</th><th>Estimated Savings</th></tr></thead><tbody>${horizonRows}</tbody></table></div>` : ""}
${data?.recommendation ? `<h2>AI Recommendation</h2>
<div class="rec-box">
  <div class="highlight-row">
    <div><div style="font-size:8.5pt;color:#64748b">Best Structure</div><div class="best-value">${data.recommendation.bestStructure ?? "N/A"}</div></div>
    <div><div style="font-size:8.5pt;color:#64748b;text-align:right">Estimated Lifetime Savings</div><div class="savings-value">${formatCurrency(data.recommendation.estimatedLifetimeSavings ?? 0)}</div></div>
  </div>
  <p style="font-size:10pt;color:#374151;margin-bottom:11px">${data.recommendation.reasoning ?? ""}</p>
  ${(data.recommendation.nextSteps ?? []).map((s: string) => `<div style="display:flex;gap:6px;font-size:9.5pt;color:#374151;margin:4px 0"><span style="color:#10b981;font-weight:700">›</span>${s}</div>`).join("")}
  <div class="disclaimer"><strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute legal, tax, or financial advice.</div>
</div>` : ""}
<div class="footer">Admin Export · ${report.asset_name} · Generated ${today} · Confidential</div>
</body></html>`

  printViaIframe(html)
}

const exportAllReportsToPDF = (reports: ReportData[]) => {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const totalSavings = reports.reduce((s, r) => s + (r.estimated_savings ?? 0), 0)
  const uniqueUsers = new Set(reports.map((r) => r.user_id)).size
  const uniqueAssets = new Set(reports.map((r) => r.asset_id)).size

  const rows = reports.map((r) => `
    <tr>
      <td style="font-weight:600">${r.user_name}</td>
      <td>${r.user_email}</td>
      <td style="font-weight:600">${r.asset_name}</td>
      <td>${r.asset_type}</td>
      <td style="text-align:center">${r.identity_count}</td>
      <td style="text-align:right;color:#059669;font-weight:600">${formatCurrency(r.estimated_savings, r.currency)}</td>
      <td>${new Date(r.generated_at).toLocaleDateString()}</td>
    </tr>`).join("")

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>All Optimization Reports - Admin</title>
  <style>${getPrintStyles()}@page{size:A4 landscape;margin:12mm}</style></head><body>
  <div class="cover">
    <div class="cover-meta">Admin Export · All Optimization Reports · Confidential</div>
    <h1>Optimization Reports Summary</h1>
    <div class="cover-sub">Comprehensive overview of all user-generated tax optimization reports</div>
    <div class="cover-stats">
      <span>Total Reports<strong>${reports.length}</strong></span>
      <span>Unique Users<strong>${uniqueUsers}</strong></span>
      <span>Assets Analyzed<strong>${uniqueAssets}</strong></span>
      <span>Total Est. Savings<strong>${formatCurrency(totalSavings)}</strong></span>
      <span>Generated<strong>${today}</strong></span>
    </div>
  </div>
  <h2>All Reports</h2>
  <div class="card" style="padding:0;overflow:hidden">
    <table class="data-table" style="margin:0"><thead><tr><th>User</th><th>Email</th><th>Asset</th><th>Type</th><th style="text-align:center">Identities</th><th style="text-align:right">Est. Savings</th><th>Generated</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </div>
  <div class="footer">Admin Export · Generated ${today} · Confidential</div>
  </body></html>`

  printViaIframe(html)
}

// ── Stats Card ────────────────────────────────────────────────────────────────
function StatsCard({
  title, value, subValue, icon: Icon, trend, color,
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

// ── Report Row ────────────────────────────────────────────────────────────────
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(report)}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportReportToPDF(report)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedAsset, setSelectedAsset] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [filters, setFilters] = useState<{
    users: FilterOption[]
    assets: FilterOption[]
    identities: FilterOption[]
  }>({ users: [], assets: [], identities: [] })

  // ── Optimization modal state (replaces ReportDetailModal) ─────────────────
  const [viewingReport, setViewingReport] = useState<ReportData | null>(null)
  const [optimizationOpen, setOptimizationOpen] = useState(false)

  const limit = 15

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
      if (search) params.append("search", search)
      if (selectedUser !== "all") params.append("userId", selectedUser)
      if (selectedAsset !== "all") params.append("assetId", selectedAsset)

      const res = await fetch(`/api/admin/reports-list?${params}`)
      if (!res.ok) { console.error(`[admin] API error: ${res.status}`); return }

      const data = await res.json()
      setReports(data.reports ?? [])
      setTotal(data.total ?? 0)
      if (data.filters) setFilters(data.filters)
    } catch (err) {
      console.error("[admin] Error loading reports:", err)
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedUser, selectedAsset])

  useEffect(() => { loadReports() }, [loadReports])

  const totalPages = Math.ceil(total / limit)
  const totalSavings = reports.reduce((s, r) => s + (r.estimated_savings ?? 0), 0)
  const uniqueUsers = new Set(reports.map((r) => r.user_id)).size
  const uniqueAssets = new Set(reports.map((r) => r.asset_id)).size
  const totalIdentities = reports.reduce((s, r) => s + (r.identity_count ?? 0), 0)

  const filteredReports = useMemo(() => {
    if (activeTab === "high-savings") return reports.filter((r) => r.estimated_savings >= 50_000)
    if (activeTab === "recent") {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
      return reports.filter((r) => new Date(r.generated_at) >= cutoff)
    }
    return reports
  }, [activeTab, reports])

  const handleViewReport = (report: ReportData) => {
    setViewingReport(report)
    setOptimizationOpen(true)
  }

  const clearFilters = () => {
    setSearch(""); setSelectedUser("all"); setSelectedAsset("all"); setPage(1)
  }
  const hasActiveFilters = search || selectedUser !== "all" || selectedAsset !== "all"

  // Build asset stub + identity/jurisdiction arrays for the modal
  const assetStub = useMemo(
    () => (viewingReport ? buildAssetStub(viewingReport) : null),
    [viewingReport],
  )
  const identityStubs = useMemo(
    () => (viewingReport?.identities ?? []).map(
      (i, idx) => ({ id: String(idx), name: i.name, type: i.type }) as unknown as Identity,
    ),
    [viewingReport],
  )
  const jurisdictionStubs = useMemo(
    () => (viewingReport?.jurisdictions ?? []).map((j, idx) => ({
      id: String(idx), name: j.name, code: j.code,
    })),
    [viewingReport],
  )

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
            variant="outline" size="sm" onClick={loadReports} disabled={loading}
            className="bg-card border-border text-foreground hover:bg-accent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm" className="bg-primary hover:bg-primary/90"
            onClick={() => exportAllReportsToPDF(filteredReports)}
            disabled={filteredReports.length === 0}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print All ({filteredReports.length})
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsCard title="Total Reports" value={total} subValue={`${filteredReports.length} shown`} icon={FileText} color="bg-primary" />
        <StatsCard title="Total Savings" value={formatCurrency(totalSavings)} subValue="across all reports" icon={DollarSign} trend="up" color="bg-emerald-500" />
        <StatsCard title="Unique Users" value={uniqueUsers} subValue={`${filters.users.length} total users`} icon={Users} color="bg-amber-500" />
        <StatsCard title="Assets Analyzed" value={uniqueAssets} subValue={`${totalIdentities} identities used`} icon={FolderOpen} color="bg-amber-500" />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by asset name or summary…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Select value={selectedUser} onValueChange={(v) => { setSelectedUser(v); setPage(1) }}>
            <SelectTrigger className="w-full lg:w-[200px] bg-background border-border text-foreground">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground">All Users</SelectItem>
              {filters.users.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-foreground">{u.name ?? u.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedAsset} onValueChange={(v) => { setSelectedAsset(v); setPage(1) }}>
            <SelectTrigger className="w-full lg:w-[200px] bg-background border-border text-foreground">
              <FolderOpen className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Asset" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground">All Assets</SelectItem>
              {filters.assets.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-foreground">{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Tabs & Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Reports</TabsTrigger>
            <TabsTrigger value="high-savings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">High Savings ($50k+)</TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Recent (7 days)</TabsTrigger>
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
                      <Button variant="outline" onClick={clearFilters} className="mt-4">Clear Filters</Button>
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
                variant="outline" size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-card border-border text-foreground hover:bg-accent disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
              <Button
                variant="outline" size="sm"
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

      {/*
        ── OptimizationResultsModal (same as user panel) ──────────────────────
        isViewMode is automatically activated because `initialData` is provided,
        so the modal renders in read-only mode — no re-generate, no save buttons.
      */}
      {assetStub && (
        <OptimizationResultsModal
          asset={assetStub}
          identities={identityStubs}
          jurisdictions={jurisdictionStubs}
          open={optimizationOpen}
          onOpenChange={(open) => {
            setOptimizationOpen(open)
            if (!open) setViewingReport(null)
          }}
          onBack={() => setOptimizationOpen(false)}
          initialData={viewingReport?.report_data ?? null}
        />
      )}
    </div>
  )
}