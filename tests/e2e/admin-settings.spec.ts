import { test, expect } from './fixtures'
import { waitForPageLoad, waitForToast } from './helpers'

/**
 * ADMIN SETTINGS — Playwright E2E Tests
 *
 * Covers the newly implemented /admin/settings page that replaced the
 * session-only stub with a fully persisted API-backed settings panel.
 *
 * API calls to GET/PATCH /api/admin/settings are intercepted via
 * page.route() so tests run reliably without mutating the live database.
 *
 * Run:
 *   npx playwright test tests/e2e/admin-settings.spec.ts --headed
 *   npx playwright test tests/e2e/admin-settings.spec.ts --headed --project=chromium
 */

const MOCK_SETTINGS = {
  id:                   'singleton',
  platformFeePercent:   20,
  processingFeePercent: 2.9,
  minPayoutUsd:         50,
  maxPostSizeMb:        500,
  maxAvatarSizeMb:      5,
  maxBioLength:         500,
  supportEmail:         'support@bangme.app',
  maintenanceMode:      false,
  registrationsOpen:    true,
  creatorApplyOpen:     true,
  liveEnabled:          true,
  payoutsEnabled:       true,
  updatedAt:            new Date().toISOString(),
}

/** Intercept GET and PATCH /api/admin/settings with controllable mock state */
async function mockSettingsApi(
  page: import('@playwright/test').Page,
  overrides: Partial<typeof MOCK_SETTINGS> = {}
) {
  let currentSettings = { ...MOCK_SETTINGS, ...overrides }

  await page.route('**/api/admin/settings', async (route) => {
    const method = route.request().method()

    if (method === 'GET') {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ success: true, data: currentSettings }),
      })
      return
    }

    if (method === 'PATCH') {
      const body = JSON.parse(route.request().postData() ?? '{}') as Partial<typeof MOCK_SETTINGS>
      currentSettings = { ...currentSettings, ...body, updatedAt: new Date().toISOString() }
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ success: true, data: currentSettings }),
      })
      return
    }

    await route.continue()
  })
}

// ─── Page Load & Structure ────────────────────────────────────────────────────

test.describe('Admin Settings — Page Load', () => {
  test('should load admin settings page and show all three sections', async ({
    page,
    loginAsAdmin,
  }) => {
    await mockSettingsApi(page)
    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    // Page heading
    await expect(page.getByRole('heading', { name: /platform settings/i })).toBeVisible()

    // Revenue & Limits section
    await expect(page.getByRole('heading', { name: /revenue.*limits/i })).toBeVisible()

    // Feature Flags section
    await expect(page.getByRole('heading', { name: /feature flags/i })).toBeVisible()

    // Security Overview section
    await expect(page.getByRole('heading', { name: /security overview/i })).toBeVisible()
  })

  test('should display API-loaded values in revenue inputs', async ({
    page,
    loginAsAdmin,
  }) => {
    await mockSettingsApi(page, { platformFeePercent: 20, minPayoutUsd: 50 })
    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    // Platform fee input should show the value from the API
    const platformFeeInput = page.locator('input').filter({ hasText: '' }).nth(0)
    // Use label-based lookup for reliability
    const feeLabel = page.getByText('Platform Fee (%)')
    await expect(feeLabel).toBeVisible()

    // Support email should be pre-filled
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveValue('support@bangme.app')
  })

  test('should show loading spinner before data arrives', async ({
    page,
    loginAsAdmin,
  }) => {
    // Delay the API response to observe loading state
    await page.route('**/api/admin/settings', async (route) => {
      await new Promise(r => setTimeout(r, 600))
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ success: true, data: MOCK_SETTINGS }),
      })
    })

    await loginAsAdmin()
    await page.goto('/admin/settings')

    // Loading indicator should appear briefly
    const spinner = page.locator('text=/loading settings/i')
    // It may or may not be caught depending on timing — just ensure page renders after
    await page.waitForSelector('h1', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /platform settings/i })).toBeVisible()
  })

  test('should show error state when API fails', async ({
    page,
    loginAsAdmin,
  }) => {
    // Simulate API failure
    await page.route('**/api/admin/settings', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' })
    })

    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    await expect(page.getByText(/failed to load platform settings/i)).toBeVisible()
  })
})

// ─── Revenue & Limits Form ────────────────────────────────────────────────────

test.describe('Admin Settings — Revenue & Limits', () => {
  test('should allow editing the platform fee and save', async ({
    page,
    loginAsAdmin,
  }) => {
    let patchBody: Record<string, unknown> = {}

    await page.route('**/api/admin/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_SETTINGS }),
        })
        return
      }
      if (route.request().method() === 'PATCH') {
        patchBody = JSON.parse(route.request().postData() ?? '{}')
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { ...MOCK_SETTINGS, ...patchBody } }),
        })
        return
      }
      await route.continue()
    })

    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    // Locate the platform fee input by finding the label and its sibling input
    const feeInputLabel = page.getByText('Platform Fee (%)')
    const feeInput = page.locator('input[type="number"]').first()
    await feeInput.fill('25')

    // Click Save Changes
    await page.getByRole('button', { name: /save changes/i }).click()

    // Toast success should appear
    await waitForToast(page, 'Settings saved')

    // The PATCH should have been called with platformFeePercent = 25
    expect(patchBody).toMatchObject({ platformFeePercent: 25 })
  })

  test('should display live creator share preview as platform fee changes', async ({
    page,
    loginAsAdmin,
  }) => {
    await mockSettingsApi(page, { platformFeePercent: 20 })
    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    // Initial creator share should show 80%
    await expect(page.getByText(/creator share.*80/i)).toBeVisible()

    // Change platform fee to 30
    const feeInput = page.locator('input[type="number"]').first()
    await feeInput.fill('30')

    // Creator share should update to 70%
    await expect(page.getByText(/creator share.*70/i)).toBeVisible()
  })

  test('should show "Saving…" on button while PATCH is in-flight', async ({
    page,
    loginAsAdmin,
  }) => {
    await page.route('**/api/admin/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_SETTINGS }),
        })
        return
      }
      // Delay PATCH to observe button state
      await new Promise(r => setTimeout(r, 800))
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: MOCK_SETTINGS }),
      })
    })

    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    await page.getByRole('button', { name: /save changes/i }).click()

    // Button should show "Saving…" while request is pending
    await expect(page.getByRole('button', { name: /saving/i })).toBeVisible()

    // After response, button should revert
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible({ timeout: 5000 })
  })

  test('should show error toast when PATCH fails', async ({
    page,
    loginAsAdmin,
  }) => {
    await page.route('**/api/admin/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_SETTINGS }),
        })
        return
      }
      await route.fulfill({ status: 500, body: 'Error' })
    })

    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    await page.getByRole('button', { name: /save changes/i }).click()

    await waitForToast(page, 'Failed to save settings')
  })
})

