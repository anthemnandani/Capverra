"use client"

import { Printer } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface TimeHorizonRow { baselineTax: number; optimizedTax: number; savings: number }

interface OptimizationData {
  assetSummary: {
    name: string; type: string; location: string
    purchaseValue: number; currentValue: number; performance: string; currency: string
  }
  currentIdentitySummary: {
    identityName: string; identityType: string; location: string
    taxRate: string; annualIncome: string; riskProfile: string; goals: string[]; summary: string
  }
  baseline: {
    identityName: string; identityType: string; location: string
    effectiveTaxRate: string; annualTaxLiability: number; capitalGainsTax: number
    estateTaxExposure: number; totalTenYearBurden: number; summary: string
  }
  identityComparisons: Array<{
    identityName: string; identityType: string; location: string
    effectiveTaxRate: string; annualTaxLiability: number; capitalGainsTax: number
    estateTaxExposure: number; totalTenYearBurden: number
    savingsVsBaseline: number; savingsPercentage: string; summary: string
    advantages: string[]; disadvantages: string[]; recommendedStructure: string
  }>
  jurisdictionAnalysis: Array<{
    jurisdiction: string; code: string; recommendedVehicle: string
    effectiveTaxRate: string; annualTaxLiability: number; capitalGainsTax: number
    estateTaxExposure: number; totalTenYearBurden: number
    savingsVsBaseline: number; savingsPercentage: string; summary: string
    keyBenefits: string[]; considerations: string[]; treatyAdvantages: string
  }>
  timeHorizonAnalysis: {
    fiveYear: TimeHorizonRow; tenYear: TimeHorizonRow
    twentyYear: TimeHorizonRow; holdUntilDeath: TimeHorizonRow
  }
  recommendation: {
    bestStructure: string; reasoning: string
    estimatedLifetimeSavings: number; nextSteps: string[]
  }
}

interface PrintReportButtonProps {
  data: OptimizationData
  assetName: string
  className?: string
}

// ── Currency formatter ────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Math.round(v))

