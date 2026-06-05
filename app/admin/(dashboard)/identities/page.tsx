"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import {
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export default function IdentitiesPage() {
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null)
  const itemsPerPage = 20

  const loadIdentities = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/admin/identities-list?${params}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] API error: ${response.status}`, errorText)
        return
      }

      const data = await response.json()
      console.log("[v0] Identities data loaded:", {DATA:data, total: data.total, count: data.identities?.length })
      setIdentities(data.identities || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error("[v0] Error loading identities:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  useEffect(() => {
    loadIdentities()
  }, [loadIdentities])

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
            <Shield className="w-6 h-6 text-indigo-400" />
            Identity Management
          </h1>
          <p className="text-muted-foreground mt-1">View and manage all identities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadIdentities}
            disabled={loading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search identities..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-10 rounded-xl"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              <TableRow>
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
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin">
                          <RefreshCw className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : identities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No identities found
                    </TableCell>
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
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {identity.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${identity.risk_profile === "low"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50"
                              : identity.risk_profile === "medium"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/50"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/50"
                            }`}
                        >
                          {identity.risk_profile}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{identity.residency}</TableCell>
                       <TableCell className="text-muted-foreground">{identity.state_province}</TableCell>
                        <TableCell className="text-muted-foreground">{identity.citizenship}</TableCell>
                         <TableCell className="text-muted-foreground">{identity.tax_rate}</TableCell>
                          <TableCell className="text-muted-foreground">{identity.annual_income}</TableCell>
                           <TableCell className="text-muted-foreground">{identity.goals}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(identity.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-background border-border text-foreground"
                          >
                            <DropdownMenuItem
                              onClick={() => setSelectedIdentity(identity)}
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
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Pagination */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, total)} of {total} identities
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || loading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={!!selectedIdentity} onOpenChange={(open) => !open && setSelectedIdentity(null)}>
        <DialogContent className="bg-background border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedIdentity?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Owner: {selectedIdentity?.user_email}
            </DialogDescription>
          </DialogHeader>
          {selectedIdentity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase">Type</p>
                  <p className="text-white font-medium capitalize">{selectedIdentity.type}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase">Risk Profile</p>
                  <p className="text-white font-medium capitalize">{selectedIdentity.risk_profile}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase">Citizenship</p>
                  <p className="text-white font-medium">{selectedIdentity.citizenship}</p>
                </div>
                 <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase">State/Province</p>
                  <p className="text-white font-medium">{selectedIdentity.state_province}</p>
                </div>
                 <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase">Residency</p>
                  <p className="text-white font-medium">{selectedIdentity.residency}</p>
                </div>
                 <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase">Tax Rate</p>
                  <p className="text-white font-medium">{selectedIdentity.tax_rate}</p>
                </div>
                 <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase">Annual Income</p>
                  <p className="text-white font-medium">{selectedIdentity.annual_income}</p>
                </div>
                 <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase">Goals</p>
                  <p className="text-white font-medium">{selectedIdentity.goals}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase">Created</p>
                  <p className="text-white font-medium">
                    {new Date(selectedIdentity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {selectedIdentity.citizenship && selectedIdentity.citizenship.length > 0 && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Citizenship</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIdentity.citizenship.map((country) => (
                      <Badge key={country} variant="secondary">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
