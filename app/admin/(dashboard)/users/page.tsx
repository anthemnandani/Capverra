// app/admin/(dashboard)/users/page.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import type { UserWithAssets } from "@/lib/admin-types"
import {
  Users, Search, Filter, ChevronLeft, ChevronRight,
  User, Mail, Calendar, FolderOpen, Shield, MoreVertical,
  Eye, RefreshCw, ChevronDown, Trash2, AlertTriangle,
  CreditCard, Crown, Zap,
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
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/context"

import type { UserRole as Role } from "@/lib/admin-types"

// ── Types ─────────────────────────────────────────────────────────────────────

// Extend UserWithAssets to include subscription fields
interface UserWithPlan extends UserWithAssets {
  plan_name?: string | null
  subscription_status?: string | null
  stripe_subscription_id?: string | null
}

// ── Config ────────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, { label: string; color: string }> = {
  client: {
    label: "User",
    color: "border-border text-muted-foreground bg-muted/50",
  },
  admin: {
    label: "Admin",
    color: "border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10",
  },
  super_admin: {
    label: "Super Admin",
    color: "border-indigo-500/50 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
  },
}

const ROLE_FILTER_OPTIONS: { value: Role | "all"; label: string }[] = [
  { value: "all",         label: "All roles"   },
  { value: "client",      label: "User"        },
  { value: "admin",       label: "Admin"       },
  { value: "super_admin", label: "Super Admin" },
]

const PLAN_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  free: {
    label: "Free",
    color: "border-border text-muted-foreground bg-muted/50",
    icon: <Zap className="w-3 h-3" />,
  },
  start: {
    label: "Start",
    color: "border-sky-500/50 text-sky-600 dark:text-sky-400 bg-sky-500/10",
    icon: <Crown className="w-3 h-3" />,
  },
  launch: {
    label: "Launch",
    color: "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    icon: <Crown className="w-3 h-3" />,
  },
  grow: {
    label: "Grow",
    color: "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    icon: <Crown className="w-3 h-3" />,
  },
  dominate: {
    label: "Dominate",
    color: "border-violet-500/50 text-violet-600 dark:text-violet-400 bg-violet-500/10",
    icon: <Crown className="w-3 h-3" />,
  },
  enterprise: {
    label: "Enterprise",
    color: "border-indigo-500/50 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
    icon: <Crown className="w-3 h-3" />,
  },
}

// ── Small reusable badges ─────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role as Role] ?? ROLE_CONFIG.client
  return (
    <Badge variant="outline" className={`capitalize text-xs ${cfg.color}`}>
      {cfg.label}
    </Badge>
  )
}