// ── HTML builder ──────────────────────────────────────────────────────────────
function buildPrintHTML(data: OptimizationData, assetName: string): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })

  const chip = (text: string, color = "#e2e8f0", fg = "#374151") =>
    `<span class="chip" style="background:${color};color:${fg}">${text}</span>`

  const savingsChip = (savings: number, pct: string) =>
    savings > 0
      ? chip(`↓ Save ${pct}`, "#d1fae5", "#065f46")
      : chip(`↑ Higher cost`, "#fee2e2", "#991b1b")

  const pros = (items: string[]) =>
    items.map(i => `<li class="pro">✓ ${i}</li>`).join("")

  const cons = (items: string[]) =>
    items.map(i => `<li class="con">⚠ ${i}</li>`).join("")

  // ── Identity comparison cards ─────────────────────────────────────────────
  const identityCards = (data.identityComparisons ?? []).map(id => `
    <div class="card identity-card">
      <div class="card-head">
        <span class="card-title">${id.identityName}</span>
        <span class="loc">${id.identityType} · ${id.location}</span>
        ${savingsChip(id.savingsVsBaseline, id.savingsPercentage)}
      </div>
      <p class="summary">${id.summary}</p>
      <table class="data-table">
        <thead><tr><th>Metric</th><th>Value</th><th>vs Baseline</th></tr></thead>
        <tbody>
          <tr>
            <td class="fw">Effective Tax Rate</td>
            <td>${id.effectiveTaxRate}</td>
            <td class="${id.savingsVsBaseline > 0 ? "green" : "red"}">${id.savingsVsBaseline > 0 ? "↓ Lower" : "↑ Higher"}</td>
          </tr>
          <tr>
            <td class="fw">Annual Tax Liability</td>
            <td>${fmt(id.annualTaxLiability)}</td><td>—</td>
          </tr>
          <tr>
            <td class="fw">Capital Gains Tax</td>
            <td>${fmt(id.capitalGainsTax)}</td><td>—</td>
          </tr>
          <tr>
            <td class="fw">Estate Tax Exposure</td>
            <td>${fmt(id.estateTaxExposure)}</td><td>—</td>
          </tr>
          <tr>
            <td class="fw">10-Year Burden</td>
            <td>${fmt(id.totalTenYearBurden)}</td>
            <td class="${id.savingsVsBaseline > 0 ? "green" : "red"} fw">
              ${id.savingsVsBaseline > 0 ? "−" + fmt(id.savingsVsBaseline) : "+" + fmt(Math.abs(id.savingsVsBaseline))}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="two-col">
        <div>
          <p class="mini-head">Advantages</p>
          <ul class="pro-con">${pros(id.advantages)}</ul>
        </div>
        <div>
          <p class="mini-head">Considerations</p>
          <ul class="pro-con">${cons(id.disadvantages)}</ul>
        </div>
      </div>
      ${id.recommendedStructure ? `<p class="rec-struct"><strong>Recommended structure:</strong> ${id.recommendedStructure}</p>` : ""}
    </div>
  `).join("")

  // ── Jurisdiction cards ────────────────────────────────────────────────────
  const jurCards = (data.jurisdictionAnalysis ?? []).map(j => `
    <div class="card jur-card">
      <div class="card-head">
        <span class="card-title">${j.jurisdiction}</span>
        <span class="loc">${j.code}</span>
        ${chip(`↓ Save ${j.savingsPercentage}`, "#d1fae5", "#065f46")}
      </div>
      <p class="rec-vehicle">Recommended vehicle: <strong>${j.recommendedVehicle}</strong></p>
      <p class="summary">${j.summary}</p>
      <table class="data-table">
        <thead><tr><th>Metric</th><th>Value</th><th>vs Baseline</th></tr></thead>
        <tbody>
          <tr>
            <td class="fw">Effective Tax Rate</td><td>${j.effectiveTaxRate}</td>
            <td class="green">↓ Lower</td>
          </tr>
          <tr>
            <td class="fw">Annual Tax Liability</td><td>${fmt(j.annualTaxLiability)}</td><td>—</td>
          </tr>
          <tr>
            <td class="fw">Capital Gains Tax</td><td>${fmt(j.capitalGainsTax)}</td><td>—</td>
          </tr>
          <tr>
            <td class="fw">Estate Tax Exposure</td><td>${fmt(j.estateTaxExposure)}</td><td>—</td>
          </tr>
          <tr>
            <td class="fw">10-Year Burden</td><td>${fmt(j.totalTenYearBurden)}</td>
            <td class="green fw">−${fmt(j.savingsVsBaseline)}</td>
          </tr>
        </tbody>
      </table>
      <p class="mini-head">Key Benefits</p>
      <ul class="pro-con">${j.keyBenefits.map(b => `<li class="pro">✓ ${b}</li>`).join("")}</ul>
      ${j.considerations?.length ? `
        <p class="mini-head">Considerations</p>
        <ul class="pro-con">${j.considerations.map(c => `<li class="con">⚠ ${c}</li>`).join("")}</ul>
      ` : ""}
      ${j.treatyAdvantages ? `<p class="treaty"><strong>Treaty Advantages:</strong> ${j.treatyAdvantages}</p>` : ""}
    </div>
  `).join("")

  // ── Time horizon rows ─────────────────────────────────────────────────────
  const tha = data.timeHorizonAnalysis
  const horizonRows = ([
    ["Sell in 5 Years",  tha.fiveYear],
    ["Sell in 10 Years", tha.tenYear],
    ["Sell in 20 Years", tha.twentyYear],
    ["Hold Until Death", tha.holdUntilDeath],
  ] as const).map(([label, row]) =>
    `<tr>
      <td class="fw">${label}</td>
      <td class="red">${fmt(row.baselineTax)}</td>
      <td>${fmt(row.optimizedTax)}</td>
      <td class="green fw">${fmt(row.savings)}</td>
    </tr>`
  ).join("")

  const goalChips = (data.currentIdentitySummary.goals ?? [])
    .map(g => chip(g, "#eff6ff", "#1d4ed8")).join(" ")

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Tax Optimization Report — ${assetName}</title>
<style>
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.55;
  color: #1e293b;
  background: #fff;
}

/* ── Page setup ── */
@page {
  size: A4;
  margin: 15mm 14mm 15mm 14mm;
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* Headings must never be orphaned at bottom of page */
  h2 { break-after: avoid; }

  /* Small atoms that must stay together */
  .card-head       { break-inside: avoid; }
  .two-col         { break-inside: avoid; }
  tr               { break-inside: avoid; }
  .highlight-row   { break-inside: avoid; }
  .next-step       { break-inside: avoid; }
  .disclaimer      { break-inside: avoid; }

  /* Cards: allow page breaks INSIDE tall cards — do NOT force avoid here.
     If the card is short enough (< ~12 lines) the browser will naturally
     keep it on one page; forcing avoid on tall cards is what caused gaps. */
  .card { break-inside: auto; }

  /* The cover block should always start fresh if it's not the first thing */
  .cover { break-after: auto; }

  /* Recommendation box is compact enough to stay together */
  .rec-box { break-inside: avoid; }
}

