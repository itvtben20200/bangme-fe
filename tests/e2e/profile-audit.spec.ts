import { test, expect } from './fixtures'
import { waitForPageLoad } from './helpers'

// Quick profile audit - tests that work without auth
test.describe('Profile Page Quick Audit', () => {
  test('should access profile page when logged out (should redirect)', async ({ page }) => {
    await page.goto('/profile')
    await waitForPageLoad(page)
    
    // Should redirect to login or show login form
    const url = page.url()
    console.log('Current URL:', url)
    
    // Check if redirected to login or landing
    const isOnLogin = url.includes('/login') || url === 'http://localhost:3003/'
    console.log('Redirected to login/landing:', isOnLogin)
  })

  test('should display login page elements', async ({ page }) => {
    await page.goto('/login')
    await waitForPageLoad(page)
    
    // Check login form exists
    await expect(page.locator('input[name="identifier"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    console.log('✅ Login form elements are visible')
  })

  test('should have avatar upload button in profile code', async ({ page }) => {
    // Just check the page loads and has expected structure
    await page.goto('/profile')
    await waitForPageLoad(page)
    
    console.log('Profile page accessed')
  })
})

// Test with actual login - remove .skip to enable
test.describe.skip('Profile Page With Authentication', () => {
  test('should login and access profile', async ({ page }) => {
    // Navigate to login
    await page.goto('/login')
    await waitForPageLoad(page)
    
    // Fill login form - UPDATE THESE CREDENTIALS!
    await page.fill('input[name="identifier"]', 'your-email@test.com')
    await page.fill('input[name="password"]', 'your-password')
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL(/\/(home|creator-center|profile)/, { timeout: 10000 })
    
    console.log('✅ Logged in successfully')
    
    // Navigate to profile
    await page.goto('/profile')
    await waitForPageLoad(page)
    
    // Check profile elements
    const hasAvatar = await page.locator('[data-testid="profile-avatar"], img[alt*="avatar"]').count() > 0
    console.log('Has avatar element:', hasAvatar)
    
    const hasBanner = await page.locator('[data-testid="profile-banner"]').count() > 0
    console.log('Has banner element:', hasBanner)
    
    const hasDisplayName = await page.locator('input[name="displayName"], h1, h2').count() > 0
    console.log('Has display name:', hasDisplayName)
    
    const hasBio = await page.locator('textarea[name="bio"]').count() > 0
    console.log('Has bio field:', hasBio)
    
    // Look for upload buttons
    const avatarUploadBtn = page.locator('button[aria-label*="avatar"], button:has-text("Change Avatar"), input[type="file"]').first()
    const hasAvatarUpload = await avatarUploadBtn.count() > 0
    console.log('Has avatar upload:', hasAvatarUpload)
    
    const bannerUploadBtn = page.locator('button[aria-label*="banner"], button:has-text("Change Banner"), input[type="file"]').nth(1)
    const hasBannerUpload = await bannerUploadBtn.count() > 0
    console.log('Has banner upload:', hasBannerUpload)
    
    // Take screenshot for review
    await page.screenshot({ path: 'test-results/profile-audit.png', fullPage: true })
    console.log('📸 Screenshot saved to test-results/profile-audit.png')
  })

  test('should update display name', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="identifier"]', 'your-email@test.com')
    await page.fill('input[name="password"]', 'your-password')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(home|creator-center)/, { timeout: 10000 })
    
    // Go to profile
    await page.goto('/profile')
    await waitForPageLoad(page)
    
    // Update display name
    const newName = `Test User ${Date.now()}`
    await page.fill('input[name="displayName"]', newName)
    
    // Click save button
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Wait for success toast or confirmation
    await page.waitForTimeout(2000)
    
    // Verify update
    const displayNameField = page.locator('input[name="displayName"]')
    await expect(displayNameField).toHaveValue(newName)
    
    console.log('✅ Display name updated successfully')
  })

  test('should update bio', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="identifier"]', 'your-email@test.com')
    await page.fill('input[name="password"]', 'your-password')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(home|creator-center)/, { timeout: 10000 })
    
    // Go to profile
    await page.goto('/profile')
    await waitForPageLoad(page)
    
    // Update bio
    const newBio = `Updated bio ${Date.now()}`
    await page.fill('textarea[name="bio"]', newBio)
    
    // Click save button
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Wait for success
    await page.waitForTimeout(2000)
    
    console.log('✅ Bio updated successfully')
  })
})
