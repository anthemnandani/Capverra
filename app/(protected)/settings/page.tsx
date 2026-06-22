"use client"

import type React from "react"
import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Eye, EyeOff,
  User, Bell, ShieldCheck, CreditCard,
  FileText, Users, Globe, BarChart3,
  CheckCircle2, Clock, AlertCircle, Loader2,
} from "lucide-react"
import { useAuth } from "@/context"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "profile",      label: "Profile",      icon: User },
  { id: "notifications",label: "Notifications", icon: Bell },
  { id: "security",     label: "Security",      icon: ShieldCheck },
  { id: "subscription", label: "Subscription",  icon: CreditCard },
] as const

type TabId = typeof TABS[number]["id"]

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfileForm {
  firstName: string
  lastName:  string
  email:     string
}
interface PasswordForm {
  currentPassword: string
  newPassword:     string
  confirmPassword: string
}
interface NotificationPrefs {
  emailNotifications: boolean
  pushNotifications:  boolean
}
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

const EMPTY_PASSWORD_FORM: PasswordForm = {
  currentPassword: "",
  newPassword:     "",
  confirmPassword: "",
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })
}

function usagePct(used: number, total: number | null) {
  if (!total) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

// ── Password input ────────────────────────────────────────────────────────────
function PasswordInput({
  id, value, onChange, disabled, autoComplete,
}: {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required
        minLength={6}
        autoComplete={autoComplete}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

// ── Stat card (subscription) ──────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB PANELS
// ─────────────────────────────────────────────────────────────────────────────

// ── Profile tab ───────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user } = useAuth()
  const supabase  = createSupabaseBrowserClient()
  const [form, setForm]       = useState<ProfileForm>({ firstName: "", lastName: "", email: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const parts = (user.name ?? "").trim().split(" ")
    setForm({ firstName: parts[0] ?? "", lastName: parts.slice(1).join(" "), email: user.email ?? "" })
  }, [user])

  const set = (k: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ")
    if (!fullName) { toast.error("Name cannot be empty."); return }
    setLoading(true)
    try {
      const { error: dbError } = await supabase.from("users").update({ name: fullName }).eq("id", user.id)
      if (dbError) throw dbError
      if (form.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: form.email })
        if (authError) throw authError
        toast.success("Profile updated. Check your new email to confirm the change.")
      } else {
        toast.success("Profile updated successfully.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }, [user, form, supabase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information and preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="First name" value={form.firstName} onChange={set("firstName")} disabled={loading} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Last name" value={form.lastName} onChange={set("lastName")} disabled={loading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Email" value={form.email} onChange={set("email")} disabled={loading} required />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Notifications tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const { user } = useAuth()
  const supabase  = createSupabaseBrowserClient()
  const [prefs, setPrefs]     = useState<NotificationPrefs>({ emailNotifications: false, pushNotifications: false })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.notification_preferences) return
    const p = user.notification_preferences as Partial<NotificationPrefs>
    setPrefs({ emailNotifications: p.emailNotifications ?? false, pushNotifications: p.pushNotifications ?? false })
  }, [user])

  const toggle = useCallback(async (key: keyof NotificationPrefs, value: boolean) => {
    if (!user) return
    const prev    = prefs
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    setLoading(true)
    try {
      const { error } = await supabase.from("users").update({ notification_preferences: updated }).eq("id", user.id)
      if (error) throw error
    } catch {
      setPrefs(prev)
      toast.error("Failed to update notification preferences.")
    } finally {
      setLoading(false)
    }
  }, [user, prefs, supabase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Configure how you receive notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
          </div>
          <Switch checked={prefs.emailNotifications} onCheckedChange={(v) => toggle("emailNotifications", v)} disabled={loading || !user} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Push Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
          </div>
          <Switch checked={prefs.pushNotifications} onCheckedChange={(v) => toggle("pushNotifications", v)} disabled={loading || !user} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Security tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const { user } = useAuth()
  const supabase  = createSupabaseBrowserClient()
  const [form, setForm]       = useState<PasswordForm>(EMPTY_PASSWORD_FORM)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof PasswordForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword.length < 6)                        { toast.error("New password must be at least 6 characters."); return }
    if (form.newPassword !== form.confirmPassword)          { toast.error("New passwords do not match."); return }
    setLoading(true)
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user?.email ?? "", password: form.currentPassword })
      if (verifyError) { toast.error("Current password is incorrect."); return }
      const { error: updateError } = await supabase.auth.updateUser({ password: form.newPassword })
      if (updateError) throw updateError
      toast.success("Password updated successfully.")
      setForm(EMPTY_PASSWORD_FORM)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password")
    } finally {
      setLoading(false)
    }
  }, [form, user, supabase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Manage your account security settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <PasswordInput id="currentPassword" value={form.currentPassword} onChange={set("currentPassword")} disabled={loading} autoComplete="current-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput id="newPassword" value={form.newPassword} onChange={set("newPassword")} disabled={loading} autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={set("confirmPassword")} disabled={loading} autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Subscription tab ──────────────────────────────────────────────────────────
function SubscriptionTab() {
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
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !plan) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error ?? "Failed to load plan details."}</p>
        </CardContent>
      </Card>
    )
  }

  const pct      = usagePct(plan.reports_used, plan.reports_total)
  const isActive = plan.subscription_status === "active"
  const isFree   = plan.plan_id === "free"

  return (
    <div className="space-y-4">

      {/* ── Plan banner ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>{plan.plan_name} Plan</CardTitle>
                <Badge
                  className={cn(
                    "text-xs border-0",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isActive
                    ? <><CheckCircle2 className="h-3 w-3 mr-1 inline" />Active</>
                    : <><Clock className="h-3 w-3 mr-1 inline" />{plan.subscription_status}</>
                  }
                </Badge>
                {isFree && <Badge variant="secondary" className="text-xs">Free Tier</Badge>}
              </div>
              <CardDescription className="mt-1">
                {isFree
                  ? "Upgrade to unlock more reports, identities, and jurisdictions."
                  : "One-time payment · No recurring charges · No subscriptions."}
              </CardDescription>
            </div>
            {/* <a href="/pricing">
              <Button size="sm" variant={isFree ? "default" : "outline"}>
                {isFree ? "Upgrade now" : "Change plan"}
              </Button>
            </a> */}
          </div>
        </CardHeader>
      </Card>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={FileText}
          label="Reports"
          value={`${plan.reports_used} / ${plan.reports_total ?? "∞"}`}
          sub={plan.reports_remaining != null ? `${plan.reports_remaining} remaining` : "Unlimited"}
        />
        <StatCard
          icon={Users}
          label="Identities"
          value={plan.identity_limit ?? "∞"}
          sub="per report"
        />
        <StatCard
          icon={Globe}
          label="Jurisdictions"
          value={plan.jurisdiction_limit ?? "∞"}
          sub="per report"
        />
      </div>

      {/* ── Usage progress bar ── */}
      {plan.reports_total != null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Report Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={pct} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{plan.reports_used} of {plan.reports_total} reports used</span>
              <span>{pct}%</span>
            </div>
            {plan.exhausted_at && (
              <p className="text-xs text-amber-500">
                Plan exhausted on {fmt(plan.exhausted_at)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Purchase details ── */}
      {!isFree && plan.purchase_id && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Purchase Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {[
                {
                  label: "Plan",
                  value: <span className="font-medium">{plan.plan_name}</span>,
                },
                {
                  label: "Status",
                  value: (
                    <Badge className={cn(
                      "text-xs border-0",
                      isActive ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"
                    )}>
                      {plan.subscription_status}
                    </Badge>
                  ),
                },
                {
                  label: "Purchased on",
                  value: <span>{fmt(plan.purchased_at)}</span>,
                },
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
                {
                  label: "Purchase ID",
                  value: (
                    <span className="font-mono text-xs text-muted-foreground break-all">
                      {plan.purchase_id}
                    </span>
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="text-sm text-muted-foreground shrink-0">{label}</span>
                  <span className="text-sm text-foreground text-right">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function SettingsContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const rawTab   = searchParams.get("tab") ?? "profile"
  const activeTab: TabId = (TABS.some((t) => t.id === rawTab) ? rawTab : "profile") as TabId

  const setTab = (id: TabId) => {
    router.replace(`/settings?tab=${id}`, { scroll: false })
  }

  return (
    <div className="container mx-auto sm:px-6 px-3 py-8 space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 border-b border-border overflow-x-auto pb-px">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
              activeTab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      <div>
        {activeTab === "profile"       && <ProfileTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "security"      && <SecurityTab />}
        {activeTab === "subscription"  && <SubscriptionTab />}
      </div>

    </div>
  )
}

// Suspense boundary — useSearchParams needs it in Next.js app router
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}