import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTA() {
  return (
    <section className="border-t border-border/50 bg-background-soft py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Your Tax Burden Has a Number. {"Let's"} Reduce It.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Choose the plan that matches your complexity — from single jurisdiction to full global optimization.
        </p>
        <div className="mt-10">
          <Link href="/contact">
            <Button 
              variant="outline" 
              className="group gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Get Started Today
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
