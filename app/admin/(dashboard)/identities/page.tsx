"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import {
  Shield, Search, ChevronLeft, ChevronRight, MoreVertical,
  Eye, Download, RefreshCw, Trash2, AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

interface Identity {
  id: string
  user_id: string
  name: string
  type: string
  citizenship: string[]
  residency: string
  goals: string[]
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
  state_province: string | null
  tax_rate: number | null
  annual_income: number | null
  risk_profile: "low" | "medium" | "high" | "aggressive"
}

function DeleteConfirmDialog({
  open, onClose, onConfirm, name, loading,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; name: string; loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-rose-500">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            Delete Identity
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-3 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="text-foreground font-semibold">"{name}"</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-600 dark:text-rose-300 leading-relaxed">
            <strong className="text-rose-700 dark:text-rose-200">Warning:</strong> All assets belonging to this identity and their associated optimization reports will also be permanently deleted. This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Deleting…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Identity & Assets
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function IdentitiesPage() {
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Identity | null>(null)
  const [deleting, setDeleting] = useState(false)
  const itemsPerPage = 20

  const loadIdentities = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: currentPage.toString(), limit: itemsPerPage.toString() })
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/admin/identities-list?${params}`)
      if (!response.ok) { console.error(`API error: ${response.status}`); return }

      const data = await response.json()
      setIdentities(data.identities || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error("Error loading identities:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  useEffect(() => { loadIdentities() }, [loadIdentities])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/identities-list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      if (!res.ok) throw new Error("Delete failed")
      toast.success(`"${deleteTarget.name}" deleted successfully`)
      setDeleteTarget(null)
      loadIdentities()
    } catch {
      toast.error("Failed to delete identity")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-500" />Identity Management
          </h1>
          <p className="text-muted-foreground mt-1">View and manage all identities</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadIdentities} disabled={loading} className="border-border text-foreground hover:bg-muted">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search identities..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name / Owner</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Risk Profile</TableHead>
                <TableHead className="text-muted-foreground">Residency</TableHead>
                <TableHead className="text-muted-foreground">State/Province</TableHead>
                <TableHead className="text-muted-foreground">Citizenship</TableHead>
                <TableHead className="text-muted-foreground">Tax Rate</TableHead>
                <TableHead className="text-muted-foreground">Annual Income</TableHead>
                <TableHead className="text-muted-foreground">Goals</TableHead>
                <TableHead className="text-muted-foreground">Created</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {loading && identities.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="flex justify-center"><RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" /></div>
                    </TableCell>
                  </TableRow>
                ) : identities.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No identities found</TableCell>
                  </TableRow>
                ) : (
                  identities.map((identity, idx) => (
                    <motion.tr
                      key={identity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-muted/40 transition-colors border-border"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground text-xs font-medium">
                            {identity.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-foreground font-medium">{identity.name}</p>
                            <p className="text-muted-foreground text-xs">{identity.user_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize border-border text-foreground">
                          {identity.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${
                          identity.risk_profile === "low"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/50"
                            : identity.risk_profile === "medium"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/50"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/50"
                        }`}>
                          {identity.risk_profile}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{identity.residency}</TableCell>
                      <TableCell className="text-muted-foreground">{identity.state_province ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{Array.isArray(identity.citizenship) ? identity.citizenship.join(", ") : identity.citizenship}</TableCell>
                      <TableCell className="text-muted-foreground">{identity.tax_rate != null ? `${identity.tax_rate}%` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{identity.annual_income != null ? `$${Number(identity.annual_income).toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{Array.isArray(identity.goals) ? identity.goals.join(", ") : identity.goals}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(identity.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <DropdownMenuItem onClick={() => setSelectedIdentity(identity)} className="cursor-pointer hover:bg-muted">
                              <Eye className="w-4 h-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-muted">
                              <Download className="w-4 h-4 mr-2" />Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(identity)} className="cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400">
                              <Trash2 className="w-4 h-4 mr-2" />Delete Identity
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Pagination */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} identities
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="border-border text-foreground hover:bg-muted disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading} className="border-border text-foreground hover:bg-muted disabled:opacity-50">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={!!selectedIdentity} onOpenChange={(open) => !open && setSelectedIdentity(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedIdentity?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Owner: {selectedIdentity?.user_email}</DialogDescription>
          </DialogHeader>
          {selectedIdentity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Type", value: selectedIdentity.type },
                  { label: "Risk Profile", value: selectedIdentity.risk_profile },
                  { label: "State/Province", value: selectedIdentity.state_province ?? "—" },
                  { label: "Residency", value: selectedIdentity.residency },
                  { label: "Tax Rate", value: selectedIdentity.tax_rate != null ? `${selectedIdentity.tax_rate}%` : "—" },
                  { label: "Annual Income", value: selectedIdentity.annual_income != null ? `$${Number(selectedIdentity.annual_income).toLocaleString()}` : "—" },
                  { label: "Goals", value: Array.isArray(selectedIdentity.goals) ? selectedIdentity.goals.join(", ") : selectedIdentity.goals },
                  { label: "Created", value: new Date(selectedIdentity.created_at).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground uppercase">{label}</p>
                    <p className="text-foreground font-medium capitalize">{value}</p>
                  </div>
                ))}
              </div>
              {selectedIdentity.citizenship && selectedIdentity.citizenship.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Citizenship</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIdentity.citizenship.map((country) => (
                      <Badge key={country} variant="secondary">{country}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        name={deleteTarget?.name || ""}
        loading={deleting}
      />
    </div>
  )
}