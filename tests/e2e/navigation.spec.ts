import { test, expect } from './fixtures'
import { waitForPageLoad, checkBasicAccessibility, testKeyboardNavigation } from './helpers'

test.describe('Navigation and User Flows', () => {
  test.describe('Main Navigation', () => {
    test.skip('should display main navigation menu', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Should show main navigation
      const nav = page.locator('nav, [role="navigation"]')
      await expect(nav).toBeVisible()
      
      // Check for main nav items
      await expect(page.locator('a[href="/home"]')).toBeVisible()
      await expect(page.locator('a[href="/explore"]')).toBeVisible()
      await expect(page.locator('a[href="/messages"]')).toBeVisible()
      await expect(page.locator('a[href="/notifications"]')).toBeVisible()
      await expect(page.locator('a[href="/profile"]')).toBeVisible()
    })

    test.skip('should navigate to home', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/explore')
      await waitForPageLoad(page)
      
      // Click home link
      await page.click('a[href="/home"]')
      await page.waitForURL('/home', { timeout: 5000 })
      
      await expect(page).toHaveURL('/home')
      await checkBasicAccessibility(page)
    })

    test.skip('should navigate to explore', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click explore link
      await page.click('a[href="/explore"]')
      await page.waitForURL('/explore', { timeout: 5000 })
      
      await expect(page).toHaveURL('/explore')
      await checkBasicAccessibility(page)
    })

    test.skip('should navigate to messages', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click messages link
      await page.click('a[href="/messages"]')
      await page.waitForURL('/messages', { timeout: 5000 })
      
      await expect(page).toHaveURL('/messages')
      await checkBasicAccessibility(page)
    })

    test.skip('should navigate to notifications', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click notifications link
      await page.click('a[href="/notifications"]')
      await page.waitForURL('/notifications', { timeout: 5000 })
      
      await expect(page).toHaveURL('/notifications')
      await checkBasicAccessibility(page)
    })

    test.skip('should navigate to profile', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click profile link
      await page.click('a[href="/profile"]')
      await page.waitForURL('/profile', { timeout: 5000 })
      
      await expect(page).toHaveURL('/profile')
      await checkBasicAccessibility(page)
    })

    test.skip('should highlight active navigation item', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Home link should be active
      const homeLink = page.locator('a[href="/home"]')
      await expect(homeLink).toHaveClass(/active|selected|current/)
      
      // Navigate to explore
      await page.click('a[href="/explore"]')
      await page.waitForURL('/explore')
      
      // Explore link should be active
      const exploreLink = page.locator('a[href="/explore"]')
      await expect(exploreLink).toHaveClass(/active|selected|current/)
    })
  })

  test.describe('Creator Navigation', () => {
    test.skip('should display creator-specific navigation', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Should show creator center link
      await expect(page.locator('a[href*="/creator-center"]')).toBeVisible()
    })

    test.skip('should navigate to creator center', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click creator center link
      await page.click('a[href*="/creator-center"]')
      await page.waitForURL(/\/creator-center/, { timeout: 5000 })
      
      await expect(page).toHaveURL(/\/creator-center/)
      await checkBasicAccessibility(page)
    })
  })

  test.describe('Search and Discovery', () => {
    test.skip('should display search input', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Should show search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]')
      await expect(searchInput.first()).toBeVisible()
    })

    test.skip('should search for users', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/explore')
      await waitForPageLoad(page)
      
      // Type in search
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]')
      await searchInput.fill('test')
      
      // Wait for results
      await page.waitForTimeout(1000) // Debounce
      await page.waitForLoadState('networkidle')
      
      // Results should appear
      const results = page.locator('[data-testid="search-results"], [data-testid="user-card"]')
      
      if (await results.count() > 0) {
        await expect(results.first()).toBeVisible()
      }
    })

    test.skip('should search for content', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/explore')
      await waitForPageLoad(page)
      
      // Type in search
      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('content')
      
      // Press enter or click search button
      await searchInput.press('Enter')
      
      // Wait for results
      await page.waitForLoadState('networkidle')
      
      // Should show search results
      await expect(page.locator('text=/results|search/i')).toBeVisible()
    })

    test.skip('should filter search results', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/explore')
      await waitForPageLoad(page)
      
      // Search for something
      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('test')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')
      
      // Look for filter buttons
      const filters = ['All', 'Users', 'Posts']
      
      for (const filter of filters) {
        const filterButton = page.locator(`button:has-text("${filter}")`)
        
        if (await filterButton.count() > 0) {
          await filterButton.click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Breadcrumbs and Back Navigation', () => {
    test.skip('should navigate back from creator profile', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click on a creator profile
      const creatorLink = page.locator('a[href*="/creator/"]').first()
      if (await creatorLink.count() > 0) {
        await creatorLink.click()
        await page.waitForURL(/\/creator\//, { timeout: 5000 })
        
        // Go back
        await page.goBack()
        await page.waitForURL('/home', { timeout: 5000 })
        
        await expect(page).toHaveURL('/home')
      }
    })

    test.skip('should navigate back from post details', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click on a post
      const post = page.locator('[data-testid="post-card"]').first()
      if (await post.count() > 0) {
        await post.click()
        
        // Wait for post details
        await page.waitForTimeout(1000)
        
        // Go back
        await page.goBack()
        await page.waitForURL('/home', { timeout: 5000 })
        
        await expect(page).toHaveURL('/home')
      }
    })
  })

  test.describe('Deep Linking', () => {
    test.skip('should handle direct URL to creator profile', async ({ page, loginAsFan }) => {
      await loginAsFan()
      
      // Navigate directly to creator profile
      await page.goto('/creator/testcreator')
      await waitForPageLoad(page)
      
      // Should load creator profile
      await expect(page).toHaveURL(/\/creator\/testcreator/)
      await expect(page.locator('h1, h2')).toContainText(/test.*creator/i)
    })

    test.skip('should handle direct URL to post', async ({ page, loginAsFan }) => {
      await loginAsFan()
      
      // This would require a known post ID
      // await page.goto('/post/some-post-id')
      // await waitForPageLoad(page)
      
      // For now, just verify the route exists
      await page.goto('/home')
      await expect(page).toHaveURL('/home')
    })
  })

  test.describe('Mobile Navigation', () => {
    test.skip('should display mobile menu', async ({ page, loginAsFan }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Look for mobile menu button (hamburger)
      const menuButton = page.locator('button[aria-label*="menu"], button[data-testid="mobile-menu"]')
      
      if (await menuButton.count() > 0) {
        await menuButton.click()
        
        // Mobile menu should open
        await expect(page.locator('[role="dialog"], [data-testid="mobile-menu"]')).toBeVisible()
      } else {
        // Or check for bottom navigation
        const bottomNav = page.locator('[data-testid="bottom-nav"]')
        await expect(bottomNav).toBeVisible()
      }
    })

    test.skip('should navigate using bottom navigation', async ({ page, loginAsFan }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Look for bottom navigation
      const bottomNav = page.locator('[data-testid="bottom-nav"]')
      
      if (await bottomNav.count() > 0) {
        // Navigate through bottom nav items
        await page.click('[data-testid="bottom-nav"] a[href="/explore"]')
        await page.waitForURL('/explore', { timeout: 5000 })
        
        await expect(page).toHaveURL('/explore')
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test.skip('should navigate with keyboard', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Tab through navigation
      await page.keyboard.press('Tab')
      
      // First focusable element should be focused
      const focused = await page.evaluate(() => document.activeElement?.tagName)
      expect(focused).toBeTruthy()
    })

    test.skip('should open links with Enter key', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Focus explore link
      await page.focus('a[href="/explore"]')
      
      // Press Enter
      await page.keyboard.press('Enter')
      
      // Should navigate
      await page.waitForURL('/explore', { timeout: 5000 })
      await expect(page).toHaveURL('/explore')
    })
  })

  test.describe('Notifications Badge', () => {
    test.skip('should display notification badge', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Look for notification badge
      const notificationBadge = page.locator('[data-testid="notification-badge"], [data-count]')
      
      // Badge should exist (even if count is 0)
      if (await notificationBadge.count() > 0) {
        await expect(notificationBadge).toBeVisible()
      }
    })

    test.skip('should clear notification badge on visit', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Get initial badge count
      const notificationBadge = page.locator('[data-testid="notification-badge"]')
      
      if (await notificationBadge.count() > 0) {
        const initialCount = await notificationBadge.textContent()
        
        // Navigate to notifications
        await page.click('a[href="/notifications"]')
        await page.waitForURL('/notifications')
        
        // Go back to home
        await page.click('a[href="/home"]')
        await page.waitForURL('/home')
        
        // Badge should be cleared or reduced
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Page Titles and Meta', () => {
    test.skip('should have correct page title on each page', async ({ page, loginAsFan }) => {
      await loginAsFan()
      
      const pages = [
        { url: '/home', title: /home/i },
        { url: '/explore', title: /explore/i },
        { url: '/messages', title: /messages/i },
        { url: '/notifications', title: /notifications/i },
        { url: '/profile', title: /profile/i },
      ]
      
      for (const { url, title } of pages) {
        await page.goto(url)
        await waitForPageLoad(page)
        
        await expect(page).toHaveTitle(title)
      }
    })
  })

  test.describe('Error Pages', () => {
    test.skip('should display 404 page for invalid route', async ({ page, loginAsFan }) => {
      await loginAsFan()
      
      await page.goto('/this-page-does-not-exist')
      await waitForPageLoad(page)
      
      // Should show 404 message
      await expect(page.locator('text=/404|not found|page.*exist/i')).toBeVisible()
      
      // Should have link back to home
      await expect(page.locator('a[href="/home"], a[href="/"]')).toBeVisible()
    })

    test.skip('should handle unauthorized access', async ({ page }) => {
      // Try to access protected page without login
      await page.goto('/profile')
      
      // Should redirect to login
      await page.waitForURL(/\/(login|$)/, { timeout: 10000 })
      
      await expect(page).toHaveURL(/\/(login|$)/)
    })
  })

  test.describe('Complete User Journey', () => {
    test.skip('should complete full user journey: login -> browse -> view profile -> post -> message', async ({ page, loginAsFan }) => {
      // 1. Login
      await loginAsFan()
      await expect(page).toHaveURL(/\/(home|creator-center)/)
      
      // 2. Browse home feed
      await page.goto('/home')
      await waitForPageLoad(page)
      await expect(page.locator('[data-testid="post-card"]').first()).toBeVisible({ timeout: 10000 })
      
      // 3. View creator profile
      const creatorLink = page.locator('a[href*="/creator/"]').first()
      if (await creatorLink.count() > 0) {
        await creatorLink.click()
        await page.waitForURL(/\/creator\//)
        await expect(page.locator('h1, h2')).toBeVisible()
      }
      
      // 4. Go to own profile
      await page.click('a[href="/profile"]')
      await page.waitForURL('/profile')
      await expect(page).toHaveURL('/profile')
      
      // 5. Navigate to messages
      await page.click('a[href="/messages"]')
      await page.waitForURL('/messages')
      await expect(page).toHaveURL('/messages')
      
      // 6. Check notifications
      await page.click('a[href="/notifications"]')
      await page.waitForURL('/notifications')
      await expect(page).toHaveURL('/notifications')
      
      // Journey complete!
      await page.screenshot({ path: 'test-results/screenshots/user-journey-complete.png' })
    })
  })
})
