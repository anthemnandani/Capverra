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

// ── HTML Print Styles ─────────────────────────────────────────────────────────
const getPrintStyles = () => `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.55;
  color: #1e293b;
  background: #fff;
}

@page {
  size: A4;
  margin: 15mm 14mm 15mm 14mm;
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h2 { break-after: avoid; }
  .card-head, .two-col, tr, .highlight-row, .next-step, .disclaimer { break-inside: avoid; }
  .card { break-inside: auto; }
  .rec-box { break-inside: avoid; }
}

.cover {
  background: linear-gradient(135deg, #0f172a 0%, #3d2f0f 60%, #0f172a 100%);
  color: #fff;
  padding: 28px 26px 22px;
  border-radius: 6px;
  margin-bottom: 22px;
}
.cover-meta { font-size: 9pt; color: #94a3b8; margin-bottom: 6px; letter-spacing: .5px; text-transform: uppercase; }
.cover h1 { font-size: 22pt; font-weight: 700; margin-bottom: 4px; }
.cover-sub { font-size: 11pt; color: #cbd5e1; }
.cover-stats {
  display: flex; flex-wrap: wrap; gap: 18px;
  margin-top: 16px; padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,.15);
  font-size: 9.5pt; color: #94a3b8;
}
.cover-stats span strong { display: block; font-size: 11pt; color: #fff; }

h2 {
  font-size: 13pt; font-weight: 700; color: #0f172a;
  margin: 20px 0 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid #e2e8f0;
  display: flex; align-items: center; gap: 6px;
}
h2::before { content: attr(data-icon); font-size: 14pt; }

.card {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 13px 15px;
  margin-bottom: 12px;
  background: #fff;
}
.card-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px; flex-wrap: wrap;
}
.card-title { font-size: 12pt; font-weight: 700; }
.loc { font-size: 9pt; color: #64748b; }

.kv-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px 14px;
  margin-bottom: 8px;
}
.kv-grid .label { font-size: 8pt; color: #64748b; margin-bottom: 1px; }
.kv-grid .value { font-size: 10.5pt; font-weight: 600; }
.kv-grid .value.green { color: #059669; }
.kv-grid .value.red { color: #dc2626; }

.data-table {
  width: 100%; border-collapse: collapse;
  margin: 8px 0; font-size: 9.5pt;
}
.data-table th {
  background: #f8fafc; color: #475569;
  font-size: 8pt; text-transform: uppercase; letter-spacing: .3px;
  padding: 5px 8px; text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 5px 8px;
  border-bottom: 1px solid #f1f5f9;
}
.data-table td.fw { font-weight: 600; }
.data-table .red { color: #dc2626; font-weight: 600; }
.data-table .green { color: #059669; font-weight: 600; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }

.mini-head {
  font-size: 8pt; font-weight: 700; text-transform: uppercase;
  color: #64748b; letter-spacing: .4px; margin: 8px 0 4px;
}
.pro-con { list-style: none; }
.pro-con li { font-size: 9pt; padding: 2px 0; }
.pro-con li.pro { color: #065f46; }
.pro-con li.con { color: #92400e; }

.chip {
  display: inline-block;
  padding: 2px 8px; border-radius: 999px;
  font-size: 8.5pt; font-weight: 600; white-space: nowrap;
}

.summary { font-size: 9.5pt; color: #475569; margin: 6px 0; }
.rec-vehicle { font-size: 9.5pt; color: #374151; margin-bottom: 4px; }
.rec-struct { font-size: 9pt; color: #64748b; margin-top: 8px; }
.treaty { font-size: 9pt; background: #f8fafc; border-radius: 4px; padding: 5px 8px; margin-top: 8px; }

.identity-card { border-left: 3px solid #C9A96A; }
.jur-card { border-left: 3px solid #10b981; }
.baseline-card { border: 2px solid #cbd5e1; }
.baseline-card .chip-outline {
  border: 1px solid #94a3b8; color: #475569;
  background: transparent; font-size: 8pt; padding: 1px 7px; border-radius: 4px;
}

.rec-box {
  background: linear-gradient(135deg, #f0fdf4 0%, #fff 100%);
  border: 1.5px solid #6ee7b7;
  border-radius: 6px; padding: 15px 17px; margin-bottom: 14px;
}
.highlight-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  background: #fff; border: 1px solid #a7f3d0;
  border-radius: 5px; padding: 11px 13px; margin-bottom: 11px;
}
.best-label { font-size: 8.5pt; color: #64748b; margin-bottom: 3px; }
.best-value { font-size: 15pt; font-weight: 800; color: #0f172a; }
.savings-label { font-size: 8.5pt; color: #64748b; margin-bottom: 3px; text-align: right; }
.savings-value { font-size: 16pt; font-weight: 800; color: #059669; text-align: right; }
.reasoning { font-size: 10pt; color: #374151; margin-bottom: 11px; }
.next-step { display: flex; gap: 6px; font-size: 9.5pt; color: #374151; margin: 4px 0; }
.next-step::before { content: "›"; color: #10b981; font-weight: 700; font-size: 11pt; line-height: 1.3; }

.disclaimer {
  font-size: 8pt; color: #94a3b8;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px; margin-top: 10px; line-height: 1.5;
}
.footer {
  text-align: center; font-size: 8pt; color: #94a3b8;
  border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 18px;
}
`