/* ── Cover ── */
.cover {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%);
  color: #fff;
  padding: 28px 26px 22px;
  border-radius: 6px;
  margin-bottom: 22px;
}
.cover-meta { font-size: 9pt; color: #94a3b8; margin-bottom: 6px; letter-spacing: .5px; text-transform: uppercase; }
.cover h1   { font-size: 22pt; font-weight: 700; margin-bottom: 4px; }
.cover-sub  { font-size: 11pt; color: #cbd5e1; }
.cover-stats {
  display: flex; flex-wrap: wrap; gap: 18px;
  margin-top: 16px; padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,.15);
  font-size: 9.5pt; color: #94a3b8;
}
.cover-stats span strong { display: block; font-size: 11pt; color: #fff; }

/* ── Section headings ── */
h2 {
  font-size: 13pt; font-weight: 700; color: #0f172a;
  margin: 20px 0 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid #e2e8f0;
  display: flex; align-items: center; gap: 6px;
}
h2::before { content: attr(data-icon); font-size: 14pt; }

/* ── Cards ── */
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

/* ── KV grid ── */
.kv-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px 14px;
  margin-bottom: 8px;
}
.kv-grid .label { font-size: 8pt; color: #64748b; margin-bottom: 1px; }
.kv-grid .value { font-size: 10.5pt; font-weight: 600; }
.kv-grid .value.green { color: #059669; }
.kv-grid .value.red   { color: #dc2626; }

/* ── Data table ── */
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
.data-table .red   { color: #dc2626; font-weight: 600; }
.data-table .green { color: #059669; font-weight: 600; }

/* ── Two-column layout ── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }

/* ── Pro/con lists ── */
.mini-head {
  font-size: 8pt; font-weight: 700; text-transform: uppercase;
  color: #64748b; letter-spacing: .4px; margin: 8px 0 4px;
}
.pro-con { list-style: none; }
.pro-con li { font-size: 9pt; padding: 2px 0; }
.pro-con li.pro { color: #065f46; }
.pro-con li.con { color: #92400e; }

/* ── Chips ── */
.chip {
  display: inline-block;
  padding: 2px 8px; border-radius: 999px;
  font-size: 8.5pt; font-weight: 600; white-space: nowrap;
}

/* ── Text helpers ── */
.summary     { font-size: 9.5pt; color: #475569; margin: 6px 0; }
.rec-vehicle { font-size: 9.5pt; color: #374151; margin-bottom: 4px; }
.rec-struct  { font-size: 9pt; color: #64748b; margin-top: 8px; }
.treaty      { font-size: 9pt; background: #f8fafc; border-radius: 4px; padding: 5px 8px; margin-top: 8px; }

/* ── Card accents ── */
.identity-card { border-left: 3px solid #3b82f6; }
.jur-card      { border-left: 3px solid #10b981; }
.baseline-card { border: 2px solid #cbd5e1; }
.baseline-card .chip-outline {
  border: 1px solid #94a3b8; color: #475569;
  background: transparent; font-size: 8pt; padding: 1px 7px; border-radius: 4px;
}

/* ── Recommendation box ── */
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
.best-label    { font-size: 8.5pt; color: #64748b; margin-bottom: 3px; }
.best-value    { font-size: 15pt; font-weight: 800; color: #0f172a; }
.savings-label { font-size: 8.5pt; color: #64748b; margin-bottom: 3px; text-align: right; }
.savings-value { font-size: 16pt; font-weight: 800; color: #059669; text-align: right; }
.reasoning     { font-size: 10pt; color: #374151; margin-bottom: 11px; }
.next-step { display: flex; gap: 6px; font-size: 9.5pt; color: #374151; margin: 4px 0; }
.next-step::before { content: "›"; color: #10b981; font-weight: 700; font-size: 11pt; line-height: 1.3; }

/* ── Disclaimer & footer ── */
.disclaimer {
  font-size: 8pt; color: #94a3b8;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px; margin-top: 10px; line-height: 1.5;
}
.footer {
  text-align: center; font-size: 8pt; color: #94a3b8;
  border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 18px;
}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-meta">Tax Optimization Report · Confidential</div>
  <h1>${data.assetSummary.name}</h1>
  <div class="cover-sub">Comprehensive AI Tax Analysis &amp; Structure Optimization</div>
  <div class="cover-stats">
    <span>Asset Type<strong>${data.assetSummary.type}</strong></span>
    <span>Location<strong>${data.assetSummary.location}</strong></span>
    <span>Current Value<strong>${fmt(data.assetSummary.currentValue)}</strong></span>
    <span>Performance<strong>${data.assetSummary.performance}</strong></span>
    <span>Identities Compared<strong>${(data.identityComparisons ?? []).length + 1}</strong></span>
    <span>Jurisdictions<strong>${(data.jurisdictionAnalysis ?? []).length}</strong></span>
    <span>Est. Lifetime Savings<strong>${fmt(data.recommendation.estimatedLifetimeSavings)}</strong></span>
    <span>Generated<strong>${today}</strong></span>
  </div>
</div>

<!-- ASSET SUMMARY -->
<h2 data-icon="🏛">Asset Summary</h2>
<div class="card">
  <div class="kv-grid">
    <div><div class="label">Asset Name</div><div class="value">${data.assetSummary.name}</div></div>
    <div><div class="label">Type</div><div class="value">${data.assetSummary.type}</div></div>
    <div><div class="label">Location</div><div class="value">${data.assetSummary.location}</div></div>
    <div><div class="label">Currency</div><div class="value">${data.assetSummary.currency}</div></div>
    <div><div class="label">Purchase Value</div><div class="value">${fmt(data.assetSummary.purchaseValue)}</div></div>
    <div><div class="label">Current Value</div><div class="value">${fmt(data.assetSummary.currentValue)}</div></div>
    <div>
      <div class="label">Performance</div>
      <div class="value ${data.assetSummary.performance.startsWith("+") ? "green" : data.assetSummary.performance.startsWith("-") ? "red" : ""}">
        ${data.assetSummary.performance}
      </div>
    </div>
  </div>
</div>

<!-- CURRENT IDENTITY -->
<h2 data-icon="👤">Current Identity</h2>
<div class="card" style="border-left:3px solid #3b82f6;background:linear-gradient(135deg,#fff,#eff6ff22)">
  <div class="card-head">
    <span class="card-title">${data.currentIdentitySummary.identityName}</span>
    ${chip("Associated Identity", "#f1f5f9", "#475569")}
  </div>
  <div class="kv-grid" style="grid-template-columns:repeat(3,1fr)">
    <div><div class="label">Type</div><div class="value" style="text-transform:capitalize">${data.currentIdentitySummary.identityType}</div></div>
    <div><div class="label">Location</div><div class="value">${data.currentIdentitySummary.location}</div></div>
    <div><div class="label">Tax Rate</div><div class="value">${data.currentIdentitySummary.taxRate}</div></div>
    <div><div class="label">Annual Income</div><div class="value">${data.currentIdentitySummary.annualIncome}</div></div>
    <div><div class="label">Risk Profile</div><div class="value" style="text-transform:capitalize">${data.currentIdentitySummary.riskProfile}</div></div>
  </div>
  ${goalChips ? `<div style="margin:8px 0 6px">${goalChips}</div>` : ""}
  <p class="summary" style="border-top:1px solid #dbeafe;padding-top:8px">${data.currentIdentitySummary.summary}</p>
</div>

<!-- BASELINE -->
<h2 data-icon="📊">Baseline: ${data.baseline.identityName}</h2>
<div class="card baseline-card">
  <div class="card-head">
    <span class="card-title">${data.baseline.identityName}</span>
    <span class="loc">${data.baseline.identityType} · ${data.baseline.location}</span>
    <span class="chip-outline">Current Structure</span>
  </div>
  <p class="summary">${data.baseline.summary}</p>
  <table class="data-table">
    <thead><tr><th>Effective Tax Rate</th><th>Annual Tax</th><th>Capital Gains Tax</th><th>Estate Tax</th><th>10-Year Burden</th></tr></thead>
    <tbody>
      <tr>
        <td class="fw">${data.baseline.effectiveTaxRate}</td>
        <td>${fmt(data.baseline.annualTaxLiability)}</td>
        <td>${fmt(data.baseline.capitalGainsTax)}</td>
        <td>${fmt(data.baseline.estateTaxExposure)}</td>
        <td class="red">${fmt(data.baseline.totalTenYearBurden)}</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- IDENTITY COMPARISONS -->
${(data.identityComparisons ?? []).length > 0 ? `
<h2 data-icon="👥">Identity Comparisons</h2>
${identityCards}
` : ""}

<!-- JURISDICTION ANALYSIS -->
${(data.jurisdictionAnalysis ?? []).length > 0 ? `
<h2 data-icon="🌍">Jurisdiction Analysis</h2>
${jurCards}
` : ""}

<!-- TIME HORIZON -->
<h2 data-icon="📈">Tax Savings by Time Horizon</h2>
<div class="card">
  <table class="data-table">
    <thead>
      <tr><th>Time Horizon</th><th>Baseline Tax</th><th>Optimized Tax</th><th>Estimated Savings</th></tr>
    </thead>
    <tbody>${horizonRows}</tbody>
  </table>
</div>

<!-- RECOMMENDATION -->
<h2 data-icon="✅">Recommendation</h2>
<div class="rec-box">
  <div class="highlight-row">
    <div>
      <div class="best-label">Best Structure</div>
      <div class="best-value">${data.recommendation.bestStructure}</div>
    </div>
    <div>
      <div class="savings-label">Estimated Lifetime Savings</div>
      <div class="savings-value">${fmt(data.recommendation.estimatedLifetimeSavings)}</div>
    </div>
  </div>
  <p class="reasoning">${data.recommendation.reasoning}</p>
  <p class="mini-head">Next Steps</p>
  ${data.recommendation.nextSteps.map(s => `<div class="next-step">${s}</div>`).join("")}
  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute legal,
    tax, or financial advice. Please consult with qualified legal, tax, and compliance advisors in the
    relevant jurisdictions before taking any action. Tax laws are subject to change.
  </div>
</div>

<!-- FOOTER -->
<div class="footer">
  Tax Optimization Report · ${assetName} · Generated ${today} · Confidential — For Authorized Use Only
</div>

<!--
  FIX #2 — No popup flash
  ─────────────────────────────────────────────────────────────────────────────
  Previous approach opened window.open() which briefly showed a blank tab
  before print dialog appeared — users saw an unwanted extra window flash.

  New approach:
  1. This HTML is loaded into a hidden <iframe> injected into the CURRENT page.
  2. We call iframe.contentWindow.print() — the browser's print dialog opens
     directly over the current page, zero extra windows visible to the user.
  3. After printing, the iframe is removed from the DOM.
  The iframe is sized 0×0 and positioned off-screen so it is completely
  invisible. The browser still renders it for print purposes.
-->
<script>
  window.addEventListener("load", function () {
    setTimeout(function () { window.print(); }, 300);
  });
</script>
</body>
</html>`
}

// ── Button component ──────────────────────────────────────────────────────────
export function PrintReportButton({
  data,
  assetName,
  className,
}: PrintReportButtonProps) {
  const handlePrint = () => {
    const html = buildPrintHTML(data, assetName)

    // Explicit typing fixes TS "never" issues
    const iframe: HTMLIFrameElement =
      document.createElement("iframe")

    // Invisible iframe for printing
    iframe.style.position = "fixed"
    iframe.style.top = "-9999px"
    iframe.style.left = "-9999px"
    iframe.style.width = "210mm"
    iframe.style.height = "297mm"
    iframe.style.border = "none"
    iframe.style.visibility = "hidden"
    iframe.style.pointerEvents = "none"

    document.body.appendChild(iframe)

    const cleanup = () => {
      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        } catch {
          // ignore cleanup errors
        }
      }, 1000)
    }

    const printFrame = () => {
      try {
        const win = iframe.contentWindow

        if (!win) {
          cleanup()
          return
        }

        win.focus()
        win.print()

        // Cleanup after print
        win.onafterprint = cleanup
      } catch {
        // Fallback
        const blob = new Blob([html], { type: "text/html" })
        const url = URL.createObjectURL(blob)

        const popup = window.open(url, "_blank")

        popup?.addEventListener("afterprint", () => {
          popup.close()
        })

        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 10000)

        cleanup()
      }
    }

    // Modern browser support
    if (typeof iframe.srcdoc !== "undefined") {
      iframe.srcdoc = html

      iframe.onload = () => {
        printFrame()
      }
    } else {
      const doc =
        iframe.contentDocument ||
        iframe.contentWindow?.document

      if (!doc) {
        cleanup()
        return
      }

      doc.open()
      doc.write(html)
      doc.close()

      iframe.onload = () => {
        printFrame()
      }
    }
  }

  return (
    <button
      onClick={handlePrint}
      className={className}
      title="Print / Save as PDF"
    >
      <Printer
        style={{
          width: 16,
          height: 16,
          marginRight: 4,
          display: "inline-block",
          verticalAlign: "middle",
        }}
      />
      Print Report
    </button>
  )
}