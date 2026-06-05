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
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-rose-400">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            Delete Identity
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-3 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="text-white font-semibold">"{name}"</span>?
          </DialogDescription>
        </DialogHeader>

        {/* Warning block — assets + reports cascade */}
        <div className="mt-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-300 leading-relaxed">
            <strong className="text-rose-200">Warning:</strong> All assets belonging to this identity and their associated optimization reports will also be permanently deleted. This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />Identity Management
          </h1>
          <p className="text-gray-400 mt-1">View and manage all identities</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadIdentities} disabled={loading} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search identities..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-10 rounded-xl"
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              <TableRow>
                <TableHead className="text-gray-400">Name / Owner</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Risk Profile</TableHead>
                <TableHead className="text-gray-400">Residency</TableHead>
                <TableHead className="text-gray-400">State/Province</TableHead>
                <TableHead className="text-gray-400">Citizenship</TableHead>
                <TableHead className="text-gray-400">Tax Rate</TableHead>
                <TableHead className="text-gray-400">Annual Income</TableHead>
                <TableHead className="text-gray-400">Goals</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {loading && identities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="flex justify-center"><RefreshCw className="w-5 h-5 text-gray-400 animate-spin" /></div>
                    </TableCell>
                  </TableRow>
                ) : identities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-400">No identities found</TableCell>
                  </TableRow>
                ) : (
                  identities.map((identity, idx) => (
                    <motion.tr
                      key={identity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white text-xs font-medium">
                            {identity.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{identity.name}</p>
                            <p className="text-gray-500 text-xs">{identity.user_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{identity.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${identity.risk_profile === "low" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50"
                            : identity.risk_profile === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/50"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/50"
                          }`}>
                          {identity.risk_profile}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{identity.residency}</TableCell>
                      <TableCell className="text-gray-400">{identity.state_province ?? "—"}</TableCell>
                      <TableCell className="text-gray-400">{Array.isArray(identity.citizenship) ? identity.citizenship.join(", ") : identity.citizenship}</TableCell>
                      <TableCell className="text-gray-400">{identity.tax_rate != null ? `${identity.tax_rate}%` : "—"}</TableCell>
                      <TableCell className="text-gray-400">{identity.annual_income != null ? `$${Number(identity.annual_income).toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-gray-400">{Array.isArray(identity.goals) ? identity.goals.join(", ") : identity.goals}</TableCell>
                      <TableCell className="text-gray-400">{new Date(identity.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
                            <DropdownMenuItem onClick={() => setSelectedIdentity(identity)} className="cursor-pointer hover:bg-white/5">
                              <Eye className="w-4 h-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/5">
                              <Download className="w-4 h-4 mr-2" />Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(identity)} className="cursor-pointer text-rose-400 hover:bg-rose-500/10 focus:text-rose-400">
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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-gray-400">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} identities</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={!!selectedIdentity} onOpenChange={(open) => !open && setSelectedIdentity(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedIdentity?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">Owner: {selectedIdentity?.user_email}</DialogDescription>
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
                  <div key={label} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400 uppercase">{label}</p>
                    <p className="text-white font-medium capitalize">{value}</p>
                  </div>
                ))}
              </div>
              {selectedIdentity.citizenship && selectedIdentity.citizenship.length > 0 && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 uppercase mb-2">Citizenship</p>
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