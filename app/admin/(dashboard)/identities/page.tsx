"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseAdminClient } from "@/lib/supabase/server"
import {
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  Globe,
  TrendingUp,
  FileText,
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
  risk_profile: string
  goals: string[]
  created_at: string
  updated_at: string
  user_email?: string
}

async function getIdentities(page: number = 1, limit: number = 20, search?: string) {
  "use server"
  
  const adminClient = createSupabaseAdminClient()
  const offset = (page - 1) * limit

  let query = adminClient
    .from("identities")
    .select(`
      id,
      user_id,
      name,
      type,
      citizenship,
      residency,
      risk_profile,
      goals,
      created_at,
      updated_at,
      users!inner(email)
    `, { count: "exact" })

  if (search) {
    query = query.or(`name.ilike.%${search}%`)
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  const identities: Identity[] = (data || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    user_id: item.user_id as string,
    name: item.name as string,
    type: item.type as string,
    citizenship: (item.citizenship as string[]) || [],
    residency: item.residency as string,
    risk_profile: item.risk_profile as string,
    goals: (item.goals as string[]) || [],
    created_at: item.created_at as string,
    updated_at: item.updated_at as string,
    user_email: Array.isArray(item.users) ? (item.users[0] as { email: string })?.email : "Unknown",
  }))

  return { identities, total: count || 0 }
}

function IdentityDetailModal({
  identity,
  open,
  onClose,
}: {
  identity: Identity | null
  open: boolean
  onClose: () => void
}) {
  if (!identity) return null

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
      case "medium":
        return "border-amber-500/50 text-amber-400 bg-amber-500/10"
      case "aggressive":
        return "border-rose-500/50 text-rose-400 bg-rose-500/10"
      default:
        return "border-gray-500/50 text-gray-400 bg-gray-500/10"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-400" />
            <div>
              <p className="text-lg font-semibold">{identity.name}</p>
              <p className="text-sm text-gray-400 font-normal">{identity.user_email}</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Identity details for {identity.name}
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
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Type</p>
              <Badge variant="outline" className="capitalize bg-indigo-500/10 border-indigo-500/50 text-indigo-400">
                {identity.type}
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Risk Profile</p>
              <Badge variant="outline" className={`capitalize ${getRiskColor(identity.risk_profile)}`}>
                {identity.risk_profile}
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Residency</p>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-medium">{identity.residency || "Not specified"}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Citizenship Count</p>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium">{identity.citizenship.length}</span>
              </div>
            </motion.div>
          </div>

          {identity.citizenship.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Citizenship(s)</p>
              <div className="flex flex-wrap gap-2">
                {identity.citizenship.map((country) => (
                  <Badge key={country} variant="secondary" className="bg-white/10 text-white">
                    {country}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {identity.goals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Goals</p>
              <ul className="space-y-1">
                {identity.goals.map((goal, idx) => (
                  <li key={idx} className="text-white text-sm flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    {goal}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-xl bg-white/5 border border-white/5"
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">ID</p>
            <code className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
              {identity.id}
            </code>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function IdentityTableRow({
  identity,
  index,
  onView,
}: {
  identity: Identity
  index: number
  onView: (identity: Identity) => void
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
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-white font-medium">{identity.name}</p>
            <p className="text-gray-500 text-xs">{identity.user_email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize bg-indigo-500/10 border-indigo-500/50 text-indigo-400">
          {identity.type}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`capitalize ${
            identity.risk_profile === "low"
              ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
              : identity.risk_profile === "medium"
              ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
              : "border-rose-500/50 text-rose-400 bg-rose-500/10"
          }`}
        >
          {identity.risk_profile}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-gray-300 text-sm">{identity.residency || "N/A"}</span>
      </TableCell>
      <TableCell>
        <span className="text-gray-300 text-sm">{new Date(identity.created_at).toLocaleDateString()}</span>
      </TableCell>
      <TableCell className="text-right">
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
          <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
            <DropdownMenuItem onClick={() => onView(identity)} className="cursor-pointer hover:bg-white/5">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}

export default function AdminIdentitiesPage() {
  const [identities, setIdentities] = useState<Identity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null)
  const limit = 10

  const loadIdentities = useCallback(async () => {
    setLoading(true)
    try {
      const { identities, total } = await getIdentities(page, limit, search || undefined)
      setIdentities(identities)
      setTotal(total)
    } catch (error) {
      console.error("Error loading identities:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadIdentities()
  }, [loadIdentities])

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
            <Shield className="w-6 h-6 text-indigo-400" />
            Identity Management
          </h1>
          <p className="text-gray-400 mt-1">View and manage all identities</p>
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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
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
                <TableHead className="text-gray-400">Name / Owner</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Risk Profile</TableHead>
                <TableHead className="text-gray-400">Residency</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {loading && identities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin">
                          <RefreshCw className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : identities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      No identities found
                    </TableCell>
                  </TableRow>
                ) : (
                  identities.map((identity, idx) => (
                    <IdentityTableRow
                      key={identity.id}
                      identity={identity}
                      index={idx}
                      onView={setSelectedIdentity}
                    />
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
        <p className="text-sm text-gray-400">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} identities
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
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
            disabled={page === totalPages || loading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <IdentityDetailModal
        identity={selectedIdentity}
        open={!!selectedIdentity}
        onClose={() => setSelectedIdentity(null)}
      />
    </div>
  )
}
