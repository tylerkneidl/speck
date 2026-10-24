import { SITE_NAME, SITE_URL } from '@/lib/site'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Providers } from './providers'
import '@fontsource-variable/archivo'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/jetbrains-mono'
import '../index.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — Video Motion Analysis`,
  description:
    'Speck turns any video into position, velocity, and acceleration data — one tracked point at a time. Built for the physics classroom.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Speck — See it. Track it. Solve it.',
    description:
      'Turn any video into publication-quality motion data. Built for physics students and teachers.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#f7f8fa',
}

// Applies the saved (or OS) theme before first paint so there's no light flash
// in dark mode. Must match resolveInitialTheme/applyTheme in src/lib/use-theme.ts.
const themeScript = `(function () {
  try {
    var t = localStorage.getItem('speck-theme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (t === 'dark') document.documentElement.classList.add('dark');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#090b11' : '#f7f8fa');
  } catch (e) {}
})();`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme script changes <html>'s class before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, build-time script — no user input. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
