import type { Metadata } from 'next';

export const SITE_URL = 'https://www.mannosaar.com';
export const DEFAULT_SOCIAL_IMAGE = '/images/social/community-hero.png';

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const brandedTitle = title.includes('| Mannosaar') ? title : `${title} | Mannosaar`;

  return {
    title: { absolute: brandedTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'Mannosaar',
      title: brandedTitle,
      description,
      url: path,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description,
      images: [image],
    },
  };
}
