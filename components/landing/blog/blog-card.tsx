import Image from "next/image"
import Link from "next/link"
import { urlFor } from "@/sanity/lib"
import type { Post } from "@/sanity/lib"
import { Calendar, User } from "lucide-react"

interface BlogCardProps {
  post: Post
}

export function BlogCard({ post }: BlogCardProps) {
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <Link href={`/blog/${post.slug.current}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {post.mainImage ? (
            <Image
              src={urlFor(post.mainImage).width(600).height(375).url()}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <span className="font-serif text-4xl text-muted-foreground">C</span>
            </div>
          )}
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              {post.categories.slice(0, 2).map((category, index) => (
                <span
                  key={category.slug?.current ?? `category-${index}`}
                  className="rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground"
                >
                  {category.title}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-serif text-xl font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
            {post.author && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>{post.author.name}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <time dateTime={post.publishedAt}>{formattedDate}</time>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
