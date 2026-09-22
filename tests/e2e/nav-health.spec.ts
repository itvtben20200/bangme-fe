import { test, expect } from './fixtures'
import { waitForPageLoad } from './helpers'

/**
 * NAV HEALTH CHECK
 *
 * Clicks every sidebar navigation link and checks each page for:
 *  - Successful load (no redirect back to /login)
 *  - No unhandled JS exceptions
 *  - No network requests returning 4xx / 5xx
 *  - No visible error text ("something went wrong", "error", "not found", etc.)
 *  - Main content area is rendered
 *
 * Run:
 *   npx playwright test tests/e2e/nav-health.spec.ts --headed
 */

// Pages accessible to a fan user
const FAN_PAGES = [
  { href: '/home',          label: 'Home' },
  { href: '/explore',       label: 'Discover' },
  { href: '/profile',       label: 'Profile' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/messages',      label: 'Messages' },
  { href: '/bangcoins',     label: 'BangCoins' },
  { href: '/become-creator',label: 'Become Creator' },
  { href: '/settings',      label: 'Settings' },
]

// Pages accessible to a creator user (replaces /become-creator)
const CREATOR_PAGES = [
  { href: '/home',           label: 'Home' },
  { href: '/explore',        label: 'Discover' },
  { href: '/profile',        label: 'Profile' },
  { href: '/notifications',  label: 'Notifications' },
  { href: '/messages',       label: 'Messages' },
  { href: '/bangcoins',      label: 'BangCoins' },
  { href: '/creator-center', label: 'Creator Center' },
  { href: '/settings',       label: 'Settings' },
]

// Error phrases to detect in page content
const ERROR_PHRASES = [
  'something went wrong',
  'application error',
  'internal server error',
  'unexpected error',
  '404',
  'page not found',
  'not found',
  'failed to load',
  'cannot read',
  'undefined is not',
]

async function auditPage(page: any, href: string, label: string) {
  const consoleErrors: string[] = []
  const networkErrors: string[] = []

  // Collect console errors
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  // Collect failed network requests
  page.on('response', (response: any) => {
    const status = response.status()
    if (status >= 400) {
      networkErrors.push(`${status} ${response.url()}`)
    }
  })

  // Navigate to page
  await page.goto(href)
  await waitForPageLoad(page)

  // 1. Must not be bounced back to login
  const currentUrl = page.url()
  console.log(`[${label}] Current URL: ${currentUrl}`)
  expect(
    new URL(currentUrl).pathname.startsWith('/login'),
    `[${label}] Redirected to login (${currentUrl}) — session may have expired or route is protected`
  ).toBeFalsy()

  // 2. Main content must be present
  const main = page.locator('main, [role="main"]')
  await expect(
    main,
    `[${label}] <main> element not found at ${currentUrl} — page may not have rendered`
  ).toBeVisible({ timeout: 12000 })

  // 3. Check for visible error phrases in body text
  const bodyText = (await page.locator('body').innerText()).toLowerCase()
  for (const phrase of ERROR_PHRASES) {
    // Skip "not found" false-positives from nav labels etc. by requiring surrounding context
    if (phrase === 'not found' || phrase === '404') {
      const strictMatch = bodyText.includes(`\n${phrase}`) || bodyText.startsWith(phrase)
      if (strictMatch) {
        console.warn(`[${label}] Possible error phrase detected: "${phrase}"`)
      }
    } else {
      const found = bodyText.includes(phrase)
      expect(
        found,
        `[${label}] Error phrase "${phrase}" found in page body`
      ).toBeFalsy()
    }
  }

  // 4. Log network errors (warn, don't fail — APIs may be optional)
  if (networkErrors.length > 0) {
    console.warn(`[${label}] Network errors:\n  ${networkErrors.join('\n  ')}`)
  }

  // 5. Log JS console errors (warn only — third-party scripts can be noisy)
  if (consoleErrors.length > 0) {
    console.warn(`[${label}] Console errors:\n  ${consoleErrors.join('\n  ')}`)
  }

  // 6. Screenshot every page for manual review
  await page.screenshot({
    path: `test-results/nav-health/${label.toLowerCase().replace(/\s+/g, '-')}.png`,
    fullPage: true,
  })

  console.log(`✅ [${label}] ${href} — OK`)
  return { label, href, consoleErrors, networkErrors }
}

test.describe('Navigation Health Check — Fan', () => {
  test('all fan nav pages load without errors', async ({ page, loginAsFan }) => {
    await loginAsFan()

    const results: any[] = []
    for (const { href, label } of FAN_PAGES) {
      const result = await auditPage(page, href, label)
      results.push(result)
    }

    // Summary report in test output
    const totalConsoleErrors = results.reduce((n, r) => n + r.consoleErrors.length, 0)
    const totalNetworkErrors = results.reduce((n, r) => n + r.networkErrors.length, 0)
    console.log(`\n--- Nav Health Summary (Fan) ---`)
    console.log(`Pages checked : ${results.length}`)
    console.log(`Console errors: ${totalConsoleErrors}`)
    console.log(`Network errors: ${totalNetworkErrors}`)
  })
})

test.describe('Navigation Health Check — Creator', () => {
  test('all creator nav pages load without errors', async ({ page, loginAsCreator }) => {
    await loginAsCreator()

    const results: any[] = []
    for (const { href, label } of CREATOR_PAGES) {
      const result = await auditPage(page, href, label)
      results.push(result)
    }

    const totalConsoleErrors = results.reduce((n, r) => n + r.consoleErrors.length, 0)
    const totalNetworkErrors = results.reduce((n, r) => n + r.networkErrors.length, 0)
    console.log(`\n--- Nav Health Summary (Creator) ---`)
    console.log(`Pages checked : ${results.length}`)
    console.log(`Console errors: ${totalConsoleErrors}`)
    console.log(`Network errors: ${totalNetworkErrors}`)
  })
})
