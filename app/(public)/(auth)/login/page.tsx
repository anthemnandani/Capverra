"use client"

import type React from "react"
import { useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createSupabaseBrowserClient()

    try {
      if (isRegister) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })

        if (signUpError) {
          setError(signUpError.message)
          toast.error(signUpError.message)
          return
        }

        const user = signUpData.user
        if (user) {
          await supabase.from("users").upsert({
            id: user.id,
            email: user.email,
            name: user.email?.split("@")[0],
            role: "client",
          })
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) {
          toast.success("Account created! Please sign in.")
          setIsRegister(false)
          return
        }

        window.location.href = "/dashboard"
        return
      }

      // ── LOGIN BRANCH ──────────────────────────────────────────────
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        const message = authError.message.includes("Email not confirmed")
          ? "Email not confirmed. Please check your inbox."
          : "Invalid email or password."
        setError(message)
        toast.error(message)
        return
      }

      if (!authData.user) {
        setError("Login failed. Please try again.")
        return
      }

      // ── Role check — BEFORE any redirect ─────────────────────────
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle()

      if (userData?.role === "admin" || userData?.role === "super_admin") {
        // Sign out immediately — admin must use admin portal
        await supabase.auth.signOut()
        setError("This is an admin account. Please use the Admin Portal to sign in.")
        toast.error("Admin accounts must use the Admin Portal.")
        return
      }

      // Normal client — proceed to dashboard
      window.location.href = "/dashboard"

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong."
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 pt-32 pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {isRegister ? "Create account 🚀" : "Welcome Back"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isRegister ? "Start managing your assets with Capverra." : "Sign in to access your account"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  required
                  autoFocus
                  disabled={loading}
                  className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  {!isRegister && (
                    <Link href="#" className="text-sm text-primary hover:text-primary/80">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
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

              {/* Error block */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-destructive leading-relaxed">{error}</p>
                    {error.includes("Admin Portal") && (
                      <Link
                        href="/admin/login"
                        className="text-sm text-primary hover:underline mt-1.5 inline-block font-medium"
                      >
                        Go to Admin Portal →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : isRegister ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-4 text-muted-foreground">
                    {isRegister ? "Already have an account?" : "New to Capverra?"}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => router.push(isRegister ? "/login" : "/signup")}
                  className="text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  {isRegister ? "Sign in instead" : "Create an account"}
                </button>
              </div>

              {/* Admin Login Link */}
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  href="/admin/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Shield className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span>Admin Portal</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}