function PlanBadge({ plan, status }: { plan?: string | null; status?: string | null }) {
  const key = (plan ?? "free").toLowerCase()
  const cfg = PLAN_CONFIG[key] ?? PLAN_CONFIG.free
  const isActive = status === "active"

  return (
    <Badge variant="outline" className={`capitalize text-xs flex items-center gap-1 ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
      {isActive && key !== "free" && (
        <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="Active" />
      )}
    </Badge>
  )
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteUserDialog({
  user,
  open,
  onClose,
  onDeleted,
}: {
  user: UserWithPlan | null
  open: boolean
  onClose: () => void
  onDeleted: (userId: string) => void
}) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/delete`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete user")
      toast.success(`${user.name || user.email} has been deleted`)
      onDeleted(user.id)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-rose-500">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            Delete User
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-3 leading-relaxed">
            Are you sure you want to permanently delete{" "}
            <span className="text-foreground font-semibold">
              {user.name || user.email}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <div className="text-sm text-rose-600 dark:text-rose-300 leading-relaxed space-y-1">
            <p>
              <strong className="text-rose-700 dark:text-rose-200">Warning:</strong>{" "}
              The following data will also be permanently deleted:
            </p>
            <ul className="list-disc list-inside space-y-0.5 mt-1 text-rose-600 dark:text-rose-300">
              <li>
                <strong>{user.asset_count}</strong> asset{user.asset_count !== 1 ? "s" : ""}
              </li>
              <li>
                <strong>{user.identity_count}</strong> {user.identity_count !== 1 ? "identities" : "identity"}
              </li>
              <li>All associated optimization reports</li>
            </ul>
            <p className="mt-1 font-medium text-rose-700 dark:text-rose-200">
              This action cannot be undone.
            </p>
          </div>
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
            onClick={handleDelete}
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
                Delete User & All Data
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Role change menu — only in the actions dropdown, super_admin only ─────────

function RoleChangeMenu({
  user,
  currentUserRole,
  onRoleChanged,
}: {
  user: UserWithPlan
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
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-muted-foreground text-xs">Change Role</DropdownMenuLabel>
      {allRoles.map((role) => (
        <DropdownMenuItem
          key={role}
          disabled={loading || role === user.role}
          onClick={() => changeRole(role)}
          className={`cursor-pointer hover:bg-muted ${role === user.role ? "opacity-40" : ""}`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                role === user.role ? "border-indigo-500" : "border-border"
              }`}
            >
              {role === user.role && (
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </div>
            <span>{ROLE_CONFIG[role].label}</span>
          </div>
        </DropdownMenuItem>
      ))}
    </>
  )
}

// ── User detail modal — VIEW ONLY, no role editing ────────────────────────────

function UserDetailModal({
  user,
  open,
  onClose,
}: {
  user: UserWithPlan | null
  open: boolean
  onClose: () => void
}) {
  const [assets, setAssets] = useState<any[]>([])
  const [identities, setIdentities] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (open && user) loadUserDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const planKey = (user.plan_name ?? "free").toLowerCase()
  const planCfg = PLAN_CONFIG[planKey] ?? PLAN_CONFIG.free
  const isActivePlan = user.subscription_status === "active"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only">
          User details for {user.name || user.email}
        </DialogDescription>

        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <Avatar className="w-14 h-14 border-2 border-indigo-500/20 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-lg font-semibold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold text-foreground truncate">
              {user.name || "Unnamed User"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <RoleBadge role={user.role} />
              <PlanBadge plan={user.plan_name} status={user.subscription_status} />
            </div>
          </div>
        </div>

        <div className="space-y-5 pt-1">

          {/* Meta row */}
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              Joined {new Date(user.created_at).toLocaleDateString()}
            </span>
            {isActivePlan && planKey !== "free" && (
              <span className="flex items-center gap-1.5 text-emerald-500">
                <CreditCard className="w-3.5 h-3.5" />
                {planCfg.label} — active
              </span>
            )}
          </div>

          {/* Assets */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              Assets
              <span className="font-normal normal-case tracking-normal text-muted-foreground/60">
                ({loadingDetails ? "…" : assets.length})
              </span>
            </p>
            {loadingDetails ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : assets.length > 0 ? (
              <div className="space-y-px max-h-44 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">{asset.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {asset.type}{asset.location_country ? ` · ${asset.location_country}` : ""}
                      </p>
                    </div>
                    {asset.latest_valuation && (
                      <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold shrink-0 ml-3">
                        ${asset.latest_valuation.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No assets</p>
            )}
          </div>

          {/* Identities */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Identities
              <span className="font-normal normal-case tracking-normal text-muted-foreground/60">
                ({loadingDetails ? "…" : identities.length})
              </span>
            </p>
            {loadingDetails ? null : identities.length > 0 ? (
              <div className="space-y-px max-h-44 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {identities.map((identity) => (
                  <div key={identity.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors">
                    <p className="text-foreground text-sm font-medium truncate">{identity.name}</p>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <Badge variant="outline" className="capitalize bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs">
                        {identity.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs ${
                          identity.risk_profile === "low"
                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : identity.risk_profile === "medium"
                              ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                              : "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {identity.risk_profile}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No identities</p>
            )}
          </div>

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
  onDelete,
  currentUserRole,
  onRoleChanged,
}: {
  user: UserWithPlan
  index: number
  onView: (user: UserWithPlan) => void
  onDelete: (user: UserWithPlan) => void
  currentUserRole: string | undefined
  onRoleChanged: (userId: string, newRole: Role) => void
}) {
  const isSuperAdmin = currentUserRole === "super_admin"

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group hover:bg-muted/40 transition-colors"
    >
      {/* User */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-border group-hover:border-indigo-500/30 transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500/80 to-purple-500/80 text-white text-sm font-semibold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-foreground font-medium">{user.name || "Unnamed"}</p>
            <p className="text-muted-foreground text-xs flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Role */}
      <TableCell>
        <RoleBadge role={user.role} />
      </TableCell>

      {/* Plan */}
      <TableCell>
        <PlanBadge plan={user.plan_name} status={user.subscription_status} />
      </TableCell>

      {/* Assets */}
      <TableCell>
        <button
          onClick={() => onView(user)}
          className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors cursor-pointer font-medium hover:underline"
        >
          <FolderOpen className="w-4 h-4" />
          <span>{user.asset_count}</span>
        </button>
      </TableCell>

      {/* Identities */}
      <TableCell>
        <button
          onClick={() => onView(user)}
          className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors cursor-pointer font-medium hover:underline"
        >
          <Shield className="w-4 h-4" />
          <span>{user.identity_count}</span>
        </button>
      </TableCell>

      {/* Joined */}
      <TableCell className="text-muted-foreground">
        {new Date(user.created_at).toLocaleDateString()}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground min-w-[180px]">
            <DropdownMenuItem
              onClick={() => onView(user)}
              className="cursor-pointer hover:bg-muted"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>

            {/* Role change — super_admin only, lives only here */}
            <RoleChangeMenu
              user={user}
              currentUserRole={currentUserRole}
              onRoleChanged={onRoleChanged}
            />

            {/* Delete — super_admin only */}
            {isSuperAdmin && (
              <>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserWithPlan[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserWithPlan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserWithPlan | null>(null)
  const limit = 10

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
      if (search) params.append("search", search)
      if (roleFilter !== "all") params.append("role", roleFilter)
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
  }, [page, search, roleFilter])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleRoleChanged = (userId: string, newRole: Role) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    )
    // If the detail modal is open for this user, update it too (read-only, so just reflect new role)
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, role: newRole } : prev)
    }
  }

  const handleUserDeleted = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setTotal((prev) => prev - 1)
    if (selectedUser?.id === userId) setSelectedUser(null)
  }

  const activeFilterLabel = ROLE_FILTER_OPTIONS.find((o) => o.value === roleFilter)?.label ?? "All roles"
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all registered users
            {isSuperAdmin && (
              <span className="ml-2 text-indigo-500 text-xs">
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
          className="border-border text-foreground hover:bg-muted"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Search + Role Filter */}
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
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-indigo-500"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`border-border text-foreground hover:bg-muted min-w-[140px] justify-between ${
                roleFilter !== "all" ? "border-indigo-500/50 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {activeFilterLabel}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground w-44">
            <DropdownMenuLabel className="text-muted-foreground text-xs">Filter by role</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            {ROLE_FILTER_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => { setRoleFilter(option.value); setPage(1) }}
                className={`cursor-pointer hover:bg-muted ${
                  option.value === roleFilter ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      option.value === roleFilter ? "bg-indigo-500" : "bg-border"
                    }`}
                  />
                  {option.label}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-card border-border backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                {roleFilter === "all" ? "All Users" : `${activeFilterLabel}s`}
              </span>
              <div className="flex items-center gap-3">
                {roleFilter !== "all" && (
                  <button
                    onClick={() => { setRoleFilter("all"); setPage(1) }}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full
                      bg-indigo-500/10 border border-indigo-500/30
                      text-indigo-600 dark:text-indigo-400
                      hover:bg-indigo-500/20 transition-colors"
                  >
                    {activeFilterLabel}
                    <span className="text-indigo-400 hover:text-indigo-200">✕</span>
                  </button>
                )}
                <span className="text-sm font-normal text-muted-foreground">{total.toLocaleString()} total</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Plan</TableHead>
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
                          <TableCell colSpan={7}>
                            <div className="h-12 bg-muted/50 rounded animate-pulse" />
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
                          onDelete={setDeleteTarget}
                          currentUserRole={currentUser?.role}
                          onRoleChanged={handleRoleChanged}
                        />
                      ))
                    ) : (
                      <TableRow className="border-border">
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No users found</p>
                          {search && <p className="text-sm mt-1">Try a different search term</p>}
                          {roleFilter !== "all" && (
                            <p className="text-sm mt-1">
                              No {activeFilterLabel.toLowerCase()}s found
                              {search ? " matching your search" : ""}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-border text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-border text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail modal — view only */}
      <UserDetailModal
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />

      {/* Delete confirmation */}
      <DeleteUserDialog
        user={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleUserDeleted}
      />
    </div>
  )
}