// ── Export single report to printable HTML ────────────────────────────────────
const exportReportToPDF = (report: ReportData) => {
  const data = report.report_data
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })

  const chip = (text: string, color = "#e2e8f0", fg = "#374151") =>
    `<span class="chip" style="background:${color};color:${fg}">${text}</span>`

  const savingsChip = (savings: number, pct: string) =>
    savings > 0
      ? chip(`Save ${pct}`, "#d1fae5", "#065f46")
      : chip(`Higher cost`, "#fee2e2", "#991b1b")

  // Build identity comparison cards
  const identityCards = (data?.identityComparisons ?? []).map((id: any) => `
    <div class="card identity-card">
      <div class="card-head">
        <span class="card-title">${id.identityName}</span>
        <span class="loc">${id.identityType} · ${id.location}</span>
        ${savingsChip(id.savingsVsBaseline, id.savingsPercentage)}
      </div>
      <p class="summary">${id.summary || ''}</p>
      <table class="data-table">
        <thead><tr><th>Metric</th><th>Value</th><th>vs Baseline</th></tr></thead>
        <tbody>
          <tr>
            <td class="fw">Effective Tax Rate</td>
            <td>${id.effectiveTaxRate}</td>
            <td class="${id.savingsVsBaseline > 0 ? "green" : "red"}">${id.savingsVsBaseline > 0 ? "Lower" : "Higher"}</td>
          </tr>
          <tr><td class="fw">Annual Tax Liability</td><td>${formatCurrency(id.annualTaxLiability)}</td><td>—</td></tr>
          <tr><td class="fw">Capital Gains Tax</td><td>${formatCurrency(id.capitalGainsTax)}</td><td>—</td></tr>
          <tr><td class="fw">Estate Tax Exposure</td><td>${formatCurrency(id.estateTaxExposure)}</td><td>—</td></tr>
          <tr>
            <td class="fw">10-Year Burden</td>
            <td>${formatCurrency(id.totalTenYearBurden)}</td>
            <td class="${id.savingsVsBaseline > 0 ? "green" : "red"} fw">
              ${id.savingsVsBaseline > 0 ? "-" + formatCurrency(id.savingsVsBaseline) : "+" + formatCurrency(Math.abs(id.savingsVsBaseline))}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="two-col">
        <div>
          <p class="mini-head">Advantages</p>
          <ul class="pro-con">${(id.advantages || []).map((a: string) => `<li class="pro">✓ ${a}</li>`).join("")}</ul>
        </div>
        <div>
          <p class="mini-head">Considerations</p>
          <ul class="pro-con">${(id.disadvantages || []).map((d: string) => `<li class="con">⚠ ${d}</li>`).join("")}</ul>
        </div>
      </div>
      ${id.recommendedStructure ? `<p class="rec-struct"><strong>Recommended structure:</strong> ${id.recommendedStructure}</p>` : ""}
    </div>
  `).join("")

  // Build jurisdiction cards
  const jurCards = (data?.jurisdictionAnalysis ?? []).map((j: any) => `
    <div class="card jur-card">
      <div class="card-head">
        <span class="card-title">${j.jurisdiction}</span>
        <span class="loc">${j.code}</span>
        ${chip(`Save ${j.savingsPercentage}`, "#d1fae5", "#065f46")}
      </div>
      <p class="rec-vehicle">Recommended vehicle: <strong>${j.recommendedVehicle}</strong></p>
      <p class="summary">${j.summary || ''}</p>
      <table class="data-table">
        <thead><tr><th>Metric</th><th>Value</th><th>vs Baseline</th></tr></thead>
        <tbody>
          <tr><td class="fw">Effective Tax Rate</td><td>${j.effectiveTaxRate}</td><td class="green">Lower</td></tr>
          <tr><td class="fw">Annual Tax Liability</td><td>${formatCurrency(j.annualTaxLiability)}</td><td>—</td></tr>
          <tr><td class="fw">Capital Gains Tax</td><td>${formatCurrency(j.capitalGainsTax)}</td><td>—</td></tr>
          <tr><td class="fw">Estate Tax Exposure</td><td>${formatCurrency(j.estateTaxExposure)}</td><td>—</td></tr>
          <tr><td class="fw">10-Year Burden</td><td>${formatCurrency(j.totalTenYearBurden)}</td><td class="green fw">-${formatCurrency(j.savingsVsBaseline)}</td></tr>
        </tbody>
      </table>
      <p class="mini-head">Key Benefits</p>
      <ul class="pro-con">${(j.keyBenefits || []).map((b: string) => `<li class="pro">✓ ${b}</li>`).join("")}</ul>
      ${(j.considerations || []).length ? `
        <p class="mini-head">Considerations</p>
        <ul class="pro-con">${j.considerations.map((c: string) => `<li class="con">⚠ ${c}</li>`).join("")}</ul>
      ` : ""}
      ${j.treatyAdvantages ? `<p class="treaty"><strong>Treaty Advantages:</strong> ${j.treatyAdvantages}</p>` : ""}
    </div>
  `).join("")

  // Build time horizon rows
  const tha = data?.timeHorizonAnalysis
  const horizonRows = tha ? ([
    ["Sell in 5 Years", tha.fiveYear],
    ["Sell in 10 Years", tha.tenYear],
    ["Sell in 20 Years", tha.twentyYear],
    ["Hold Until Death", tha.holdUntilDeath],
  ] as const).map(([label, row]) =>
    row ? `<tr>
      <td class="fw">${label}</td>
      <td class="red">${formatCurrency(row.baselineTax)}</td>
      <td>${formatCurrency(row.optimizedTax)}</td>
      <td class="green fw">${formatCurrency(row.savings)}</td>
    </tr>` : ""
  ).join("") : ""

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Tax Optimization Report — ${report.asset_name}</title>
<style>${getPrintStyles()}</style>
</head>
<body>

