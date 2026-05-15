import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { client, postsQuery } from "@/sanity/lib"
import type { Post } from "@/sanity/lib"
import { BlogCard } from "@/components/landing/blog/blog-card"

export const revalidate = 60

export default async function BlogPage() {
  const posts = await client.fetch<Post[]>(postsQuery)

  return (
    <main className="min-h-screen">
      <Header />
      <section className="px-4 pt-32 pb-20 sm:px-6 lg:px-8 lg:pt-40">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
              Blog
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Insights on tax optimization, global compliance, and wealth management strategies from our experts.
            </p>
          </div>

          {/* Posts Grid */}
          {posts && posts.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <p className="text-xl text-primary font-medium">Coming Soon</p>
              <p className="mt-4 max-w-md text-muted-foreground">
                We&apos;re working on insightful content about tax optimization, global compliance, and wealth management strategies. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}
