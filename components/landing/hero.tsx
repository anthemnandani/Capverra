import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-24">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          <span className="text-balance">Optimize Your</span>
          <br />
          <span className="text-balance">Taxes Across</span>
          <br />
          <span className="text-primary">Global Jurisdictions</span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          Model, compare, and execute the most tax-efficient structures across jurisdictions, entities, and time horizons.
        </p>

        <div className="mt-10">
          <Link href="/contact">
            <Button className="group gap-2 bg-secondary text-foreground hover:bg-secondary/80">
              Start Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
