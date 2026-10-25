/**
 * The site's public origin — the single value metadata, the sitemap and preview
 * images read, so renaming the domain is this config plus 301 redirects.
 * Override per environment with NEXT_PUBLIC_SITE_URL (e.g. a Railway preview).
 * `||` so an empty value (the Dockerfile's ARG default) falls back too.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://specklab.io'

export const SITE_NAME = 'Speck'
