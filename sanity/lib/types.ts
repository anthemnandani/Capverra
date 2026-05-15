import type { PortableTextBlock } from "@portabletext/types"

// Define SanityImageSource inline to avoid deep import path issues
export type SanityImageSource = {
  _type: "image"
  asset: {
    _ref: string
    _type: "reference"
  }
} | string

export interface Author {
  name: string
  image?: SanityImageSource
  bio?: PortableTextBlock[]
}

export interface Category {
  title: string
  slug: {
    current: string
  }
}

export interface Post {
  _id: string
  title: string
  slug: {
    current: string
  }
  excerpt?: string
  mainImage?: SanityImageSource
  body?: PortableTextBlock[]
  publishedAt: string
  author?: Author
  categories?: Category[]
}