<!-- COVER -->
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

<!-- SUMMARY -->
<h2 data-icon="📋">Report Summary</h2>
<div class="card">
  <p class="summary" style="font-size:10pt">${report.summary || 'No summary available'}</p>
</div>

<!-- ASSET SUMMARY -->
<h2 data-icon="🏛">Asset Details</h2>
<div class="card">
  <div class="kv-grid">
    <div><div class="label">Asset Name</div><div class="value">${report.asset_name}</div></div>
    <div><div class="label">Type</div><div class="value">${report.asset_type}</div></div>
    <div><div class="label">Location</div><div class="value">${report.asset_location}</div></div>
    <div><div class="label">Current Value</div><div class="value">${formatCurrency(report.asset_value)}</div></div>
  </div>
</div>

<!-- IDENTITIES -->
${report.identities && report.identities.length > 0 ? `
<h2 data-icon="👥">Identities Analyzed (${report.identity_count})</h2>
<div class="card">
  <table class="data-table">
    <thead><tr><th>Name</th><th>Type</th></tr></thead>
    <tbody>
      ${report.identities.map(i => `<tr><td class="fw">${i.name}</td><td>${i.type}</td></tr>`).join("")}
    </tbody>
  </table>
</div>
` : ""}

<!-- JURISDICTIONS -->
${report.jurisdictions && report.jurisdictions.length > 0 ? `
<h2 data-icon="🌍">Jurisdictions Analyzed (${report.jurisdiction_count})</h2>
<div class="card">
  <table class="data-table">
    <thead><tr><th>Jurisdiction</th><th>Code</th></tr></thead>
    <tbody>
      ${report.jurisdictions.map(j => `<tr><td class="fw">${j.name}</td><td>${j.code}</td></tr>`).join("")}
    </tbody>
  </table>
</div>
` : ""}

