"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import { checkAdminStatus, adminLogout } from "@/lib/admin-actions"
import type { AdminUser } from "@/lib/admin-types"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="w-4 h-4" /> },
  { href: "/admin/assets", label: "Assets", icon: <FolderOpen className="w-4 h-4" /> },
  { href: "/admin/identities", label: "Identities", icon: <Shield className="w-4 h-4" /> },
  { href: "/admin/reports", label: "Reports", icon: <FileText className="w-4 h-4" /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
]

function AdminSidebar({
  isOpen,
  onClose,
  adminUser,
}: {
  isOpen: boolean
  onClose: () => void
  adminUser: AdminUser | null
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 lg:translate-x-0 lg:static`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-foreground font-bold text-lg tracking-tight">Capverra</h1>
              <p className="text-xs text-primary -mt-0.5">Admin Portal</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full"
                    />
                  )}

                  <span className={isActive ? "text-primary" : ""}>
                    {item.icon}
                  </span>

                  <span className="font-medium">{item.label}</span>

                  {/* Badge */}
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                      {item.badge}
                    </span>
                  )}

                  {/* Hover Arrow */}
                  <ChevronRight
                    className={`w-4 h-4 ml-auto transition-all duration-300 ${
                      isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0"
                    }`}
                  />
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Admin Info Card */}
        {adminUser && (
          <div className="absolute bottom-4 left-4 right-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-accent/50 border border-border"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {adminUser.name?.[0]?.toUpperCase() || adminUser.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate text-sm">
                    {adminUser.name || "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{adminUser.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium capitalize">
                  {adminUser.role.replace("_", " ")}
                </span>
                <span className="flex items-center gap-1 text-emerald-500 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </motion.aside>
    </>
  )
}

function AdminHeader({
  onMenuClick,
  adminUser,
  onLogout,
}: {
  onMenuClick: () => void
  adminUser: AdminUser | null
  onLogout: () => void
}) {
  const pathname = usePathname()

  const getPageTitle = () => {
    const current = navItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )
    return current?.label || "Dashboard"
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="px-4 lg:px-8 flex items-center justify-between h-16">
        {/* Left Section - Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/admin/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <motion.div
              className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-foreground font-bold text-lg tracking-tight">Capverra</h1>
              <p className="text-xs text-primary -mt-0.5">Admin</p>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </motion.button>

          {/* Mobile Menu */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-accent transition-colors"
              >
                <Avatar className="w-8 h-8 border-2 border-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {adminUser?.name?.[0]?.toUpperCase() || adminUser?.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card border-border"
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="font-medium text-sm text-foreground">{adminUser?.name || "Admin"}</p>
                <p className="text-xs text-muted-foreground">{adminUser?.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const verifyAdmin = useCallback(async () => {
    try {
      const { isAdmin, adminUser } = await checkAdminStatus()
      
      if (!isAdmin) {
        router.push("/admin/login")
        return
      }
      
      setAdminUser(adminUser)
    } catch (error) {
      console.error("Error verifying admin:", error)
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    verifyAdmin()
  }, [verifyAdmin])

  const handleLogout = async () => {
    try {
      await adminLogout()
      toast.success("Logged out successfully")
      window.location.href = "/admin/login"
    } catch {
      toast.error("Failed to logout")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
            animate={{
              rotate: [0, 180, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Shield className="w-8 h-8 text-primary" />
          </motion.div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        onMenuClick={() => setSidebarOpen(true)}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* Main Content - Full Width */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
