import { PortableText as PortableTextComponent, type PortableTextComponents } from "@portabletext/react"
import type { PortableTextBlock } from "@portabletext/types"
import Image from "next/image"
import Link from "next/link"
import { urlFor } from "@/sanity/lib"

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) {
        return null
      }
      return (
        <figure className="my-8">
          <Image
            src={urlFor(value).width(1200).url()}
            alt={value.alt || "Blog image"}
            width={1200}
            height={675}
            className="rounded-lg"
          />
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  marks: {
    link: ({ children, value }) => {
      const rel = value?.href?.startsWith("/") ? undefined : "noopener noreferrer"
      const target = value?.href?.startsWith("/") ? undefined : "_blank"
      return (
        <Link
          href={value?.href || "#"}
          rel={rel}
          target={target}
          className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
        >
          {children}
        </Link>
      )
    },
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
  },
  block: {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-8 font-serif text-4xl font-bold text-foreground">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-4 mt-8 font-serif text-3xl font-bold text-foreground">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 mt-6 font-serif text-2xl font-semibold text-foreground">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-3 mt-6 font-serif text-xl font-semibold text-foreground">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-primary pl-6 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground/90">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-2 text-foreground/90">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
}

interface PortableTextProps {
  value: PortableTextBlock[]
}

export function PortableText({ value }: PortableTextProps) {
  return <PortableTextComponent value={value} components={components} />
}
