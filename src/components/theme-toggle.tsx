import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/use-theme'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

/**
 * Icon button that flips between light and dark theme. Shows a Moon when
 * light (click to go dark) and a Sun when dark (click to go light).
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn('text-muted-foreground hover:text-foreground', className)}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
