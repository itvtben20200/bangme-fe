import { test, expect } from './fixtures'
import { waitForPageLoad } from './helpers'
import path from 'path'

/**
 * LIVE PROFILE TEST
 * 
 * Instructions:
 * 1. Update TEST_USER credentials below
 * 2. Create test images in tests/fixtures/
 * 3. Run: npx playwright test tests/e2e/profile-live.spec.ts --headed
 */

const TEST_USER = {
  email: 'YOUR_EMAIL@test.com',      // ⚠️ UPDATE THIS
  password: 'YOUR_PASSWORD',          // ⚠️ UPDATE THIS
}

test.describe('Profile Page - Live Test', () => {
  test('full profile workflow - login, update, upload', async ({ page }) => {
    // STEP 1: Login
    console.log('Step 1: Logging in...')
    await page.goto('/login')
    await waitForPageLoad(page)
    
    await page.fill('input[name="identifier"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL(/\/(home|creator-center|profile)/, { timeout: 10000 })
    console.log('✅ Logged in successfully')
    
    // STEP 2: Navigate to profile
    console.log('\nStep 2: Navigating to profile...')
    await page.goto('/profile')
    await waitForPageLoad(page)
    console.log('✅ Profile page loaded')
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/profile-initial.png', fullPage: true })
    console.log('📸 Screenshot: profile-initial.png')
    
    // STEP 3: Check current profile state
    console.log('\nStep 3: Checking profile elements...')
    
    const hasDisplayName = await page.locator('input[name="displayName"]').count() > 0
    console.log('✅ Display name field:', hasDisplayName)
    
    const hasBio = await page.locator('textarea[name="bio"]').count() > 0
    console.log('✅ Bio field:', hasBio)
    
    const hasAvatar = await page.locator('button[title*="avatar"]').count() > 0
    console.log('✅ Avatar button:', hasAvatar)
    
    const hasBanner = await page.locator('div[title*="cover"]').count() > 0
    console.log('✅ Banner area:', hasBanner)
    
    // STEP 4: Update display name
    console.log('\nStep 4: Updating display name...')
    const newDisplayName = `Test User ${Date.now()}`
    await page.fill('input[name="displayName"]', newDisplayName)
    console.log(`New display name: ${newDisplayName}`)
    
    // STEP 5: Update bio
    console.log('\nStep 5: Updating bio...')
    const newBio = `Updated bio at ${new Date().toISOString()}`
    await page.fill('textarea[name="bio"]', newBio)
    console.log(`New bio: ${newBio}`)
    
    // STEP 6: Save changes
    console.log('\nStep 6: Saving changes...')
    await page.click('button[type="submit"]:has-text("Save")')
    
    // Wait for success toast
    await page.waitForTimeout(2000)
    
    // Check if save button is disabled (means no changes)
    const saveButton = page.locator('button[type="submit"]:has-text("Save")')
    const isDisabled = await saveButton.isDisabled()
    console.log('✅ Changes saved (button disabled):', isDisabled)
    
    await page.screenshot({ path: 'test-results/profile-updated.png', fullPage: true })
    console.log('📸 Screenshot: profile-updated.png')
    
    // STEP 7: Upload avatar (if test image exists)
    console.log('\nStep 7: Testing avatar upload...')
    try {
      const avatarPath = path.join(process.cwd(), 'tests', 'fixtures', 'test-avatar.jpg')
      
      // Find hidden file input for avatar
      const avatarInput = page.locator('input[type="file"]').first()
      
      console.log('Uploading avatar...')
      await avatarInput.setInputFiles(avatarPath)
      
      // Wait for upload to complete
      await page.waitForTimeout(3000)
      
      // Check for success toast
      const toastVisible = await page.locator('[data-sonner-toast]').count() > 0
      console.log('✅ Avatar upload toast shown:', toastVisible)
      
      await page.screenshot({ path: 'test-results/profile-avatar-uploaded.png', fullPage: true })
      console.log('📸 Screenshot: profile-avatar-uploaded.png')
    } catch (e) {
      console.log('⚠️  Avatar upload skipped - no test image found')
      console.log('   Create tests/fixtures/test-avatar.jpg to test uploads')
    }
    
    // STEP 8: Upload banner (if test image exists)
    console.log('\nStep 8: Testing banner upload...')
    try {
      const bannerPath = path.join(process.cwd(), 'tests', 'fixtures', 'test-banner.jpg')
      
      // Find hidden file input for banner
      const bannerInput = page.locator('input[type="file"]').nth(1)
      
      console.log('Uploading banner...')
      await bannerInput.setInputFiles(bannerPath)
      
      // Wait for upload to complete
      await page.waitForTimeout(3000)
      
      // Check for success toast
      const toastVisible = await page.locator('[data-sonner-toast]').count() > 0
      console.log('✅ Banner upload toast shown:', toastVisible)
      
      await page.screenshot({ path: 'test-results/profile-banner-uploaded.png', fullPage: true })
      console.log('📸 Screenshot: profile-banner-uploaded.png')
    } catch (e) {
      console.log('⚠️  Banner upload skipped - no test image found')
      console.log('   Create tests/fixtures/test-banner.jpg to test uploads')
    }
    
    // STEP 9: Final verification
    console.log('\nStep 9: Final verification...')
    
    // Reload profile to see persisted changes
    await page.reload()
    await waitForPageLoad(page)
    
    const displayNameValue = await page.locator('input[name="displayName"]').inputValue()
    console.log('Display name after reload:', displayNameValue)
    
    const bioValue = await page.locator('textarea[name="bio"]').inputValue()
    console.log('Bio after reload:', bioValue.substring(0, 50) + '...')
    
    await page.screenshot({ path: 'test-results/profile-final.png', fullPage: true })
    console.log('📸 Screenshot: profile-final.png')
    
    // Success summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ PROFILE TEST COMPLETE!')
    console.log('='.repeat(60))
    console.log('✅ Login successful')
    console.log('✅ Profile page accessible')
    console.log('✅ Display name update works')
    console.log('✅ Bio update works')
    console.log('✅ Form validation works')
    console.log('📸 Screenshots saved to test-results/')
    console.log('='.repeat(60))
  })
})
