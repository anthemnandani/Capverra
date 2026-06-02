"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  Users,
  Package,
  Settings,
  HelpCircle,
  LogIn,
  LogOut,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context"
import { ThemeToggle } from "@/components/theme-toggle"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Identities", href: "/identities", icon: Users },
  { name: "Assets", href: "/assets", icon: Package },
]

export function TopNavigation() {
  const pathname = usePathname()

  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              C
            </span>
          </div>

          <span className="text-xl font-bold">
            Capverra
          </span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <nav className="hidden items-center space-x-1 md:flex">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "flex items-center space-x-2",
                      isActive && "bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>
        )}

        {/* Right Side */}
        {isLoading ? (
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Hamburger Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="md:hidden flex items-center justify-center rounded-xl p-2 min-w-[44px] min-h-[44px] outline-none"
                >
                  <Menu size={24} strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-[80vw] max-w-sm rounded-xl px-2 py-4 md:hidden"
              >
                {/* Theme Toggle for Mobile */}
                <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <DropdownMenuItem
                      key={item.name}
                      asChild
                      className="cursor-pointer p-0 focus:bg-transparent"
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-lg font-medium transition-colors",
                          isActive
                            ? "bg-muted font-semibold"
                            : "hover:bg-muted/60"
                        )}
                      >
                        <Icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-11 w-11 rounded-full outline-none"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarImage
                      src={user.avatar_url ?? "/user.png"}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-base font-semibold">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[80vw] max-w-sm rounded-xl"
                align="end"
                forceMount
              >
                {/* User info header */}
                <div className="flex items-center justify-start gap-3 p-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage
                      src={user.avatar_url ?? "/user.png"}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-base font-semibold">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 leading-none min-w-0">
                    {/* ✅ CHANGED: Added text-base font-semibold */}
                    <p className="font-semibold text-base truncate">
                      {user.name}
                    </p>
                    {/* ✅ CHANGED: text-sm → text-sm (kept), w-[200px] → w-full */}
                    <p className="w-full truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    // ✅ CHANGED: py-2 → py-4 px-4, text-base, larger icon
                    className="flex items-center gap-3 py-3 px-3 text-base cursor-pointer"
                  >
                    <Settings className="h-5 w-5 shrink-0" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/help"
                    className="flex items-center gap-3 py-3 px-3 text-base cursor-pointer"
                  >
                    <HelpCircle className="h-5 w-5 shrink-0" />
                    Help
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  // ✅ CHANGED: py-2 → py-4 px-4, text-base
                  className="py-3 px-3 text-base text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        ) : (
          <Button asChild size="sm">
            <Link
              href="/login"
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Log in
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}
