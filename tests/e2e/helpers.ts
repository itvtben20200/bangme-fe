import { Page, expect } from '@playwright/test'

/**
 * Helper function to wait for navigation and network idle
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Helper to fill form and submit
 */
export async function fillAndSubmitForm(
  page: Page,
  fields: Record<string, string>,
  submitSelector: string = 'button[type="submit"]'
) {
  for (const [name, value] of Object.entries(fields)) {
    await page.fill(`input[name="${name}"], textarea[name="${name}"]`, value)
  }
  await page.click(submitSelector)
}

/**
 * Helper to upload file
 */
export async function uploadFile(page: Page, selector: string, filePath: string) {
  const fileInput = page.locator(selector)
  await fileInput.setInputFiles(filePath)
}

/**
 * Helper to check if element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 5000 })
    return true
  } catch {
    return false
  }
}

/**
 * Helper to wait for toast message
 */
export async function waitForToast(page: Page, message?: string) {
  const toastSelector = '[data-sonner-toast]'
  await page.waitForSelector(toastSelector, { state: 'visible', timeout: 5000 })
  
  if (message) {
    await expect(page.locator(toastSelector)).toContainText(message)
  }
}

/**
 * Helper to take accessible screenshot with annotations
 */
export async function takeAnnotatedScreenshot(page: Page, name: string, annotations?: string[]) {
  if (annotations && annotations.length > 0) {
    // Add visual indicators for important elements
    for (const selector of annotations) {
      await page.locator(selector).evaluate((el) => {
        el.style.outline = '3px solid red'
      })
    }
  }
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true })
}

/**
 * Helper to check accessibility basics
 */
export async function checkBasicAccessibility(page: Page) {
  // Check for main landmark
  const main = page.locator('main, [role="main"]')
  await expect(main).toBeVisible()
  
  // Check for heading hierarchy
  const h1 = page.locator('h1')
  const h1Count = await h1.count()
  expect(h1Count).toBeGreaterThan(0)
  expect(h1Count).toBeLessThanOrEqual(1) // Should have exactly one h1
}

/**
 * Helper to test keyboard navigation
 */
export async function testKeyboardNavigation(page: Page, startSelector: string, expectedSelectors: string[]) {
  await page.focus(startSelector)
  
  for (const selector of expectedSelectors) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.matches(`${selector}`) ? document.activeElement : null)
    expect(focused).toBeTruthy()
  }
}

/**
 * Helper to generate test image file
 */
export function generateTestImagePath(): string {
  // Create a simple test image path
  return 'tests/fixtures/test-avatar.jpg'
}

/**
 * Helper to wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp, method: string = 'GET') {
  return await page.waitForResponse(
    (response) => {
      const url = response.url()
      const matches = typeof urlPattern === 'string' 
        ? url.includes(urlPattern) 
        : urlPattern.test(url)
      return matches && response.request().method() === method
    },
    { timeout: 10000 }
  )
}
