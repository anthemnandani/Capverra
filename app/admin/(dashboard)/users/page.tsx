// app/admin/users/page.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import type { UserWithAssets } from "@/lib/admin-types"
import {
  Users, Search, Filter, ChevronLeft, ChevronRight,
  User, Mail, Calendar, FolderOpen, Shield, MoreVertical,
  Eye, Download, RefreshCw, ChevronUp, ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/context"

import type { UserRole as Role } from "@/lib/admin-types"

const ROLE_CONFIG: Record<Role, { label: string; color: string }> = {
  client: {
    label: "User", // Client → User
    color: "border-gray-500/50 text-gray-400 bg-gray-500/10",
  },
  admin: {
    label: "Admin",
    color: "border-blue-500/50 text-blue-400 bg-blue-500/10",
  },
  super_admin: {
    label: "Super Admin",
    color: "border-indigo-500/50 text-indigo-400 bg-indigo-500/10",
  },
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role as Role] ?? ROLE_CONFIG.client
  return (
    <Badge variant="outline" className={`capitalize text-xs ${cfg.color}`}>
      {cfg.label}
    </Badge>
  )
}

// ── Role change UI — only shown to super_admins ───────────────────────────────

function RoleChangeMenu({
  user,
  currentUserRole,
  onRoleChanged,
}: {
  user: UserWithAssets
  currentUserRole: string | undefined
  onRoleChanged: (userId: string, newRole: Role) => void
}) {
  const [loading, setLoading] = useState(false)

  if (currentUserRole !== "super_admin") return null

  const changeRole = async (newRole: Role) => {
    if (newRole === user.role) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update role")
      toast.success(`${user.name || user.email} is now ${ROLE_CONFIG[newRole].label}`)
      onRoleChanged(user.id, newRole)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setLoading(false)
    }
  }

  const allRoles: Role[] = ["client", "admin", "super_admin"]

  return (
    <>
      <DropdownMenuSeparator className="bg-white/10" />
      <DropdownMenuLabel className="text-gray-500 text-xs">Change Role</DropdownMenuLabel>
      {allRoles.map((role) => (
        <DropdownMenuItem
          key={role}
          disabled={loading || role === user.role}
          onClick={() => changeRole(role)}
          className={`cursor-pointer hover:bg-white/5 ${role === user.role ? "opacity-40" : ""}`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${role === user.role
                  ? "border-indigo-400"
                  : "border-white/20"
                }`}
            >
              {role === user.role && (
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
              )}
            </div>

            <span>{ROLE_CONFIG[role].label}</span>
          </div>
        </DropdownMenuItem>
      ))}
    </>
  )
}

// ── User detail modal ─────────────────────────────────────────────────────────

function UserDetailModal({
  user,
  open,
  onClose,
  currentUserRole,
  onRoleChanged,
}: {
  user: UserWithAssets | null
  open: boolean
  onClose: () => void
  currentUserRole: string | undefined
  onRoleChanged: (userId: string, newRole: Role) => void
}) {
  const [assets, setAssets] = useState<any[]>([])
  const [identities, setIdentities] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (open && user) loadUserDetails()
  }, [open, user])

  const loadUserDetails = async () => {
    if (!user) return
    setLoadingDetails(true)
    try {
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
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-indigo-500/30">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name || "Unnamed User"}</p>
              <p className="text-sm text-gray-400 font-normal">{user.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            User details for {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Role & Joined */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Role</p>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <RoleBadge role={user.role} />
                </div>

                {/* Inline role changer in modal — super_admin only */}
                {currentUserRole === "super_admin" && (
                  <div className="space-y-1 mt-2 pt-2 border-t border-white/10">
                    <p className="text-gray-500 text-xs mb-1">Change role</p>
                    {(["client", "admin", "super_admin"] as Role[]).map((role) => (
                      <button
                        key={role}
                        onClick={async () => {
                          if (role === user.role) return
                          try {
                            const res = await fetch(`/api/admin/users/${user.id}/role`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ role }),
                            })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error)
                            toast.success(`Role updated to ${ROLE_CONFIG[role].label}`)
                            onRoleChanged(user.id, role)
                          } catch (err: unknown) {
                            toast.error(err instanceof Error ? err.message : "Failed")
                          }
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2
                          ${role === user.role
                            ? "bg-indigo-500/20 text-indigo-300 cursor-default"
                            : "hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${role === user.role ? "bg-indigo-400" : "bg-white/20"}`} />
                        {ROLE_CONFIG[role].label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Joined</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Assets */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase">Assets ({assets.length})</h3>
            {loadingDetails ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : assets.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assets.map((asset, idx) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{asset.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">Type: {asset.type}</p>
                        {asset.location_country && (
                          <p className="text-gray-500 text-xs mt-0.5">Location: {asset.location_country}</p>
                        )}
                      </div>
                      {asset.latest_valuation && (
                        <p className="text-emerald-400 font-semibold text-sm">
                          ${asset.latest_valuation.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-4">No assets found for this user</p>
            )}
          </div>

          {/* Identities */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase">Identities ({identities.length})</h3>
            {identities.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {identities.map((identity, idx) => (
                  <motion.div
                    key={identity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
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
                            className={`capitalize text-xs ${identity.risk_profile === "low"
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
              <p className="text-gray-500 text-sm py-4">No identities found for this user</p>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-white/5 border border-white/5"
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">User ID</p>
            <code className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded break-all">
              {user.id}
            </code>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Table row ─────────────────────────────────────────────────────────────────

function UserTableRow({
  user,
  index,
  onView,
  currentUserRole,
  onRoleChanged,
}: {
  user: UserWithAssets
  index: number
  onView: (user: UserWithAssets) => void
  currentUserRole: string | undefined
  onRoleChanged: (userId: string, newRole: Role) => void
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
          <Avatar className="w-10 h-10 border-2 border-white/10 group-hover:border-indigo-500/30 transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500/80 to-purple-500/80 text-white text-sm font-semibold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">{user.name || "Unnamed"}</p>
            <p className="text-gray-500 text-xs flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <RoleBadge role={user.role} />
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
      <TableCell className="text-gray-400">
        {new Date(user.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
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
          <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white min-w-[180px]">
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
            <RoleChangeMenu
              user={user}
              currentUserRole={currentUserRole}
              onRoleChanged={onRoleChanged}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
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
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
      if (search) params.append("search", search)
      const response = await fetch(`/api/admin/users-list?${params}`)
      if (!response.ok) return
      const data = await response.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { loadUsers() }, [loadUsers])

  // Optimistically update role in local state after change
  const handleRoleChanged = (userId: string, newRole: Role) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    )
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, role: newRole } : prev)
    }
  }

  const totalPages = Math.ceil(total / limit)
  const isSuperAdmin = currentUser?.role === ("super_admin" as Role)

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
          <p className="text-gray-400 mt-1">
            View and manage all registered users
            {isSuperAdmin && (
              <span className="ml-2 text-indigo-400 text-xs">
                · Role management enabled
              </span>
            )}
          </p>
        </div>
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
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500"
          />
        </div>
        <Button variant="outline" className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                All Users
              </span>
              <span className="text-sm font-normal text-gray-400">{total.toLocaleString()} total</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">Assets</TableHead>
                    <TableHead className="text-gray-400">Identities</TableHead>
                    <TableHead className="text-gray-400">Joined</TableHead>
                    <TableHead className="text-gray-400 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i} className="border-white/5">
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
                          currentUserRole={currentUser?.role}
                          onRoleChanged={handleRoleChanged}
                        />
                      ))
                    ) : (
                      <TableRow className="border-white/5">
                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No users found</p>
                          {search && <p className="text-sm mt-1">Try a different search term</p>}
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                <p className="text-sm text-gray-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
                  <Button
                    variant="outline" size="sm"
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

      {/* Detail modal */}
      <UserDetailModal
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        currentUserRole={currentUser?.role}
        onRoleChanged={handleRoleChanged}
      />
    </div>
  )
}