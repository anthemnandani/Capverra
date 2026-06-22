"use client"

import { useEffect, useState } from "react"
import {
  CreditCard, Zap, BarChart3, Users, Globe,
  CheckCircle2, Clock, AlertCircle, Loader2,
  FileText, ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// ── Types ─────────────────────────────────────────────────────────────────────
interface CardDetails {
  brand:     string
  last4:     string
  exp_month: number
  exp_year:  number
}

interface PlanData {
  plan_id:             string
  plan_name:           string
  reports_total:       number | null
  reports_used:        number
  reports_remaining:   number | null
  identity_limit:      number | null
  jurisdiction_limit:  number | null
  subscription_status: string
  has_active_plan:     boolean
  purchase_id:         string | null
  purchased_at:        string | null
  exhausted_at:        string | null
  card:                CardDetails | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })
}

function usagePercent(used: number, total: number | null) {
  if (!total) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [plan, setPlan]       = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setPlan(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error ?? "Failed to load plan details."}</p>
      </div>
    )
  }

  const pct     = usagePercent(plan.reports_used, plan.reports_total)
  const isActive = plan.subscription_status === "active"
  const isFree   = plan.plan_id === "free"

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Subscription</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your current plan, usage, and purchase details.
        </p>
      </div>

      {/* ── Plan banner ── */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold text-foreground">{plan.plan_name} Plan</span>
            <Badge
              className={
                isActive
                  ? "bg-emerald-500/15 text-emerald-500 border-0 text-xs"
                  : "bg-muted text-muted-foreground border-0 text-xs"
              }
            >
              {isActive ? (
                <><CheckCircle2 className="h-3 w-3 mr-1 inline" />Active</>
              ) : (
                <><Clock className="h-3 w-3 mr-1 inline" />{plan.subscription_status}</>
              )}
            </Badge>
            {isFree && (
              <Badge variant="secondary" className="text-xs">Free Tier</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFree
              ? "Upgrade to unlock more reports, identities, and jurisdictions."
              : "One-time payment · No recurring charges · No subscription."}
          </p>
        </div>

        {!isFree && (
          <div className="shrink-0">
            <a href="/pricing">
              <button className="text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                Upgrade plan →
              </button>
            </a>
          </div>
        )}
        {isFree && (
          <div className="shrink-0">
            <a href="/pricing">
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                Upgrade now
              </button>
            </a>
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          icon={FileText}
          label="Reports used"
          value={`${plan.reports_used} / ${plan.reports_total ?? "∞"}`}
          sub={plan.reports_remaining != null
            ? `${plan.reports_remaining} remaining`
            : "Unlimited remaining"}
        />
        <StatCard
          icon={Users}
          label="Identity limit"
          value={plan.identity_limit ?? "∞"}
          sub="per report"
        />
        <StatCard
          icon={Globe}
          label="Jurisdiction limit"
          value={plan.jurisdiction_limit ?? "∞"}
          sub="per report"
        />
      </div>

      {/* ── Usage bar (only for plans with limits) ── */}
      {plan.reports_total != null && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Report Usage
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {plan.reports_used} of {plan.reports_total} reports used
            {plan.exhausted_at && (
              <> · Exhausted on {fmt(plan.exhausted_at)}</>
            )}
          </p>
        </div>
      )}

      {/* ── Purchase details (paid only) ── */}
      {!isFree && plan.purchase_id && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Purchase Details
          </h3>

          <div className="divide-y divide-border">
            {[
              { label: "Plan",         value: plan.plan_name },
              { label: "Status",       value: (
                  <Badge className={isActive
                    ? "bg-emerald-500/15 text-emerald-500 border-0 text-xs"
                    : "bg-muted text-muted-foreground border-0 text-xs"
                  }>
                    {plan.subscription_status}
                  </Badge>
                )
              },
              { label: "Purchased on", value: fmt(plan.purchased_at) },
              ...(plan.card ? [{
                label: "Payment method",
                value: (
                  <span className="font-mono text-xs text-foreground">
                    {plan.card.brand.toUpperCase()} •••• {plan.card.last4}
                    <span className="text-muted-foreground ml-1">
                      ({String(plan.card.exp_month).padStart(2, "0")}/{plan.card.exp_year})
                    </span>
                  </span>
                ),
              }] : []),
              { label: "Purchase ID",  value: (
                  <span className="font-mono text-xs text-muted-foreground break-all">
                    {plan.purchase_id}
                  </span>
                )
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span className="text-sm text-muted-foreground shrink-0">{label}</span>
                <span className="text-sm text-foreground text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Security note ── */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Payments are processed securely by <strong className="text-foreground">Stripe</strong>.
          Capverra does not store your card details.
          All purchases are one-time — you will never be charged automatically.
        </p>
      </div>

    </div>
  )
}