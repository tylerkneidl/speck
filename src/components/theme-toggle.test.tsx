import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from './theme-toggle'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
  localStorage.clear()
})

describe('ThemeToggle', () => {
  it('renders a button with an accessible label', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark theme')
  })

  it('toggles the dark class on <html> when clicked', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    fireEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(button).toHaveAccessibleName('Switch to light theme')

    fireEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(button).toHaveAccessibleName('Switch to dark theme')
  })
})
