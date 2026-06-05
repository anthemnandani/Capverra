// app/admin/login/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { adminLogin } from "@/lib/admin-actions"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Shield, FlaskConical } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  const testCredentials = {
    email: "admin@capverra.com",
    password: "Admin@2026",
  }

  useEffect(() => {
    const seedAdmin = async () => {
      try {
        await fetch("/api/admin/seed", { method: "POST" })
      } catch {
        // Silent fail
      }
    }
    seedAdmin()
  }, [])

  const handleFillTestCredentials = async () => {
    setIsSeeding(true)
    try {
      await fetch("/api/admin/seed", { method: "POST" })
      setEmail(testCredentials.email)
      setPassword(testCredentials.password)
      toast.success("Test credentials filled!")
    } catch {
      setEmail(testCredentials.email)
      setPassword(testCredentials.password)
    } finally {
      setIsSeeding(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await adminLogin(email, password)

      if (!result.success) {
        // Show a specific message if the user is a normal client
        const msg =
          result.error === "ACCESS_DENIED_CLIENT"
            ? "This account does not have admin access. Please use the regular login."
            : result.error || "Login failed"
        toast.error(msg)
        return
      }

      toast.success("Welcome back!")
      window.location.href = "/admin/dashboard"
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 pt-32 pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Admin Portal
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Secure access for admins and super admins only
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@capverra.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                  {error.includes("regular login") && (
                    <Link
                      href="/login"
                      className="text-sm text-primary hover:underline mt-1 block"
                    >
                      Go to regular login →
                    </Link>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Authenticating..." : "Access Dashboard"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <Button
                type="button"
                onClick={handleFillTestCredentials}
                disabled={isSeeding}
                variant="outline"
                className="w-full h-10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                {isSeeding ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    Setting up...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Use Test Credentials
                  </span>
                )}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Back to User Login
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}