import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Target, TrendingUp, Users, Shield } from "lucide-react"
import Link from "next/link"

const features = [
  {
    name: "Tax Optimization",
    description: "Strategic tax planning across multiple jurisdictions to minimize your global tax burden.",
    icon: Target,
  },
  {
    name: "Wealth Preservation",
    description: "Proven strategies to protect and grow your wealth across generations.",
    icon: TrendingUp,
  },
  {
    name: "Estate Planning",
    description: "Comprehensive succession planning to secure your legacy and minimize estate taxes.",
    icon: Users,
  },
  {
    name: "Asset Protection",
    description: "Robust structures to shield your assets from potential risks and liabilities.",
    icon: Shield,
  },
]

const stats = [
  { value: "500+", label: "Clients Served" },
  { value: "98%", label: "Success Rate" },
  { value: "25+", label: "Years Experience" },
  { value: "$2B+", label: "Value Created" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Optimize Your Taxes Across <span className="text-primary">Global Jurisdictions</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground lg:text-xl">
              Model, compare, and execute the most tax-efficient structures across jurisdictions, entities, and time horizons.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Link href="/pricing">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Start Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="text-4xl font-bold tracking-tight text-primary lg:text-5xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Our Core Expertise
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We bring decades of experience to solve your most complex business challenges.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group relative rounded-xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:bg-secondary/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {feature.name}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Let&apos;s discuss how Capverra Strategy can help you achieve your goals.
            </p>
            <div className="mt-8">
              <Link href="/contact">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
