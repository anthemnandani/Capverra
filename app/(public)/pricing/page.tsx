import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const tiers = [
  {
    name: "Essentials",
    id: "tier-essentials",
    price: "$2,500",
    description: "Perfect for startups and small businesses seeking strategic guidance.",
    features: [
      "Initial business assessment",
      "Strategic planning session",
      "Monthly progress review",
      "Email support",
      "Quarterly reports",
    ],
    featured: false,
  },
  {
    name: "Professional",
    id: "tier-professional",
    price: "$7,500",
    description: "Comprehensive strategy services for growing organizations.",
    features: [
      "Everything in Essentials",
      "Custom growth roadmap",
      "Bi-weekly strategy sessions",
      "Priority support",
      "Market analysis reports",
      "Leadership coaching",
      "Performance dashboards",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    price: "Custom",
    description: "Tailored solutions for large organizations with complex needs.",
    features: [
      "Everything in Professional",
      "Dedicated strategy team",
      "On-site workshops",
      "Board advisory services",
      "M&A due diligence",
      "Global market expansion",
      "24/7 executive support",
      "Custom integrations",
    ],
    featured: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Investment Tiers
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the engagement level that aligns with your business objectives. 
              All plans include our commitment to your success.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative rounded-xl border p-8 ${
                  tier.featured
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">
                    {tier.name}
                  </h3>
                  <div className="mt-4 flex items-baseline justify-center gap-x-2">
                    <span className="text-4xl font-bold tracking-tight text-primary">
                      {tier.price}
                    </span>
                    {tier.price !== "Custom" && (
                      <span className="text-sm text-muted-foreground">/month</span>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {tier.description}
                  </p>
                </div>
                <ul className="mt-8 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/contact" className="block">
                    <Button
                      className={`w-full ${
                        tier.featured
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-primary/50 text-foreground hover:bg-secondary"
                      }`}
                      variant={tier.featured ? "default" : "outline"}
                    >
                      {tier.price === "Custom" ? "Contact Sales" : "Get Started"}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ or Additional Info */}
          <div className="mx-auto mt-24 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Not sure which plan is right for you?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Schedule a complimentary consultation and we&apos;ll help you identify 
              the best path forward for your organization.
            </p>
            <div className="mt-8">
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/50 text-foreground hover:bg-secondary"
                >
                  Schedule Free Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
