"use client"

import type React from "react"
import { useState } from "react"
import {
  Check, Eye, EyeOff, Loader2, AlertCircle,
  Sparkles, ChevronDown, Zap,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Badge }    from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn }         from "@/lib/utils"
import type { Plan }  from "@/lib/plans"

// ── Plan highlights shown inside the modal ────────────────────────────────────
const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  start:    ["2 optimization reports", "2 identities", "1 jurisdiction"],
  launch:   ["5 optimization reports", "3 identities", "2 jurisdictions"],
  grow:     ["20 optimization reports", "4 identities", "3 jurisdictions"],
  dominate: ["50 optimization reports", "4 identities", "4 jurisdictions"],
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface RegisterCheckoutModalProps {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  initialPlan:   Plan | null
  allPlans:      Plan[]
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RegisterCheckoutModal({
  open,
  onOpenChange,
  initialPlan,
  allPlans,
}: RegisterCheckoutModalProps) {

  // ── Form state ────────────────────────────────────────────────────────────
  const [name,            setName]            = useState("")
  const [email,           setEmail]           = useState("")
  const [password,        setPassword]        = useState("")
  const [showPassword,    setShowPassword]    = useState(false)
  const [selectedPlanId,  setSelectedPlanId]  = useState<string>(
    initialPlan?.id ?? allPlans[0]?.id ?? "start"
  )

  // Update selected plan when initialPlan prop changes (user clicks different card)
  // We use a key trick on the Dialog instead — see below

  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const selectedPlan = allPlans.find((p) => p.id === selectedPlanId) ?? allPlans[0]
  const highlights   = PLAN_HIGHLIGHTS[selectedPlanId] ?? []

  // ── Submit: create pending registration + checkout session ────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim())  { setError("Please enter your full name."); return }
    if (!email.trim()) { setError("Please enter your email address."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    if (!selectedPlanId)     { setError("Please select a plan."); return }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/stripe/register-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    name.trim(),
          email:   email.trim().toLowerCase(),
          password,
          plan_id: selectedPlanId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong. Please try again.")
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  // Reset form when modal closes
  const handleOpenChange = (next: boolean) => {
    if (isLoading) return
    if (!next) {
      setName("")
      setEmail("")
      setPassword("")
      setError(null)
      setSelectedPlanId(initialPlan?.id ?? allPlans[0]?.id ?? "start")
    }
    onOpenChange(next)
  }

  // Sync selected plan when initialPlan changes (user clicked a different card)
  // We track this via effect-free approach: the key on Dialog resets the modal
  // state cleanly. But since we can't use key easily, we handle it on open:
  // the parent always passes initialPlan, so set it when modal opens.
  // (We use `key={initialPlan?.id}` on DialogContent below for clean reset.)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* key forces a fresh mount when the selected plan changes */}
      <DialogContent
        key={initialPlan?.id}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Get Started with Capverra
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Create your account and unlock your plan in one step.
            You&apos;ll be redirected to secure checkout after registration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">

          {/* ── Selected plan card ── */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="size-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Selected Plan
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {selectedPlan?.name}
                  </span>
                  <span className="text-xl font-semibold text-primary">
                    ${selectedPlan?.price}
                  </span>
                  <span className="text-sm text-muted-foreground">one-time</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {highlights.map((h) => (
                    <Badge
                      key={h}
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary border-0"
                    >
                      <Check className="size-2.5 mr-1" />
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Plan switcher */}
              <div className="shrink-0">
                <Select
                  value={selectedPlanId}
                  onValueChange={setSelectedPlanId}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 text-xs gap-1 w-auto border-primary/30 bg-background">
                    <span className="text-muted-foreground">Change</span>
                    <ChevronDown className="size-3" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-sm">
                        <div className="flex items-center justify-between gap-6">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground">${p.price}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Registration fields ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Account Details
            </h3>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Full Name</Label>
              <Input
                id="reg-name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email Address</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── What happens next ── */}
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-sm">What happens next</p>
            <ol className="space-y-1 mt-1.5 list-decimal list-inside">
              <li>Your account details are saved securely</li>
              <li>You&apos;re redirected to Stripe for payment</li>
              <li>After payment, your account is activated automatically</li>
              <li>You&apos;re signed in and ready to optimize</li>
            </ol>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-2 border-t border-border gap-4">
            <p className="text-xs text-muted-foreground">
              Secure checkout via Stripe · One-time payment · No recurring charges
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[160px]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <Zap className="size-4" />
                    Continue to Checkout
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ── Existing account link ── */}
          <p className="text-center text-sm text-muted-foreground pb-1">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </a>
          </p>

        </form>
      </DialogContent>
    </Dialog>
  )
}