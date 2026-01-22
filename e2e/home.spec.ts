import { test, expect } from '@playwright/test'

test.describe('Motion Tracker', () => {
  test('should show landing page when not authenticated', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Motion Tracker')).toBeVisible()
    await expect(page.getByText('Video-Based Motion Analysis')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should have correct page title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Motion Tracker/)
  })

  test('should display feature highlights on landing page', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Frame-by-Frame')).toBeVisible()
    await expect(page.getByText('Live Graphs')).toBeVisible()
    await expect(page.getByText('Linear Regression')).toBeVisible()
  })

  test('should show Get Started button', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })
})

// These tests require authentication setup - placeholder for now
test.describe('Authenticated flows', () => {
  test.skip('should create a new project', async ({ page }) => {
    // TODO: Set up Clerk test authentication
    await page.goto('/')

    await page.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Test Project')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Test Project')).toBeVisible()
  })

  test.skip('should navigate to project editor', async ({ page }) => {
    // TODO: Set up Clerk test authentication
    await page.goto('/projects/test-project-id')

    await expect(page.getByText('Setup')).toBeVisible()
    await expect(page.getByText('Track')).toBeVisible()
    await expect(page.getByText('Analyze')).toBeVisible()
  })
})
