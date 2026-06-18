"use client"

import type React from "react"
import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Check, Eye, EyeOff, Loader2, AlertCircle,
  ArrowLeft, Zap, Sparkles, ChevronDown, Building2,
  Crown,
} from "lucide-react"
import { getAllDisplayPlans, getPaidPlans, getPlan, type Plan } from "@/lib/plans"

// ── Plan config ───────────────────────────────────────────────────────────────
const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "1 optimization report",
    "2 identities per report",
    "1 jurisdiction per report",
    "AI-powered tax analysis",
    "PDF report export",
  ],
  start: [
    "2 optimization reports",
    "2 identities per report",
    "1 jurisdiction per report",
    "AI-powered tax analysis",
    "PDF report export",
  ],
  launch: [
    "Everything in Start",
    "5 optimization reports",
    "3 identities per report",
    "2 jurisdictions per report",
    "Priority processing",
  ],
  grow: [
    "Everything in Launch",
    "20 optimization reports",
    "4 identities per report",
    "3 jurisdictions per report",
    "Advanced multi-structure comparison",
    "Time-horizon analysis",
  ],
  dominate: [
    "Everything in Grow",
    "50 optimization reports",
    "4 identities per report",
    "4 jurisdictions per report",
    "Full-spectrum global analysis",
    "All treaty networks covered",
    "Dedicated report history",
  ],
  enterprise: [
    "Everything in Dominate",
    "Unlimited optimization reports",
    "Custom identity limits",
    "All jurisdictions covered",
    "Dedicated account manager",
    "Custom integrations & API access",
    "SLA & priority support",
  ],
}

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  free:       ["1 report", "2 identities", "1 jurisdiction"],
  start:      ["2 reports", "2 identities", "1 jurisdiction"],
  launch:     ["5 reports", "3 identities", "2 jurisdictions"],
  grow:       ["20 reports", "4 identities", "3 jurisdictions"],
  dominate:   ["50 reports", "4 identities", "4 jurisdictions"],
  enterprise: ["Unlimited reports", "Custom identities", "All jurisdictions"],
}

const POPULAR_PLAN = "launch"

