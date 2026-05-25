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

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Identities", href: "/identities", icon: Users },
  { name: "Assets", href: "/assets", icon: Package },
]

export function TopNavigation() {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              C
            </span>
          </div>

          <span className="text-xl font-bold">Capverra</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <nav className="hidden items-center space-x-1 md:flex">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.name} href={item.href}>
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
            {/* Mobile Hamburger Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                >
                  <Menu className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52 md:hidden"
              >
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center",
                          isActive && "font-medium"
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
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
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.avatar_url ?? "/user.png"}
                      alt={user.name}
                    />

                    <AvatarFallback>
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-56"
                align="end"
                forceMount
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>

                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex items-center"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/help"
                    className="flex items-center"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
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