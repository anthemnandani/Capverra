// Updated Footer Component (Old UI → New UI Design)

import Link from "next/link"
import Image from "next/image"

const navigation = {
  main: [
    { name: "Home", href: "/" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          {/* Logo and tagline */}
          <div>
            <Link href="/" className="flex items-center">
              <Image
                src="/images/capverra-logo.png"
                alt="Capverra Strategy"
                width={280}
                height={72}
                className="h-20 w-auto"
              />
            </Link>

            <p className="mt-4 text-sm text-muted-foreground">
              Tax Optimization for High Net Worth Clients.
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex gap-6">
            {navigation.main.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Capverra Strategy. All rights reserved.
          </p>

          <nav className="flex gap-6">
            {navigation.legal.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}