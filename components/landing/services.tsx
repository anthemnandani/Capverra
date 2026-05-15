import { Target, TrendingUp, Users, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const services = [
  {
    icon: Target,
    title: "Multi-Jurisdiction Tax Modeling",
    description: "Our engine simulates your tax position across 40+ countries simultaneously — before you move, invest, or restructure.",
  },
  {
    icon: TrendingUp,
    title: "Entity & Structure Optimization",
    description: "We model trusts, holding companies, and fund structures to find the most tax-efficient path for your assets.",
  },
  {
    icon: Users,
    title: "Succession & Exit Scenarios",
    description: "Run 5, 10, and 20-year horizon simulations for inheritance, business exit, and cross-border wealth transfer.",
  },
  {
    icon: Shield,
    title: "Compliance Risk Intelligence",
    description: "Real-time tracking of 5,000+ tax rules so your structure stays protected as regulations change.",
  },
]

export function Services() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            What Capverra Models For You
          </h2>
          <p className="mt-4 text-muted-foreground">
            Most advisors guess. We simulate — across every jurisdiction, entity, and life event.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {services.map((service) => (
            <Card 
              key={service.title}
              className="border-border/50 bg-card transition-all hover:border-primary/30 hover:bg-card/80"
            >
              <CardContent className="p-6 lg:p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-border/50 bg-secondary">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
