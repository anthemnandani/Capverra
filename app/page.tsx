import Link from "next/link"
import { ArrowRight, ShieldCheck, Users, Package, BarChart3, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export const dynamic = "force-static"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 lg:py-20 space-y-16">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center">
        <div className="space-y-6">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            <Sparkles className="h-3 w-3" />
            New: unified identity & asset view
          </Badge>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              The command center for your{" "}
              <span className="text-primary">identities & assets</span>.
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl text-pretty">
              Capverra gives your team a single, trusted place to understand who has access to
              what, how assets are used, and where risk is building up across your organization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link href="/auth/login" className="flex items-center gap-2">
                Get started now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">View live demo</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Enterprise‑grade security</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Real‑time visibility</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/10 via-primary/0 to-primary/20 blur-2xl" />
          <Card className="relative border-border/60 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>At‑a‑glance overview</span>
                <Badge className="text-xs">Inside the app</Badge>
              </CardTitle>
              <CardDescription>
                Your dashboard brings together the most important signals from identities and assets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-muted/40 p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Active identities</p>
                  <p className="text-2xl font-semibold">2,845</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">+128 this week</p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Critical assets</p>
                  <p className="text-2xl font-semibold">412</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">17 require review</p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Access anomalies</p>
                  <p className="text-2xl font-semibold">9</p>
                  <p className="text-xs text-red-600 dark:text-red-400">3 high severity</p>
                </div>
              </div>

              <div className="rounded-xl border bg-background/60 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Today&apos;s highlights</p>
                  <span className="text-xs text-muted-foreground">Auto‑generated</span>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li>• New identities detected in sensitive asset groups.</li>
                  <li>• 5 expiring credentials in the next 7 days.</li>
                  <li>• 2 assets moved from low to medium risk.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Designed to mirror how your teams actually work.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-pretty">
            Every part of Capverra maps to a core workflow in your organization, so you can move
            from scattered spreadsheets and tickets to a single, reliable source of truth.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle>Identities</CardTitle>
              <CardDescription>
                Understand every user, service account, and role in one place—who they are, what
                they can touch, and how that changes over time.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-3 text-sm">
              <ul className="space-y-1 text-muted-foreground">
                <li>• Unified profile for people and workloads</li>
                <li>• Historical changes to access and ownership</li>
                <li>• Built‑in context for incident and audit teams</li>
              </ul>
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href="/identities" className="inline-flex items-center gap-1">
                  Explore identities
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <CardTitle>Assets</CardTitle>
              <CardDescription>
                A complete inventory of the systems, applications, and datasets that matter most
                to your business, always in sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-3 text-sm">
              <ul className="space-y-1 text-muted-foreground">
                <li>• Group assets by business domain and risk</li>
                <li>• See who owns and operates each asset</li>
                <li>• Highlight blind spots before they become incidents</li>
              </ul>
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href="/assets" className="inline-flex items-center gap-1">
                  Explore assets
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <CardTitle>Dashboards & workflows</CardTitle>
              <CardDescription>
                Opinionated dashboards and guided flows help security, IT, and compliance teams
                align around the same, up‑to‑date picture.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-3 text-sm">
              <ul className="space-y-1 text-muted-foreground">
                <li>• Actionable overview of risk and coverage</li>
                <li>• Flows for onboarding, reviews, and clean‑up</li>
                <li>• Built‑in collaboration for cross‑functional teams</li>
              </ul>
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href="/dashboard" className="inline-flex items-center gap-1">
                  Open dashboard
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Secondary section */}
      <section className="grid gap-8 lg:grid-cols-2 items-start border rounded-3xl px-6 py-8 sm:px-8 sm:py-10 bg-muted/40">
        <div className="space-y-4">
          <h3 className="text-xl sm:text-2xl font-semibold">
            Built for teams that care about clarity, not just control.
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base text-pretty">
            Capverra turns complex identity and asset relationships into a narrative your whole
            organization can understand. From the first login to quarterly access reviews, every
            interaction is designed to be transparent, auditable, and human‑readable.
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Start by logging in, then move between the dashboard, identities, and assets to see
            how everything stays in sync. As you explore, you&apos;ll notice that every screen
            shares the same design language—so once you learn one part of the app, the rest will
            feel familiar.
          </p>
          <p>
            Use this home page as the high‑level introduction when sharing Capverra with
            stakeholders, and direct operators straight into the authenticated experience via the
            navigation.
          </p>
        </div>
      </section>
    </div>
  )
}