// ── Pricing cards view ────────────────────────────────────────────────────────
function PricingCards({
  plans,
  onSelect,
}: {
  plans: Plan[]
  onSelect: (plan: Plan) => void
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center pt-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Investment Tiers
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the engagement level that aligns with your optimization goals.
          One-time payment — no subscriptions, no recurring charges.
        </p>
      </div>

      {/* Plan cards — 3 per row max, wraps naturally to 2 rows of 3 */}
      <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const features    = PLAN_FEATURES[plan.id] ?? []
          const isPopular   = plan.id === POPULAR_PLAN
          const isFree      = plan.id === "free"
          const isEnterprise = plan.id === "enterprise"

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-8 ${
                isPopular
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card"
              }`}
            >
              {isPopular && (
               <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-md">
                    <Crown className="size-3.5" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                {isEnterprise && (
                  <div className="flex justify-center mb-3">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-x-2">
                  {isEnterprise ? (
                    <span className="text-2xl font-bold tracking-tight text-primary">
                      Custom
                    </span>
                  ) : isFree ? (
                    <>
                      <span className="text-4xl font-bold tracking-tight text-primary">
                        Free
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold tracking-tight text-primary">
                        ${plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">one-time</span>
                    </>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="mt-8 space-y-4 flex-1">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isEnterprise ? (
                  <a href="/contact">
                    <Button
                      className="w-full border-primary/50 text-foreground hover:bg-secondary"
                      variant="outline"
                    >
                      Contact Us
                    </Button>
                  </a>
                ) : isFree ? (
                  <a href="/signup">
                    <Button
                      className="w-full border-primary/50 text-foreground hover:bg-secondary"
                      variant="outline"
                    >
                      Sign Up Free
                    </Button>
                  </a>
                ) : (
                  <Button
                    className={`w-full ${
                      isPopular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border-primary/50 text-foreground hover:bg-secondary"
                    }`}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => onSelect(plan)}
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer CTA */}
      <div className="mx-auto mt-24 max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Not sure which plan is right for you?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Start free with 1 complimentary report, or{" "}
          <a
            href="/contact"
            className="text-primary hover:text-primary/80 underline underline-offset-2"
          >
            contact us
          </a>{" "}
          and we&apos;ll help you pick the right tier.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a href="/signup">
            <Button variant="outline" size="lg" className="border-primary/50 text-foreground hover:bg-secondary">
              Try Free — 1 Report
            </Button>
          </a>
          <a href="/contact">
            <Button variant="outline" size="lg" className="border-primary/50 text-foreground hover:bg-secondary">
              Schedule Free Consultation
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Registration form view ────────────────────────────────────────────────────
function RegistrationForm({
  initialPlan,
  allPlans,
  onBack,
}: {
  initialPlan: Plan
  allPlans: Plan[]
  onBack: () => void
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan.id)
  const [name,           setName]           = useState("")
  const [email,          setEmail]          = useState("")
  const [password,       setPassword]       = useState("")
  const [showPassword,   setShowPassword]   = useState(false)
  const [isLoading,      setIsLoading]      = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  const selectedPlan = getPlan(selectedPlanId)
  const highlights   = PLAN_HIGHLIGHTS[selectedPlanId] ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim())        { setError("Please enter your full name."); return }
    if (!email.trim())       { setError("Please enter your email address."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }

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
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.")
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 lg:px-8">

      {/* Back button */}
      <button
        onClick={onBack}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to plans
      </button>

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Get Started with Capverra
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create your account and complete checkout in one step.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Selected plan card ── */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-primary shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected Plan
                </span>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-foreground">
                  {selectedPlan.name}
                </span>
                <span className="text-xl font-semibold text-primary">
                  ${selectedPlan.price}
                </span>
                <span className="text-sm text-muted-foreground">one-time</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
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

            {/* Plan switcher — only paid non-enterprise plans */}
            <div className="shrink-0">
              <Select
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 text-xs border-primary/30 bg-background w-auto gap-1">
                  <span className="text-muted-foreground">Change plan</span>
                  <ChevronDown className="size-3" />
                </SelectTrigger>
                <SelectContent>
                  {allPlans.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">
                      <div className="flex items-center justify-between gap-8 w-full">
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

        {/* ── Account fields ── */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Account Details
          </h2>

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
          <div className="flex items-center gap-2 text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── What happens next ── */}
        <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground text-sm mb-1.5">What happens next</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Your account details are saved securely</li>
            <li>You&apos;re redirected to Stripe for payment</li>
            <li>After payment, your account is activated automatically</li>
            <li>You&apos;re signed in and ready to optimize</li>
          </ol>
        </div>

        {/* ── Submit ── */}
        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Redirecting to checkout…
              </>
            ) : (
              <>
                <Zap className="size-4" />
                Continue to Checkout — ${selectedPlan.price}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secure checkout via Stripe · One-time payment · No recurring charges
          </p>
        </div>

        {/* <p className="text-center text-sm text-muted-foreground pb-2">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </a>
        </p> */}

      </form>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  // Show all 6 tiers on pricing page (Free + 4 paid + Enterprise)
  const displayPlans = getAllDisplayPlans()
  // Registration form only uses paid non-enterprise plans
  const paidPlans = getPaidPlans()

  const handleSelect = (plan: Plan) => {
    setSelectedPlan(plan)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBack = () => {
    setSelectedPlan(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-32 pb-24">
        {selectedPlan ? (
          <RegistrationForm
            key={selectedPlan.id}
            initialPlan={selectedPlan}
            allPlans={paidPlans}
            onBack={handleBack}
          />
        ) : (
          <PricingCards plans={displayPlans} onSelect={handleSelect} />
        )}
      </main>
      <Footer />
    </div>
  )
}