import { test, expect } from './fixtures'
import { waitForPageLoad, fillAndSubmitForm, waitForToast, checkBasicAccessibility } from './helpers'

test.describe('Authentication Flow', () => {
  test.describe('Registration', () => {
    test('should display registration form with all required fields', async ({ page }) => {
      await page.goto('/register')
      await waitForPageLoad(page)
      
      // Check page title
      await expect(page).toHaveTitle(/Register|Sign Up/i)
      
      // Check all required form fields are present
      await expect(page.locator('input[name="username"]')).toBeVisible()
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
      await expect(page.locator('input[name="displayName"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      // Check for link to login
      await expect(page.locator('a[href*="/login"]')).toBeVisible()
      
      // Basic accessibility check
      await checkBasicAccessibility(page)
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/register')
      await waitForPageLoad(page)
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      const errorMessages = page.locator('text=/required|cannot be empty/i')
      await expect(errorMessages.first()).toBeVisible()
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/register')
      await waitForPageLoad(page)
      
      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('input[name="username"]', 'testuser')
      await page.fill('input[name="password"]', 'Test123!@#')
      await page.fill('input[name="confirmPassword"]', 'Test123!@#')
      await page.fill('input[name="displayName"]', 'Test User')
      await page.click('button[type="submit"]')
      
      // Should show email validation error
      await expect(page.locator('text=/invalid email|valid email/i')).toBeVisible()
    })

    test('should validate password match', async ({ page }) => {
      await page.goto('/register')
      await waitForPageLoad(page)
      
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="username"]', 'testuser')
      await page.fill('input[name="password"]', 'Test123!@#')
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')
      await page.fill('input[name="displayName"]', 'Test User')
      await page.click('button[type="submit"]')
      
      // Should show password mismatch error
      await expect(page.locator('text=/passwords.*match/i')).toBeVisible()
    })

    test('should show/hide password on toggle', async ({ page }) => {
      await page.goto('/register')
      await waitForPageLoad(page)
      
      const passwordInput = page.locator('input[name="password"]')
      const toggleButton = page.locator('button[aria-label*="password"]').first()
      
      // Initially should be password type
      await expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click toggle
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click again to hide
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test.skip('should successfully register new user', async ({ page }) => {
      // Note: This test is skipped by default as it creates real data
      // Enable only when testing against a clean test database
      
      const timestamp = Date.now()
      await page.goto('/register')
      await waitForPageLoad(page)
      
      await fillAndSubmitForm(page, {
        email: `newuser${timestamp}@test.com`,
        username: `newuser${timestamp}`,
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        displayName: 'New Test User',
      })
      
      // Should redirect to verify email page or home
      await page.waitForURL(/\/(verify-email-sent|home)/, { timeout: 10000 })
    })
  })

  test.describe('Login', () => {
    test('should display login form with all required fields', async ({ page }) => {
      await page.goto('/login')
      await waitForPageLoad(page)
      
      // Check page title
      await expect(page).toHaveTitle(/Login|Sign In/i)
      
      // Check all required form fields are present
      await expect(page.locator('input[name="identifier"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      // Check for links
      await expect(page.locator('a[href*="/register"]')).toBeVisible()
      await expect(page.locator('a[href*="/forgot-password"]')).toBeVisible()
      
      // Basic accessibility check
      await checkBasicAccessibility(page)
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/login')
      await waitForPageLoad(page)
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      const errorMessages = page.locator('text=/required|cannot be empty/i')
      await expect(errorMessages.first()).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')
      await waitForPageLoad(page)
      
      await fillAndSubmitForm(page, {
        identifier: 'nonexistent@example.com',
        password: 'WrongPassword123!',
      })
      
      // Should show error message
      await expect(page.locator('text=/invalid.*credentials|incorrect/i')).toBeVisible({ timeout: 5000 })
    })

    test.skip('should successfully login with email', async ({ page }) => {
      // Skip by default - requires test user in database
      await page.goto('/login')
      await waitForPageLoad(page)
      
      await fillAndSubmitForm(page, {
        identifier: 'creator@test.com',
        password: 'Test123!@#',
      })
      
      // Should redirect to home or creator center
      await page.waitForURL(/\/(home|creator-center)/, { timeout: 10000 })
      
      // Should show user menu
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 })
    })

    test.skip('should successfully login with username', async ({ page }) => {
      // Skip by default - requires test user in database
      await page.goto('/login')
      await waitForPageLoad(page)
      
      await fillAndSubmitForm(page, {
        identifier: 'testcreator',
        password: 'Test123!@#',
      })
      
      // Should redirect to home or creator center
      await page.waitForURL(/\/(home|creator-center)/, { timeout: 10000 })
      
      // Should show user menu
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 })
    })

    test('should navigate to registration page', async ({ page }) => {
      await page.goto('/login')
      await waitForPageLoad(page)
      
      await page.click('a[href*="/register"]')
      await page.waitForURL(/\/register/, { timeout: 5000 })
      
      await expect(page).toHaveURL(/\/register/)
    })

    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/login')
      await waitForPageLoad(page)
      
      await page.click('a[href*="/forgot-password"]')
      await page.waitForURL(/\/forgot-password/, { timeout: 5000 })
      
      await expect(page).toHaveURL(/\/forgot-password/)
    })
  })

  test.describe('Forgot Password', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/forgot-password')
      await waitForPageLoad(page)
      
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      await expect(page.locator('a[href*="/login"]')).toBeVisible()
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/forgot-password')
      await waitForPageLoad(page)
      
      await page.fill('input[name="email"]', 'invalid-email')
      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=/invalid email|valid email/i')).toBeVisible()
    })
  })

  test.describe('Logout', () => {
    test.skip('should successfully logout', async ({ page, loginAsFan }) => {
      // Login first
      await loginAsFan()
      
      // Click user menu
      await page.click('[data-testid="user-menu"]')
      
      // Click logout
      await page.click('text=/logout|sign out/i')
      
      // Should redirect to login or landing page
      await page.waitForURL(/\/(login|$)/, { timeout: 5000 })
      
      // Should not have access token
      const cookies = await page.context().cookies()
      const accessToken = cookies.find(c => c.name === 'accessToken')
      expect(accessToken).toBeUndefined()
    })
  })
})
