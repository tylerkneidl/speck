'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface LibraryHeaderProps {
  back: { to: '/' | '/library'; label: string }
}

export function LibraryHeader({ back }: LibraryHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href={back.to}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">{back.label}</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <Link href="/" className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 30 30" aria-hidden="true">
              <circle cx="22.5" cy="8.5" r="4.8" fill="#ff4e22" />
              <circle cx="14" cy="14" r="3.1" fill="#ff4e22" opacity=".6" />
              <circle cx="7.8" cy="19.2" r="2.1" fill="#ff4e22" opacity=".34" />
            </svg>
            <span className="font-display text-sm font-extrabold tracking-tight text-foreground">
              Speck<span className="text-primary">.</span>
            </span>
          </Link>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
