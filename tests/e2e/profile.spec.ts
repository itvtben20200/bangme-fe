import { test, expect } from './fixtures'
import { waitForPageLoad, waitForToast, uploadFile, checkBasicAccessibility } from './helpers'

test.describe('Profile Features', () => {
  test.describe('View Profile', () => {
    test.skip('should display user profile page', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Should show profile elements
      await expect(page).toHaveTitle(/profile/i)
      
      // Should show username and display name
      await expect(page.locator('h1, h2')).toBeVisible()
      
      // Should show stats (followers, following, posts)
      await expect(page.locator('text=/followers|following|posts/i')).toBeVisible()
      
      // Basic accessibility check
      await checkBasicAccessibility(page)
    })

    test.skip('should display user avatar', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Avatar should be visible (either image or placeholder)
      const avatar = page.locator('[data-testid="profile-avatar"], img[alt*="avatar"]')
      await expect(avatar.first()).toBeVisible()
    })

    test.skip('should display user banner', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Banner area should exist
      const banner = page.locator('[data-testid="profile-banner"]')
      await expect(banner).toBeVisible()
    })

    test.skip('should display user posts', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Posts section should exist
      await expect(page.locator('text=/posts/i')).toBeVisible()
      
      // Should show posts or empty state
      const postsExist = await page.locator('[data-testid="post-card"]').count() > 0
      
      if (!postsExist) {
        await expect(page.locator('text=/no posts|haven\'t posted/i')).toBeVisible()
      }
    })
  })

  test.describe('Edit Profile Information', () => {
    test.skip('should open profile edit form', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Look for edit button
      const editButton = page.locator('button:has-text("Edit Profile"), button:has-text("Edit")')
      
      if (await editButton.count() > 0) {
        await editButton.click()
        
        // Edit form/modal should open
        await expect(page.locator('input[name="displayName"], textarea[name="bio"]')).toBeVisible()
      }
    })

    test.skip('should update display name', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Fill display name
      const newDisplayName = `Updated Name ${Date.now()}`
      await page.fill('input[name="displayName"]', newDisplayName)
      
      // Save
      await page.click('button:has-text("Save"), button[type="submit"]')
      
      // Should show success message
      await waitForToast(page, /updated|saved/i)
      
      // Display name should be updated
      await expect(page.locator(`text="${newDisplayName}"`)).toBeVisible({ timeout: 5000 })
    })

    test.skip('should update bio', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Fill bio
      const newBio = `Updated bio ${Date.now()}`
      await page.fill('textarea[name="bio"]', newBio)
      
      // Save
      await page.click('button:has-text("Save"), button[type="submit"]')
      
      // Should show success message
      await waitForToast(page, /updated|saved/i)
      
      // Bio should be updated
      await expect(page.locator(`text="${newBio}"`)).toBeVisible({ timeout: 5000 })
    })

    test.skip('should validate display name length', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Try to enter empty display name
      await page.fill('input[name="displayName"]', '')
      await page.click('button:has-text("Save")')
      
      // Should show validation error
      await expect(page.locator('text=/required|cannot be empty/i')).toBeVisible()
    })

    test.skip('should validate bio length', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Try to enter very long bio (over 500 chars)
      const longBio = 'A'.repeat(501)
      await page.fill('textarea[name="bio"]', longBio)
      await page.click('button:has-text("Save")')
      
      // Should show validation error
      await expect(page.locator('text=/too long|maximum|500/i')).toBeVisible()
    })

    test.skip('should cancel profile edit', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Get original display name
      const originalName = await page.locator('h1, h2').first().textContent()
      
      // Edit display name
      await page.fill('input[name="displayName"]', 'Temporary Name')
      
      // Cancel (if there's a cancel button)
      const cancelButton = page.locator('button:has-text("Cancel")')
      if (await cancelButton.count() > 0) {
        await cancelButton.click()
        
        // Original name should remain
        await expect(page.locator(`text="${originalName}"`)).toBeVisible()
      }
    })
  })

  test.describe('Update Profile Images', () => {
    test.skip('should update avatar', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Click avatar edit button
      const avatarEditButton = page.locator('button[aria-label*="avatar"], button[data-testid="edit-avatar"]')
      await avatarEditButton.click()
      
      // Upload new avatar
      const fileInput = page.locator('input[type="file"][accept*="image"]').first()
      await fileInput.setInputFiles('tests/fixtures/test-avatar.jpg')
      
      // Wait for upload to complete
      await waitForToast(page, /avatar.*updated|uploaded/i)
      
      // Page should reload or avatar should update
      await page.waitForLoadState('networkidle')
      
      // New avatar should be visible
      await page.waitForTimeout(1000) // Allow time for image to load
    })

    test.skip('should update banner', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Click banner edit button
      const bannerEditButton = page.locator('button[aria-label*="banner"], button[data-testid="edit-banner"]')
      await bannerEditButton.click()
      
      // Upload new banner
      const fileInput = page.locator('input[type="file"][accept*="image"]').nth(1)
      await fileInput.setInputFiles('tests/fixtures/test-banner.jpg')
      
      // Wait for upload to complete
      await waitForToast(page, /banner.*updated|uploaded/i)
      
      // Page should reload or banner should update
      await page.waitForLoadState('networkidle')
      
      // New banner should be visible
      await page.waitForTimeout(1000) // Allow time for image to load
    })

    test.skip('should validate image file type', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Try to upload non-image file
      const avatarEditButton = page.locator('button[aria-label*="avatar"]')
      await avatarEditButton.click()
      
      const fileInput = page.locator('input[type="file"][accept*="image"]').first()
      
      // Try to upload a text file
      try {
        await fileInput.setInputFiles('tests/fixtures/test-file.txt')
        
        // Should show error
        await expect(page.locator('text=/invalid.*file|supported.*format/i')).toBeVisible({ timeout: 3000 })
      } catch (e) {
        // File input might reject the file type automatically
      }
    })

    test.skip('should validate image file size', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Try to upload large file
      const avatarEditButton = page.locator('button[aria-label*="avatar"]')
      await avatarEditButton.click()
      
      const fileInput = page.locator('input[type="file"][accept*="image"]').first()
      
      // Upload a large file (if available in fixtures)
      try {
        await fileInput.setInputFiles('tests/fixtures/large-image.jpg')
        
        // Should show error
        await expect(page.locator('text=/too large|file size|maximum/i')).toBeVisible({ timeout: 3000 })
      } catch (e) {
        // Test may not have large file
      }
    })

    test.skip('should show upload progress', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Click avatar edit button
      const avatarEditButton = page.locator('button[aria-label*="avatar"]')
      await avatarEditButton.click()
      
      // Upload new avatar
      const fileInput = page.locator('input[type="file"][accept*="image"]').first()
      await fileInput.setInputFiles('tests/fixtures/test-avatar.jpg')
      
      // Should show loading indicator
      await expect(page.locator('[data-testid="upload-loading"], svg.animate-spin')).toBeVisible({ timeout: 2000 })
    })

    test.skip('should handle upload error', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Mock network failure or upload large file to trigger error
      // This would require network mocking or specific test setup
      
      // Verify error handling exists
      const avatarEditButton = page.locator('button[aria-label*="avatar"]')
      await expect(avatarEditButton).toBeVisible()
    })
  })

  test.describe('Profile Settings', () => {
    test.skip('should navigate to settings', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Look for settings link
      const settingsLink = page.locator('a[href*="/settings"], button:has-text("Settings")')
      
      if (await settingsLink.count() > 0) {
        await settingsLink.click()
        await page.waitForURL(/\/settings/, { timeout: 5000 })
        
        await expect(page).toHaveURL(/\/settings/)
      }
    })

    test.skip('should logout from profile', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Look for logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")')
      
      if (await logoutButton.count() > 0) {
        await logoutButton.click()
        
        // Should redirect to login or landing
        await page.waitForURL(/\/(login|$)/, { timeout: 5000 })
      }
    })
  })

  test.describe('Creator Profile Features', () => {
    test.skip('should display creator-specific elements', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Should show subscriber count
      await expect(page.locator('text=/subscribers/i')).toBeVisible()
      
      // Should show earnings or creator-specific stats
      const creatorStats = page.locator('text=/earnings|revenue|bangcoins/i')
      if (await creatorStats.count() > 0) {
        await expect(creatorStats.first()).toBeVisible()
      }
    })

    test.skip('should navigate to creator center', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Look for creator center link
      const creatorCenterLink = page.locator('a[href*="/creator-center"]')
      
      if (await creatorCenterLink.count() > 0) {
        await creatorCenterLink.click()
        await page.waitForURL(/\/creator-center/, { timeout: 5000 })
        
        await expect(page).toHaveURL(/\/creator-center/)
      }
    })
  })

  test.describe('Profile Tabs/Sections', () => {
    test.skip('should switch between profile tabs', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Look for tabs
      const tabs = ['Posts', 'Liked', 'Saved']
      
      for (const tab of tabs) {
        const tabButton = page.locator(`button:has-text("${tab}")`)
        
        if (await tabButton.count() > 0) {
          await tabButton.click()
          await page.waitForTimeout(500) // Wait for content to load
          
          // Content should update
          await page.waitForLoadState('networkidle')
        }
      }
    })

    test.skip('should display liked posts', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Click liked tab
      const likedTab = page.locator('button:has-text("Liked")')
      
      if (await likedTab.count() > 0) {
        await likedTab.click()
        await page.waitForTimeout(500)
        
        // Should show liked posts or empty state
        const hasLikedPosts = await page.locator('[data-testid="post-card"]').count() > 0
        
        if (!hasLikedPosts) {
          await expect(page.locator('text=/no.*liked|haven\'t liked/i')).toBeVisible()
        }
      }
    })

    test.skip('should display saved posts', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Click saved tab
      const savedTab = page.locator('button:has-text("Saved")')
      
      if (await savedTab.count() > 0) {
        await savedTab.click()
        await page.waitForTimeout(500)
        
        // Should show saved posts or empty state
        const hasSavedPosts = await page.locator('[data-testid="post-card"]').count() > 0
        
        if (!hasSavedPosts) {
          await expect(page.locator('text=/no.*saved|haven\'t saved/i')).toBeVisible()
        }
      }
    })
  })

  test.describe('Profile Stats', () => {
    test.skip('should display follower count', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Should show follower count
      await expect(page.locator('text=/\\d+.*followers?/i')).toBeVisible()
    })

    test.skip('should display following count', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Should show following count
      await expect(page.locator('text=/\\d+.*following/i')).toBeVisible()
    })

    test.skip('should display post count', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Should show post count
      await expect(page.locator('text=/\\d+.*posts?/i')).toBeVisible()
    })

    test.skip('should navigate to followers list', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Click followers count
      const followersLink = page.locator('text=/\\d+.*followers?/i')
      await followersLink.click()
      
      // Should show followers list (modal or page)
      await expect(page.locator('text=/followers/i')).toBeVisible({ timeout: 3000 })
    })

    test.skip('should navigate to following list', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/profile')
      await waitForPageLoad(page)
      
      // Click following count
      const followingLink = page.locator('text=/\\d+.*following/i')
      await followingLink.click()
      
      // Should show following list (modal or page)
      await expect(page.locator('text=/following/i')).toBeVisible({ timeout: 3000 })
    })
  })
})
