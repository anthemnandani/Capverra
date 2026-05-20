"use client"

import type React from "react"
import { useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError("")

    try {
      const supabase = createSupabaseBrowserClient()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        toast.error(error.message)
        return
      }

      const user = data.user

      if (user) {
        await supabase.from("users").upsert({
          id: user.id,
          email: user.email,
          name: user.email?.split("@")[0],
          role: "client",
        })
      }

      toast.success("Account created successfully!")

      window.location.href = "/dashboard"
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong."

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
                Create account 🚀
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Start managing your assets with Capverra.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>

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
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Already have an account? Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}