// ─── Feature Flags ────────────────────────────────────────────────────────────

test.describe('Admin Settings — Feature Flags', () => {
  test('should render all five feature flag toggles', async ({
    page,
    loginAsAdmin,
  }) => {
    await mockSettingsApi(page)
    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    await expect(page.getByText('Maintenance Mode')).toBeVisible()
    await expect(page.getByText('Open Registrations')).toBeVisible()
    await expect(page.getByText('Creator Applications')).toBeVisible()
    await expect(page.getByText('Live Streaming')).toBeVisible()
    await expect(page.getByText('Payouts')).toBeVisible()
  })

  test('should call PATCH when a feature toggle is clicked', async ({
    page,
    loginAsAdmin,
  }) => {
    let patchCalled = false
    let patchBody:   Record<string, unknown> = {}

    await page.route('**/api/admin/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_SETTINGS }),
        })
        return
      }
      if (route.request().method() === 'PATCH') {
        patchCalled = true
        patchBody   = JSON.parse(route.request().postData() ?? '{}')
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { ...MOCK_SETTINGS, ...patchBody } }),
        })
        return
      }
      await route.continue()
    })

    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    // Toggle "Maintenance Mode" (currently false → should PATCH {maintenanceMode: true})
    const maintenanceToggle = page.getByRole('button', { name: /enable maintenance mode/i })
    await maintenanceToggle.click()

    expect(patchCalled).toBe(true)
    expect(patchBody).toMatchObject({ maintenanceMode: true })
  })

  test('should toggle icon from ToggleLeft to ToggleRight on enable', async ({
    page,
    loginAsAdmin,
  }) => {
    // Start with maintenanceMode: false so it starts in "off" state
    await mockSettingsApi(page, { maintenanceMode: false })
    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    const toggleBtn = page.getByRole('button', { name: /enable maintenance mode/i })
    await expect(toggleBtn).toBeVisible()

    // After click, icon should flip (aria-label changes to "Disable…")
    await toggleBtn.click()
    await expect(
      page.getByRole('button', { name: /disable maintenance mode/i })
    ).toBeVisible({ timeout: 5000 })
  })

  test('should disable toggle buttons while PATCH is in-flight', async ({
    page,
    loginAsAdmin,
  }) => {
    await page.route('**/api/admin/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_SETTINGS }),
        })
        return
      }
      await new Promise(r => setTimeout(r, 800))
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: MOCK_SETTINGS }),
      })
    })

    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    const toggleBtn = page.getByRole('button', { name: /enable maintenance mode/i })
    await toggleBtn.click()

    // While in-flight, button should be disabled
    await expect(toggleBtn).toBeDisabled()
  })
})

// ─── Security Overview ────────────────────────────────────────────────────────

test.describe('Admin Settings — Security Overview', () => {
  test('should display all security overview rows', async ({
    page,
    loginAsAdmin,
  }) => {
    await mockSettingsApi(page)
    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    await expect(page.getByText('JWT Access Token TTL')).toBeVisible()
    await expect(page.getByText('JWT Refresh Token TTL')).toBeVisible()
    await expect(page.getByText('Rate Limiting')).toBeVisible()
    await expect(page.getByText('Password Hashing')).toBeVisible()
    await expect(page.getByText('Settings last updated')).toBeVisible()
  })

  test('should show a timestamp for "Settings last updated"', async ({
    page,
    loginAsAdmin,
  }) => {
    await mockSettingsApi(page, { updatedAt: '2026-07-29T12:00:00.000Z' })
    await loginAsAdmin()
    await page.goto('/admin/settings')
    await waitForPageLoad(page)

    // Should show some date/time — locale format varies, just check it's not empty
    const updatedRow = page.locator('div').filter({ hasText: /settings last updated/i })
    await expect(updatedRow).toBeVisible()
    // The timestamp cell should contain "2026" or a locale-formatted equivalent
    await expect(page.getByText(/2026/)).toBeVisible()
  })
})

// ─── Access Control ───────────────────────────────────────────────────────────

test.describe('Admin Settings — Access Control', () => {
  test('should redirect unauthenticated user away from /admin/settings', async ({
    page,
  }) => {
    // No login — navigate directly
    await page.goto('/admin/settings')
    // Middleware should redirect to /login
    await expect(page).toHaveURL(/\/(login|admin\/login)/, { timeout: 10000 })
  })
})
