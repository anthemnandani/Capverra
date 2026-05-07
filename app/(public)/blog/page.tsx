import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const posts = [
  {
    id: 1,
    title: "The Future of Strategic Planning in an AI-Driven World",
    excerpt: "How artificial intelligence is reshaping the way businesses approach long-term strategy and decision-making.",
    date: "Apr 28, 2026",
    category: "Strategy",
    readTime: "8 min read",
  },
  {
    id: 2,
    title: "Building Resilient Organizations: Lessons from Market Leaders",
    excerpt: "Examining the key characteristics that separate thriving companies from those that struggle during uncertainty.",
    date: "Apr 21, 2026",
    category: "Leadership",
    readTime: "6 min read",
  },
  {
    id: 3,
    title: "Sustainable Growth: Balancing Ambition with Responsibility",
    excerpt: "Why the most successful companies are those that integrate sustainability into their core business strategy.",
    date: "Apr 14, 2026",
    category: "Growth",
    readTime: "7 min read",
  },
  {
    id: 4,
    title: "The Art of Strategic Pivoting: When to Stay the Course vs. Change Direction",
    excerpt: "A framework for making critical business decisions when market conditions shift unexpectedly.",
    date: "Apr 7, 2026",
    category: "Strategy",
    readTime: "10 min read",
  },
  {
    id: 5,
    title: "Cultivating Innovation: Creating a Culture of Continuous Improvement",
    excerpt: "Practical approaches to fostering innovation at every level of your organization.",
    date: "Mar 31, 2026",
    category: "Innovation",
    readTime: "5 min read",
  },
  {
    id: 6,
    title: "Global Expansion Strategies: Entering New Markets Successfully",
    excerpt: "Key considerations and best practices for businesses looking to expand internationally.",
    date: "Mar 24, 2026",
    category: "Growth",
    readTime: "9 min read",
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Insights & Perspectives
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Expert analysis and thought leadership on strategy, growth, and business excellence.
            </p>
          </div>

          {/* Featured Post */}
          <div className="mx-auto mt-16 max-w-4xl">
            <article className="group relative rounded-xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:bg-secondary/30 lg:p-12">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Featured
                </span>
                <span>{posts[0].date}</span>
                <span>&bull;</span>
                <span>{posts[0].readTime}</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground group-hover:text-primary transition-colors lg:text-3xl">
                {posts[0].title}
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed lg:text-lg">
                {posts[0].excerpt}
              </p>
              <Link
                href="#"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
              >
                Read Article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>

          {/* Post Grid */}
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.slice(1).map((post) => (
              <article
                key={post.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-secondary/30"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {post.category}
                  </span>
                  <span>&bull;</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                  <Link
                    href="#"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                  >
                    Read
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div className="mx-auto mt-24 max-w-2xl rounded-xl border border-primary/30 bg-primary/5 p-8 text-center lg:p-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Stay Informed
            </h2>
            <p className="mt-4 text-muted-foreground">
              Subscribe to our newsletter for the latest insights delivered directly to your inbox.
            </p>
            <form className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-72"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
