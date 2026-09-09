import { useEffect } from 'react'

interface SeoProps {
  title: string
  description: string
  path: string
  image?: string
  noIndex?: boolean
}

function upsertMeta(
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }

  element.content = content
}

export function Seo({
  title,
  description,
  path,
  image = '/images/monkey-01-800.webp',
  noIndex,
}: SeoProps) {
  useEffect(() => {
    const pageTitle = title === 'Kurio' ? title : `${title} | Kurio`
    const canonicalUrl = new URL(path, window.location.origin).toString()
    const imageUrl = new URL(image, window.location.origin).toString()

    document.title = pageTitle
    upsertMeta('meta[name="description"]', 'name', 'description', description)
    upsertMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    )
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', pageTitle)
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl)
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle)
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = canonicalUrl
  }, [description, image, noIndex, path, title])

  return null
}
