import { groq } from "next-sanity"

export const postsQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage,
    publishedAt,
    "author": author->{
      name,
      image
    },
    "categories": categories[]->{
      title,
      slug
    }
  }
`

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    mainImage,
    body,
    publishedAt,
    "author": author->{
      name,
      image,
      bio
    },
    "categories": categories[]->{
      title,
      slug
    }
  }
`

export const postSlugsQuery = groq`
  *[_type == "post" && defined(slug.current)][].slug.current
`