${data?.baseline ? `
<!-- BASELINE -->
<h2 data-icon="📊">Baseline: ${data.baseline.identityName || 'Current Structure'}</h2>
<div class="card baseline-card">
  <div class="card-head">
    <span class="card-title">${data.baseline.identityName || 'Current Structure'}</span>
    <span class="loc">${data.baseline.identityType || ''} · ${data.baseline.location || ''}</span>
    <span class="chip-outline">Current Structure</span>
  </div>
  <p class="summary">${data.baseline.summary || ''}</p>
  <table class="data-table">
    <thead><tr><th>Effective Tax Rate</th><th>Annual Tax</th><th>Capital Gains Tax</th><th>Estate Tax</th><th>10-Year Burden</th></tr></thead>
    <tbody>
      <tr>
        <td class="fw">${data.baseline.effectiveTaxRate || 'N/A'}</td>
        <td>${formatCurrency(data.baseline.annualTaxLiability || 0)}</td>
        <td>${formatCurrency(data.baseline.capitalGainsTax || 0)}</td>
        <td>${formatCurrency(data.baseline.estateTaxExposure || 0)}</td>
        <td class="red">${formatCurrency(data.baseline.totalTenYearBurden || 0)}</td>
      </tr>
    </tbody>
  </table>
</div>
` : ""}

<!-- IDENTITY COMPARISONS -->
${(data?.identityComparisons ?? []).length > 0 ? `
<h2 data-icon="👥">Identity Comparisons</h2>
${identityCards}
` : ""}

<!-- JURISDICTION ANALYSIS -->
${(data?.jurisdictionAnalysis ?? []).length > 0 ? `
<h2 data-icon="🌍">Jurisdiction Analysis</h2>
${jurCards}
` : ""}

<!-- TIME HORIZON -->
${tha ? `
<h2 data-icon="📈">Tax Savings by Time Horizon</h2>
<div class="card">
  <table class="data-table">
    <thead>
      <tr><th>Time Horizon</th><th>Baseline Tax</th><th>Optimized Tax</th><th>Estimated Savings</th></tr>
    </thead>
    <tbody>${horizonRows}</tbody>
  </table>
</div>
` : ""}

