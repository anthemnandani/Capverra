"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { adminLogin } from "@/lib/admin-actions"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Shield, FlaskConical, Copy, Check, Sparkles } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<"email" | "password" | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  // Test admin credentials
  const testCredentials = {
    email: "admin@capverra.com",
    password: "Admin@2026",
  }

  // Seed admin user on first load
  useEffect(() => {
    const seedAdmin = async () => {
      try {
        await fetch("/api/admin/seed", { method: "POST" })
      } catch {
        // Silent fail - admin may already exist
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

  const handleCopy = async (type: "email" | "password") => {
    const value = type === "email" ? testCredentials.email : testCredentials.password
    await navigator.clipboard.writeText(value)
    setCopied(type)
    toast.success(`${type === "email" ? "Email" : "Password"} copied!`)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await adminLogin(email, password)

      if (!result.success) {
        setError(result.error || "Login failed")
        toast.error(result.error || "Login failed")
        return
      }

      toast.success("Welcome back, Admin!")
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
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Admin Portal
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Secure access to the Capverra control center
              </p>
            </div>

            {/* Login Form */}
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
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Authenticating..." : "Access Dashboard"}
              </Button>
            </form>

            {/* Test Credentials Section */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-md bg-amber-500/10">
                    <FlaskConical className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Test Admin Credentials</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-background/50 rounded-md px-3 py-2">
                    <div>
                      <span className="text-muted-foreground text-xs">Email:</span>
                      <p className="text-foreground font-mono text-xs">{testCredentials.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy("email")}
                      className="p-1.5 hover:bg-accent rounded-md transition-colors"
                    >
                      {copied === "email" ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-background/50 rounded-md px-3 py-2">
                    <div>
                      <span className="text-muted-foreground text-xs">Password:</span>
                      <p className="text-foreground font-mono text-xs">{testCredentials.password}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy("password")}
                      className="p-1.5 hover:bg-accent rounded-md transition-colors"
                    >
                      {copied === "password" ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleFillTestCredentials}
                  disabled={isSeeding}
                  variant="outline"
                  className="w-full mt-3 h-9 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  {isSeeding ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                      Setting up...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Use Test Credentials
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Back to User Login */}
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
