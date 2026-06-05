"use client"

import { motion } from "framer-motion"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import type { UserWithAssets } from "@/lib/admin-types"
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Calendar,
  FolderOpen,
  Shield,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

function UserDetailModal({
  user,
  open,
  onClose,
}: {
  user: UserWithAssets | null
  open: boolean
  onClose: () => void
}) {
  const [assets, setAssets] = useState<any[]>([])
  const [identities, setIdentities] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (open && user) {
      loadUserDetails()
    }
  }, [open, user])

  const loadUserDetails = async () => {
    if (!user) return
    setLoadingDetails(true)
    try {
      // Fetch user's assets and identities via API
      const response = await fetch(`/api/admin/users/${user.id}/details`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
        setIdentities(data.identities || [])
      }
    } catch (error) {
      console.error("Error loading user details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name || "Unnamed User"}</p>
              <p className="text-sm text-muted-foreground font-normal">{user.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            User details for {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground uppercase font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-border"
              >
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Role</p>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span className="text-white font-medium capitalize">{user.role}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-xl bg-white/5 border border-border"
              >
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Joined</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Assets Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase font-semibold">Assets ({assets.length})</h3>
            </div>
            {loadingDetails ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : assets.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assets.map((asset, idx) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-lg bg-white/5 border border-border hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{asset.name}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Type: {asset.type}</p>
                        {asset.location_country && (
                          <p className="text-muted-foreground text-xs mt-0.5">Location: {asset.location_country}</p>
                        )}
                      </div>
                      {asset.latest_valuation && (
                        <div className="text-right">
                          <p className="text-emerald-400 font-semibold text-sm">
                            ${asset.latest_valuation.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4">No assets found for this user</p>
            )}
          </div>

          {/* Identities Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase font-semibold">Identities ({identities.length})</h3>
            </div>
            {identities.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {identities.map((identity, idx) => (
                  <motion.div
                    key={identity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-lg bg-white/5 border border-border hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{identity.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="capitalize bg-indigo-500/10 border-indigo-500/50 text-indigo-400 text-xs">
                            {identity.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`capitalize text-xs ${
                              identity.risk_profile === "low"
                                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                : identity.risk_profile === "medium"
                                ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                                : "border-rose-500/50 text-rose-400 bg-rose-500/10"
                            }`}
                          >
                            {identity.risk_profile}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4">No identities found for this user</p>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-white/5 border border-border"
          >
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">User ID</p>
            <code className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded break-all">
              {user.id}
            </code>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UserTableRow({
  user,
  index,
  onView,
}: {
  user: UserWithAssets
  index: number
  onView: (user: UserWithAssets) => void
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
          <Avatar className="w-10 h-10 border-2 border-white/10 group-hover:border-primary/30 transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500/80 to-purple-500/80 text-white text-sm font-semibold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">{user.name || "Unnamed"}</p>
            <p className="text-muted-foreground text-xs flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`capitalize ${
            user.role === "admin"
              ? "border-indigo-500/50 text-indigo-400 bg-indigo-500/10"
              : "border-gray-500/50 text-muted-foreground bg-gray-500/10"
          }`}
        >
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>
        <button
          onClick={() => onView(user)}
          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-medium hover:underline"
        >
          <FolderOpen className="w-4 h-4" />
          <span>{user.asset_count}</span>
        </button>
      </TableCell>
      <TableCell>
        <button
          onClick={() => onView(user)}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer font-medium hover:underline"
        >
          <Shield className="w-4 h-4" />
          <span>{user.identity_count}</span>
        </button>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(user.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
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
              onClick={() => onView(user)}
              className="cursor-pointer hover:bg-white/5"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/5">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithAssets[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserWithAssets | null>(null)
  const limit = 10

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append("search", search)

      const response = await fetch(`/api/admin/users-list?${params}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] API error: ${response.status}`, errorText)
        return
      }
      
      const data = await response.json()
      console.log("[v0] Users data loaded:", { total: data.total, count: data.users?.length })
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("[v0] Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

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
            <Users className="w-6 h-6 text-indigo-400" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all registered users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-indigo-500"
          />
        </div>
        <Button
          variant="outline"
          className="bg-card border-border text-foreground hover:bg-card/70 hover:text-foreground transition-smooth"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                All Users
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {total.toLocaleString()} total
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-card/50 transition-smooth">
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Assets</TableHead>
                    <TableHead className="text-muted-foreground">Identities</TableHead>
                    <TableHead className="text-muted-foreground">Joined</TableHead>
                    <TableHead className="text-muted-foreground w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i} className="border-border">
                          <TableCell colSpan={6}>
                            <div className="h-12 bg-white/5 rounded animate-pulse" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : users.length > 0 ? (
                      users.map((user, index) => (
                        <UserTableRow
                          key={user.id}
                          user={user}
                          index={index}
                          onView={setSelectedUser}
                        />
                      ))
                    ) : (
                      <TableRow className="border-border">
                        <TableCell
                          colSpan={6}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No users found</p>
                          {search && (
                            <p className="text-sm mt-1">
                              Try a different search term
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
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
                  <span className="text-sm text-muted-foreground">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  )
}
