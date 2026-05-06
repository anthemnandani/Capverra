"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Home, Users, Package, Settings, HelpCircle, LogIn, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Identities", href: "/identities", icon: Users },
  { name: "Assets", href: "/assets", icon: Package },
]

export function TopNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState("Demo User")
  const [userEmail, setUserEmail] = useState("No email")
  const [isDemoUser, setIsDemoUser] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createSupabaseBrowserClient()

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        setIsDemoUser(true)
        setUserName("Demo User")
        setUserEmail("No email")
        return
      }

      setUserEmail(user.email ?? "No email")
      const metadataName = String(user.user_metadata?.full_name ?? "").trim()
      setUserName(metadataName || user.email?.split("@")[0] || "User")
      setIsDemoUser(false)
    }

    loadUser()

    return () => {
      mounted = false
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-xl">Capverra</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("flex items-center space-x-2", isActive && "bg-secondary")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{userName}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help" className="flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isDemoUser ? (
              <DropdownMenuItem asChild>
                <Link href="/auth/login" className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Log in
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
