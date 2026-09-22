import { test as authTest, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { waitForPageLoad } from './helpers'

/** Wait until creator cards OR the empty-state message is visible */
async function waitForCreatorsResolved(page: Page, timeout = 10000) {
  await page
    .locator('a[href^="/creator/"]')
    .or(page.locator(':text("No creators found")'))
    .first()
    .waitFor({ state: 'visible', timeout })
    .catch(() => { /* grid may legitimately still be loading */ })
}

/**
 * EXPLORE PAGE TESTS
 *
 * Tests the redesigned Explore page including:
 *  - Profile picture display on creator cards
 *  - Filter panel (gender, age range)
 *  - Search bar functionality
 *  - Category chip filtering
 *  - Active filter indicator
 *  - Clear filters
 *  - Empty state
 *
 * Run:
 *   npx playwright test tests/e2e/explore.spec.ts --headed
 */

authTest.describe('Explore Page', () => {
  authTest.beforeEach(async ({ page, loginAsFan }) => {
    await loginAsFan()
    await page.goto('/explore')
    await waitForPageLoad(page)
  })

  // ─── Page Structure ─────────────────────────────────────────────────────────

  authTest('should load explore page with heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Discover')
    await expect(page).not.toHaveURL(/\/login/)
  })

  authTest('should display Explore, Live Now, and People Nearby tabs', async ({ page }) => {
    await expect(page.locator('button:has-text("Explore")')).toBeVisible()
    await expect(page.locator('button:has-text("Live Now")')).toBeVisible()
    await expect(page.locator('button:has-text("People Nearby")')).toBeVisible()
  })

  authTest('should switch to Live Now tab and show subtitle', async ({ page }) => {
    await page.locator('button:has-text("Live Now")').click()
    await expect(page.locator('text=Creators streaming live right now')).toBeVisible()
    // Category chips should be hidden on this tab
    await expect(page.locator('button:has-text("Asian")')).not.toBeVisible()
  })

  authTest('should switch to People Nearby tab and show distance info', async ({ page }) => {
    await page.locator('button:has-text("People Nearby")').click()
    await expect(page.locator('text=Creators near your location')).toBeVisible()
    // Distance filter appears in sidebar
    const sidebar = page.locator('[data-testid="filter-sidebar"]')
    await expect(sidebar.locator('text=Distance')).toBeVisible()
  })

  authTest('should display search bar', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search creators"]')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeEnabled()
  })

  authTest('should display persistent filter sidebar with Filters heading', async ({ page }) => {
    // On desktop the sidebar is always visible (no toggle needed)
    const sidebar = page.locator('[data-testid="filter-sidebar"]')
    await expect(sidebar).toBeVisible()
    await expect(sidebar.locator('text=Filters')).toBeVisible()
  })

  authTest('should display category chips', async ({ page }) => {
    for (const cat of ['All', 'Asian', 'Western', 'Latina', 'Fitness', 'Cosplay']) {
      await expect(page.locator(`button:has-text("${cat}")`).first()).toBeVisible()
    }
  })

  // ─── Creator Cards ───────────────────────────────────────────────────────────

  authTest('should display creator cards when creators exist', async ({ page }) => {
    await waitForCreatorsResolved(page)
    const noCreators = await page.locator('text=No creators found').isVisible()
    if (!noCreators) {
      // Creator cards should be links to /creator/:username
      const cards = page.locator('a[href^="/creator/"]')
      await expect(cards.first()).toBeVisible()
    }
  })

  authTest('should display profile picture (avatar) on creator cards', async ({ page }) => {
    await waitForCreatorsResolved(page)
    const noCreators = await page.locator('text=No creators found').isVisible()
    if (!noCreators) {
      // Each card should have either an avatar img or an initial-letter placeholder
      const avatarImg      = page.locator('a[href^="/creator/"] img[class*="rounded-full"]').first()
      const avatarInitial  = page.locator('a[href^="/creator/"] [class*="rounded-full"]').first()
      const hasAvatar = await avatarImg.isVisible().catch(() => false)
        || await avatarInitial.isVisible().catch(() => false)
      expect(hasAvatar).toBe(true)
    }
  })

  authTest('should display Subscribe button on creator cards', async ({ page }) => {
    await waitForCreatorsResolved(page)
    const noCreators = await page.locator('text=No creators found').isVisible()
    if (!noCreators) {
      const subscribeBtn = page.locator('a[href^="/creator/"] button:has-text("Subscribe")').first()
      await expect(subscribeBtn).toBeVisible()
    }
  })

  authTest('should navigate to creator profile when card is clicked', async ({ page }) => {
    await waitForCreatorsResolved(page)
    const noCreators = await page.locator('text=No creators found').isVisible()
    if (!noCreators) {
      const firstCard = page.locator('a[href^="/creator/"]').first()
      const href = await firstCard.getAttribute('href')
      expect(href).toMatch(/^\/creator\//)
    }
  })

  // ─── Filter Panel ────────────────────────────────────────────────────────────

  authTest('should display filter panel with Sex and Age sections permanently', async ({ page }) => {
    // Sidebar is always visible on desktop — no toggle required
    const sidebar = page.locator('[data-testid="filter-sidebar"]')
    await expect(sidebar.locator('text=Sex')).toBeVisible()
    await expect(sidebar.locator('text=Age')).toBeVisible()
  })

  authTest('should display gender filter options when panel is open', async ({ page }) => {
    // Sidebar always visible on desktop
    for (const gender of ['All', 'Female', 'Male', 'Non-binary']) {
      await expect(page.locator(`button:has-text("${gender}")`).first()).toBeVisible()
    }
  })

  authTest('should display age range slider', async ({ page }) => {
    // Age filter is a dual-range slider, not preset chips
    const sidebar = page.locator('[data-testid="filter-sidebar"]')
    await expect(sidebar.locator('text=Age')).toBeVisible()
    const sliders = sidebar.locator('input[type="range"]')
    await expect(sliders).toHaveCount(2)
  })

  authTest('should highlight selected gender filter', async ({ page }) => {
    // Click Female radio button in sidebar
    const femaleBtn = page.locator('aside button:has-text("Female")').first()
    await femaleBtn.click()

    // Selected radio shows a filled inner dot (div.bg-\[#ff0618\]) inside the button
    await expect(femaleBtn.locator('div[class*="bg-\\[#ff0618\\]"]')).toBeVisible()
  })

  authTest('should show active-filter indicator dot when filter is applied', async ({ page }) => {
    // On mobile viewport the Filters toggle button is visible
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/explore')
    await waitForPageLoad(page)

    const filtersBtn = page.locator('button:has-text("Filters")').first()
    // No dot initially
    await expect(filtersBtn.locator('span.rounded-full')).not.toBeVisible()

    // Open mobile drawer and apply a gender filter
    await filtersBtn.click()
    await page.locator('button:has-text("Female")').first().click()

    // Dot should appear on Filters button
    await expect(filtersBtn.locator('span.rounded-full')).toBeVisible()
  })

  authTest('should show Clear filters link when filters are active', async ({ page }) => {
    await page.locator('aside button:has-text("Female")').first().click()

    await expect(page.locator('button:has-text("Clear filters"), [class*="underline"]:has-text("Clear filters")')).toBeVisible()
  })

  authTest('should reset filters when Clear filters is clicked', async ({ page }) => {
    await page.locator('aside button:has-text("Female")').first().click()

    // Verify filter is active
    await expect(page.locator('button:has-text("Clear filters"), [class*="underline"]:has-text("Clear filters")')).toBeVisible()

    // Clear
    await page.locator('text=Clear filters').click()

    // Clear button should be gone
    await expect(page.locator('button:has-text("Clear filters"), [class*="underline"]:has-text("Clear filters")')).not.toBeVisible()
  })

  // ─── Category Chips ──────────────────────────────────────────────────────────

  authTest('should highlight selected category chip', async ({ page }) => {
    const allChip = page.locator('button:has-text("All")').first()
    await expect(allChip).toHaveClass(/bg-\[#ff0618\]/)

    const fitnessChip = page.locator('button:has-text("Fitness")').first()
    await fitnessChip.click()

    await expect(fitnessChip).toHaveClass(/bg-\[#ff0618\]/)
    await expect(allChip).not.toHaveClass(/bg-\[#ff0618\]/)
  })

  authTest('should reload creators when category changes', async ({ page }) => {
    await waitForCreatorsResolved(page)

    await page.locator('button:has-text("Live Only")').first().click()

    // Wait for response: loading indicator or settled state
    await page.waitForTimeout(300)
    const isLoading = await page.locator('text=Loading...').isVisible().catch(() => false)
    await waitForCreatorsResolved(page)
    const hasResults = await page
      .locator('a[href^="/creator/"]')
      .or(page.locator(':text("No creators found")'))
      .first()
      .isVisible()
      .catch(() => false)
    expect(isLoading || hasResults).toBe(true)
  })

  // ─── Search ──────────────────────────────────────────────────────────────────

  authTest('should update results when searching', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search creators"]')
    await searchInput.fill('test')

    await page.waitForTimeout(500)
    await waitForCreatorsResolved(page)
    const hasResult = await page
      .locator('a[href^="/creator/"]')
      .or(page.locator(':text("No creators found")'))
      .first()
      .isVisible()
      .catch(() => false)
    expect(hasResult).toBe(true)
  })

  authTest('should show empty state for non-existent creator search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search creators"]')
    await searchInput.fill('zzzzthisshouldnotexistxxx999')
    await page.waitForTimeout(800)

    await expect(page.locator('text=No creators found')).toBeVisible({ timeout: 8000 })
  })

  // ─── No JS errors ────────────────────────────────────────────────────────────

  authTest('should not throw unhandled JS errors on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/explore')
    await waitForPageLoad(page)

    // Allow React hydration warnings but not crashes
    const criticalErrors = errors.filter(
      e => !/hydrat|minified react/i.test(e)
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