<!-- RECOMMENDATION -->
${data?.recommendation ? `
<h2 data-icon="✅">AI Recommendation</h2>
<div class="rec-box">
  <div class="highlight-row">
    <div>
      <div class="best-label">Best Structure</div>
      <div class="best-value">${data.recommendation.bestStructure || 'N/A'}</div>
    </div>
    <div>
      <div class="savings-label">Estimated Lifetime Savings</div>
      <div class="savings-value">${formatCurrency(data.recommendation.estimatedLifetimeSavings || 0)}</div>
    </div>
  </div>
  <p class="reasoning">${data.recommendation.reasoning || ''}</p>
  ${(data.recommendation.nextSteps || []).length > 0 ? `
    <p class="mini-head">Next Steps</p>
    ${data.recommendation.nextSteps.map((s: string) => `<div class="next-step">${s}</div>`).join("")}
  ` : ""}
  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute legal,
    tax, or financial advice. Please consult with qualified legal, tax, and compliance advisors in the
    relevant jurisdictions before taking any action. Tax laws are subject to change.
  </div>
</div>
` : ""}

<!-- FOOTER -->
<div class="footer">
  Admin Export · ${report.asset_name} · Generated ${today} · Confidential — For Authorized Use Only
</div>

<script>
window.onload = function() {
  setTimeout(function() { window.print(); }, 300);
};
</script>
</body>
</html>`

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

// ── Export all reports to printable HTML ──────────────────────────────────────
const exportAllReportsToPDF = (reports: ReportData[]) => {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })
  
  const totalSavings = reports.reduce((sum, r) => sum + (r.estimated_savings || 0), 0)
  const uniqueUsers = new Set(reports.map((r) => r.user_id)).size
  const uniqueAssets = new Set(reports.map((r) => r.asset_id)).size

  const tableRows = reports.map(r => `
    <tr>
      <td class="fw">${r.user_name}</td>
      <td>${r.user_email}</td>
      <td class="fw">${r.asset_name}</td>
      <td>${r.asset_type}</td>
      <td style="text-align:center">${r.identity_count}</td>
      <td class="green" style="text-align:right">${formatCurrency(r.estimated_savings, r.currency)}</td>
      <td>${new Date(r.generated_at).toLocaleDateString()}</td>
    </tr>
  `).join("")

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>All Optimization Reports - Admin Export</title>
<style>
${getPrintStyles()}
@page { size: A4 landscape; margin: 12mm; }
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px 15px;
  text-align: center;
}
.summary-box .label { font-size: 8pt; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
.summary-box .value { font-size: 16pt; font-weight: 700; color: #0f172a; }
.summary-box .value.green { color: #059669; }
</style>
</head>
<body>

<!-- COVER -->
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

<!-- SUMMARY STATS -->
<div class="summary-grid">
  <div class="summary-box">
    <div class="label">Total Reports</div>
    <div class="value">${reports.length}</div>
  </div>
  <div class="summary-box">
    <div class="label">Total Estimated Savings</div>
    <div class="value green">${formatCurrency(totalSavings)}</div>
  </div>
  <div class="summary-box">
    <div class="label">Unique Users</div>
    <div class="value">${uniqueUsers}</div>
  </div>
  <div class="summary-box">
    <div class="label">Assets Analyzed</div>
    <div class="value">${uniqueAssets}</div>
  </div>
</div>

<!-- REPORTS TABLE -->
<h2 data-icon="📋">All Reports</h2>
<div class="card" style="padding:0;overflow:hidden">
  <table class="data-table" style="margin:0">
    <thead>
      <tr>
        <th>User</th>
        <th>Email</th>
        <th>Asset</th>
        <th>Type</th>
        <th style="text-align:center">Identities</th>
        <th style="text-align:right">Est. Savings</th>
        <th>Generated</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</div>

<!-- FOOTER -->
<div class="footer">
  Admin Export · All Optimization Reports · Generated ${today} · Confidential — For Authorized Use Only
</div>

<script>
window.onload = function() {
  setTimeout(function() { window.print(); }, 300);
};
</script>
</body>
</html>`

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
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
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => exportReportToPDF(report)}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Report
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
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
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
            color="bg-amber-500"
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
