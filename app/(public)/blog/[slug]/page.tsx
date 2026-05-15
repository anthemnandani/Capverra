import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { client, postBySlugQuery, postSlugsQuery, urlFor } from "@/sanity/lib"
import type { Post } from "@/sanity/lib"
import { ArrowLeft, Calendar, User } from "lucide-react"
import { PortableText } from "@/components/landing/blog/portable-text"

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await client.fetch<string[]>(postSlugsQuery)
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = await client.fetch<Post | null>(postBySlugQuery, { slug })

  if (!post) {
    return {
      title: "Post Not Found | Capverra Blog",
    }
  }

  return {
    title: `${post.title} | Capverra Blog`,
    description: post.excerpt || `Read ${post.title} on the Capverra blog.`,
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await client.fetch<Post | null>(postBySlugQuery, { slug })

  if (!post) {
    notFound()
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <main className="min-h-screen">
      <Header />
      <article className="px-4 pt-32 pb-20 sm:px-6 lg:px-8 lg:pt-40">
        <div className="mx-auto max-w-3xl">
          {/* Back Link */}
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.categories.map((category, index) => (
                <span
                  key={category.slug?.current ?? `category-${index}`}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {category.title}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl text-balance">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.image && (
                  <Image
                    src={urlFor(post.author.image).width(40).height(40).url()}
                    alt={post.author.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{post.author.name}</span>
                </div>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.publishedAt}>{formattedDate}</time>
              </div>
            )}
          </div>

          {/* Featured Image */}
          {post.mainImage && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg">
              <Image
                src={urlFor(post.mainImage).width(1200).height(675).url()}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          {post.body && (
            <div className="prose-custom mt-12">
              <PortableText value={post.body} />
            </div>
          )}

          {/* Author Bio */}
          {post.author?.bio && (
            <div className="mt-16 border-t border-border pt-8">
              <div className="flex items-start gap-4">
                {post.author.image && (
                  <Image
                    src={urlFor(post.author.image).width(64).height(64).url()}
                    alt={post.author.name}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Written by</p>
                  <p className="font-serif text-lg font-semibold text-foreground">
                    {post.author.name}
                  </p>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <PortableText value={post.author.bio} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
      <Footer />
    </main>
  )
}
