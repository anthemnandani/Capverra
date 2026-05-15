import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/landing/hero"
import { Stats } from "@/components/landing/stats"
import { Services } from "@/components/landing/services"
import { Pricing } from "@/components/landing/pricing"
import { CTA } from "@/components/landing/cta"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Stats />
      <Services />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
