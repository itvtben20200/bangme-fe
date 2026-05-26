import { test as base, expect } from '@playwright/test'

// Test user credentials
export const TEST_USERS = {
  creator: {
    email: 'creator@test.com',
    username: 'testcreator',
    password: 'Test123!@#',
    displayName: 'Test Creator',
  },
  fan: {
    email: 'fan@test.com',
    username: 'testfan',
    password: 'Test123!@#',
    displayName: 'Test Fan',
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
  authenticatedPage: any
  loginAsCreator: () => Promise<void>
  loginAsFan: () => Promise<void>
}

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    await use(page)
  },

  loginAsCreator: async ({ page }, use) => {
    const login = async () => {
      await page.goto('/login')
      await page.fill('input[name="identifier"]', TEST_USERS.creator.email)
      await page.fill('input[name="password"]', TEST_USERS.creator.password)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/(home|creator-center)/, { timeout: 10000 })
    }
    await use(login)
  },

  loginAsFan: async ({ page }, use) => {
    const login = async () => {
      await page.goto('/login')
      await page.fill('input[name="identifier"]', TEST_USERS.fan.email)
      await page.fill('input[name="password"]', TEST_USERS.fan.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('/home', { timeout: 10000 })
    }
    await use(login)
  },
})

export { expect }
