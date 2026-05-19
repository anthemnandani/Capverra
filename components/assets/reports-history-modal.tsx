"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  FileText,
  Calendar,
  Users,
  Globe,
  DollarSign,
  ChevronRight,
  Building2,
  User,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OptimizationResultsModal } from "./optimization-results-modal";
import type { AssetWithCalculations, Identity } from "@/lib/types";

// ── DB row shape ──────────────────────────────────────────────────────────────
interface ReportRow {
  id:                string
  asset_id:          string
  asset_name:        string
  generated_at:      string
  estimated_savings: number
  currency:          string
  summary:           string
  identities:        Array<{ name: string; type: string }>
  jurisdictions:     Array<{ name: string; code: string }>
  report_data:       Record<string, unknown>
}

interface ReportsHistoryModalProps {
  asset: AssetWithCalculations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VALID_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "ZAR"]

export function ReportsHistoryModal({
  asset,
  open,
  onOpenChange,
}: ReportsHistoryModalProps) {
  const [reports,    setReports]    = useState<ReportRow[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // View-report state
  const [viewReport, setViewReport] = useState<ReportRow | null>(null)
  const [viewOpen,   setViewOpen]   = useState(false)

  // ── Fetch reports ─────────────────────────────────────────────────────────
  const fetchReports = () => {
    if (!asset) return
    setLoading(true)
    setError(null)
    fetch(`/api/assets/reports?assetId=${encodeURIComponent(asset.id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load reports")
        const data: ReportRow[] = await res.json()
        setReports(data)
      })
      .catch((err) => {
        console.error(err)
        setError("Could not load report history. Please try again.")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (open && asset) fetchReports()
  }, [open, asset])

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setReports([])
      setError(null)
      setViewReport(null)
    }
  }, [open])

  if (!asset) return null

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", {
      style:                 "currency",
      currency:              VALID_CURRENCIES.includes(currency) ? currency : "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const getTypeIcon = (type: string) => {
    const t = (type ?? "").toLowerCase()
    if (t === "trust") return <Users className="size-3" />
    if (["llc", "corporation", "partnership", "entity"].includes(t))
      return <Building2 className="size-3" />
    return <User className="size-3" />
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      const res = await fetch(`/api/assets/reports?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleView = (report: ReportRow) => {
    setViewReport(report)
    setViewOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/*
          ── KEY FIX ──────────────────────────────────────────────────────────
          1. Remove max-h-[85vh] from DialogContent — use inline style instead
             so the modal itself has a hard cap.
          2. Use flex flex-col with overflow-hidden on the outer wrapper so the
             three sections (header / scroll-body / footer) are properly
             contained inside the fixed height.
          3. The middle section gets flex-1 + overflow-y-auto — native browser
             scroll, not ScrollArea (which needs an explicit pixel height to
             work inside flex children).
          ─────────────────────────────────────────────────────────────────────
        */}
        <DialogContent
          className="p-0 gap-0 flex flex-col overflow-hidden"
          style={{
            maxWidth:  "42rem",   /* ~2xl */
            width:     "95vw",
            maxHeight: "85vh",
            height:    "85vh",    /* give it a definite height so flex works */
          }}
        >
          {/* ── Header (fixed, never scrolls) ── */}
          <DialogHeader className="px-6 py-4 border-b bg-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg shrink-0">
                <FileText className="size-5 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg leading-tight">Report History</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  Previously generated reports for{" "}
                  <span className="font-medium text-foreground">{asset.name}</span>
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* ── Scrollable body (takes all remaining height) ── */}
          <div className="flex-1 overflow-y-auto min-h-0 p-6">

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
                <p className="text-sm">Loading reports…</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <AlertCircle className="size-8 text-red-400" />
                <p className="text-sm text-red-600">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchReports}>
                  Retry
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && reports.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                  <FileText className="size-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1">No Reports Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Click the Optimize button to generate your first tax optimization
                  analysis for this asset.
                </p>
              </div>
            )}

            {/* Report list */}
            {!loading && !error && reports.length > 0 && (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="hover:border-slate-300 transition-colors cursor-pointer"
                    onClick={() => handleView(report)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">

                          {/* Date + savings badge */}
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar className="size-4 shrink-0" />
                              <span>{format(new Date(report.generated_at), "MMM d, yyyy")}</span>
                              <span className="text-slate-300">at</span>
                              <span>{format(new Date(report.generated_at), "h:mm a")}</span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0"
                            >
                              <DollarSign className="size-3 mr-0.5" />
                              {formatCurrency(report.estimated_savings, report.currency)} potential savings
                            </Badge>
                          </div>

                          {/* Summary */}
                          <p className="text-sm text-slate-700 mb-4 leading-relaxed line-clamp-2">
                            {report.summary}
                          </p>

                          {/* Identities + Jurisdictions */}
                          <div className="flex flex-wrap gap-4">
                            {report.identities.length > 0 && (
                              <div className="flex items-start gap-2">
                                <Users className="size-4 text-slate-400 mt-0.5 shrink-0" />
                                <div className="flex flex-wrap gap-1.5">
                                  {report.identities.map((identity, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs font-normal gap-1"
                                    >
                                      {getTypeIcon(identity.type)}
                                      {identity.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {report.jurisdictions.length > 0 && (
                              <div className="flex items-start gap-2">
                                <Globe className="size-4 text-slate-400 mt-0.5 shrink-0" />
                                <div className="flex flex-wrap gap-1.5">
                                  {report.jurisdictions.map((jurisdiction, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs font-normal bg-blue-50 border-blue-200 text-blue-700"
                                    >
                                      {jurisdiction.code}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                            disabled={deletingId === report.id}
                            onClick={(e) => handleDelete(report.id, e)}
                            title="Delete report"
                          >
                            {deletingId === report.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleView(report) }}
                          >
                            View
                            <ChevronRight className="size-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer (fixed, never scrolls) ── */}
          <div className="px-6 py-4 border-t bg-slate-50 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Loading…"
                  : `${reports.length} report${reports.length !== 1 ? "s" : ""} generated`}
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View saved report in OptimizationResultsModal ── */}
      {viewReport && (
        <OptimizationResultsModal
          asset={asset}
          identities={[] as Identity[]}
          jurisdictions={[]}
          open={viewOpen}
          onOpenChange={setViewOpen}
          onBack={() => setViewOpen(false)}
          initialData={
            viewReport.report_data as unknown as Parameters<
              typeof OptimizationResultsModal
            >[0]["initialData"]
          }
        />
      )}
    </>
  );
}