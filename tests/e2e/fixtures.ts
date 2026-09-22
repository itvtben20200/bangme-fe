import { test as base, expect, type Page } from '@playwright/test'

/**
 * Pre-set the age-verification localStorage flag so the modal is
 * bypassed on the very first page load in each test's browser context.
 * This runs before any navigation happens.
 */
async function bypassAgeGate(page: Page) {
  // Inject the flag via init-script so it is already in localStorage when
  // the first page loads (avoids a race where the modal renders before we
  // can click it).
  await page.addInitScript(() => {
    localStorage.setItem('age_verified', String(Date.now()))
  })
}

// Test user credentials
export const TEST_USERS = {
  creator: {
    email: 'aria.kim@bangme.dev',
    username: 'ariakim',
    password: 'Creator@1234',
    displayName: 'Aria Kim',
  },
  fan: {
    email: 'leslie055@bangme.dev',
    username: 'leslie055',
    password: 'Test12345678!',
    displayName: 'Leslie',
  },
  subscriber: {
    email: 'benjo07@bangme.dev',
    username: 'benjo07',
    password: 'Developer123!',
    displayName: 'Benjo',
  },
  admin: {
    email: 'admin@bangme.dev',
    username: 'testadmin',
    password: 'Admin@1234',
    displayName: 'Test Admin',
  },
  newUser: {
    email: `newuser${Date.now()}@test.com`,
    username: `newuser${Date.now()}`,
    password: 'Test123!@#',
    displayName: 'New Test User',
  },
}

// Custom test fixture for authenticated users
type AuthFixture = {
  authenticatedPage: Page
  loginAsCreator: () => Promise<void>
  loginAsFan: () => Promise<void>
  loginAsSubscriber: () => Promise<void>
  loginAsAdmin: () => Promise<void>
}

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    await use(page)
  },

  loginAsCreator: async ({ page }, use) => {
    const login = async () => {
      await bypassAgeGate(page)
      await page.goto('/login')
      await page.waitForSelector('input[name="identifier"]', { timeout: 15000 })
      await page.fill('input[name="identifier"]', TEST_USERS.creator.email)
      await page.fill('input[name="password"]', TEST_USERS.creator.password)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/(home|creator-center)/, { timeout: 15000 })
    }
    await use(login)
  },

  loginAsFan: async ({ page }, use) => {
    const login = async () => {
      await bypassAgeGate(page)
      await page.goto('/login')
      await page.waitForSelector('input[name="identifier"]', { timeout: 15000 })
      await page.fill('input[name="identifier"]', TEST_USERS.fan.email)
      await page.fill('input[name="password"]', TEST_USERS.fan.password)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/(home|creator-center|profile)/, { timeout: 15000 })
    }
    await use(login)
  },

  loginAsAdmin: async ({ page }, use) => {
    const login = async () => {
      await bypassAgeGate(page)
      await page.goto('/admin/login')
      await page.waitForSelector('input[name="email"]', { timeout: 15000 })
      await page.fill('input[name="email"]', TEST_USERS.admin.email)
      await page.fill('input[name="password"]', TEST_USERS.admin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 })
    }
    await use(login)
  },

  loginAsSubscriber: async ({ page }, use) => {
    const login = async () => {
      await bypassAgeGate(page)
      await page.goto('/login')
      await page.waitForSelector('input[name="identifier"]', { timeout: 15000 })
      await page.fill('input[name="identifier"]', TEST_USERS.subscriber.username)
      await page.fill('input[name="password"]', TEST_USERS.subscriber.password)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/(home|creator-center|profile)/, { timeout: 15000 })
    }
    await use(login)
  },
})

export { expect }
