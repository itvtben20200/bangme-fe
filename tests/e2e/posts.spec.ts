import { test, expect } from './fixtures'
import { waitForPageLoad, waitForToast, uploadFile, waitForApiResponse } from './helpers'

test.describe('Post Features', () => {
  test.describe('Create Post (Creator)', () => {
    test.skip('should open create post modal', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await waitForPageLoad(page)
      
      // Click create post button
      const createButton = page.locator('button:has-text("Create Post"), button:has-text("New Post")')
      await expect(createButton.first()).toBeVisible()
      await createButton.first().click()
      
      // Modal should open
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('textarea[placeholder*="What"], textarea[name*="content"]')).toBeVisible()
    })

    test.skip('should create text-only post', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await waitForPageLoad(page)
      
      // Open create post modal
      await page.click('button:has-text("Create Post"), button:has-text("New Post")')
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      
      // Fill in post content
      const postContent = `Test post ${Date.now()}`
      await page.fill('textarea[placeholder*="What"], textarea[name*="content"]', postContent)
      
      // Submit post
      await page.click('button[type="submit"]:has-text("Post"), button:has-text("Publish")')
      
      // Wait for success
      await waitForToast(page)
      
      // Modal should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
      
      // Post should appear in feed
      await expect(page.locator(`text="${postContent}"`)).toBeVisible({ timeout: 10000 })
    })

    test.skip('should create post with image', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await waitForPageLoad(page)
      
      // Open create post modal
      await page.click('button:has-text("Create Post"), button:has-text("New Post")')
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      
      // Fill in post content
      const postContent = `Test post with image ${Date.now()}`
      await page.fill('textarea[placeholder*="What"], textarea[name*="content"]', postContent)
      
      // Upload image
      const fileInput = page.locator('input[type="file"][accept*="image"]')
      await fileInput.setInputFiles('tests/fixtures/test-image.jpg')
      
      // Wait for image preview
      await expect(page.locator('img[alt*="preview"], img[src*="blob:"]')).toBeVisible({ timeout: 5000 })
      
      // Submit post
      await page.click('button[type="submit"]:has-text("Post"), button:has-text("Publish")')
      
      // Wait for success
      await waitForToast(page)
      
      // Post should appear in feed with image
      await expect(page.locator(`text="${postContent}"`)).toBeVisible({ timeout: 10000 })
    })

    test.skip('should create post with video', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await waitForPageLoad(page)
      
      // Open create post modal
      await page.click('button:has-text("Create Post"), button:has-text("New Post")')
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      
      // Fill in post content
      const postContent = `Test post with video ${Date.now()}`
      await page.fill('textarea[placeholder*="What"], textarea[name*="content"]', postContent)
      
      // Upload video
      const fileInput = page.locator('input[type="file"][accept*="video"]')
      await fileInput.setInputFiles('tests/fixtures/test-video.mp4')
      
      // Wait for video preview
      await expect(page.locator('video, [data-video-preview]')).toBeVisible({ timeout: 5000 })
      
      // Submit post
      await page.click('button[type="submit"]:has-text("Post"), button:has-text("Publish")')
      
      // Wait for success
      await waitForToast(page)
      
      // Post should appear in feed
      await expect(page.locator(`text="${postContent}"`)).toBeVisible({ timeout: 10000 })
    })

    test.skip('should set post visibility (free/paid)', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await waitForPageLoad(page)
      
      // Open create post modal
      await page.click('button:has-text("Create Post"), button:has-text("New Post")')
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      
      // Fill in post content
      await page.fill('textarea[placeholder*="What"], textarea[name*="content"]', 'Paid content post')
      
      // Select paid/subscriber-only
      const visibilitySelector = page.locator('select[name*="visibility"], button:has-text("Visibility")')
      if (await visibilitySelector.count() > 0) {
        await visibilitySelector.first().click()
        await page.click('text=/subscriber|paid|exclusive/i')
      }
      
      // Submit post
      await page.click('button[type="submit"]:has-text("Post"), button:has-text("Publish")')
      
      // Wait for success
      await waitForToast(page)
    })

    test.skip('should validate post content not empty', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await waitForPageLoad(page)
      
      // Open create post modal
      await page.click('button:has-text("Create Post"), button:has-text("New Post")')
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      
      // Try to submit without content
      await page.click('button[type="submit"]:has-text("Post"), button:has-text("Publish")')
      
      // Should show error
      await expect(page.locator('text=/content.*required|cannot be empty/i')).toBeVisible()
    })

    test.skip('should cancel post creation', async ({ page, loginAsCreator }) => {
      await loginAsCreator()
      await waitForPageLoad(page)
      
      // Open create post modal
      await page.click('button:has-text("Create Post"), button:has-text("New Post")')
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      
      // Fill some content
      await page.fill('textarea[placeholder*="What"], textarea[name*="content"]', 'This will be cancelled')
      
      // Click cancel
      await page.click('button:has-text("Cancel")')
      
      // Modal should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })
  })

  test.describe('View and Interact with Posts', () => {
    test.skip('should display posts in feed', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Should show posts
      const posts = page.locator('[data-testid="post-card"], article')
      await expect(posts.first()).toBeVisible({ timeout: 10000 })
    })

    test.skip('should like a post', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Find first post's like button
      const likeButton = page.locator('[data-testid="like-button"], button[aria-label*="like"]').first()
      await expect(likeButton).toBeVisible()
      
      // Get initial like count
      const likeCountText = await page.locator('[data-testid="like-count"]').first().textContent()
      const initialCount = parseInt(likeCountText || '0')
      
      // Click like
      await likeButton.click()
      
      // Wait for API response
      await waitForApiResponse(page, '/posts', 'POST')
      
      // Like count should increase
      await expect(page.locator('[data-testid="like-count"]').first()).toContainText(`${initialCount + 1}`)
    })

    test.skip('should unlike a post', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Like a post first
      const likeButton = page.locator('[data-testid="like-button"]').first()
      await likeButton.click()
      await page.waitForTimeout(1000)
      
      // Get like count
      const likeCountText = await page.locator('[data-testid="like-count"]').first().textContent()
      const currentCount = parseInt(likeCountText || '0')
      
      // Click unlike
      await likeButton.click()
      
      // Like count should decrease
      await expect(page.locator('[data-testid="like-count"]').first()).toContainText(`${currentCount - 1}`)
    })

    test.skip('should comment on a post', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click on a post to open details
      await page.locator('[data-testid="post-card"]').first().click()
      
      // Fill comment
      const commentText = `Test comment ${Date.now()}`
      await page.fill('textarea[placeholder*="comment"], input[placeholder*="comment"]', commentText)
      
      // Submit comment
      await page.click('button:has-text("Comment"), button:has-text("Post")')
      
      // Wait for comment to appear
      await expect(page.locator(`text="${commentText}"`)).toBeVisible({ timeout: 5000 })
    })

    test.skip('should share a post', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click share button
      await page.locator('[data-testid="share-button"], button[aria-label*="share"]').first().click()
      
      // Share menu should open
      await expect(page.locator('[role="menu"], [data-testid="share-menu"]')).toBeVisible()
    })

    test.skip('should report a post', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/home')
      await waitForPageLoad(page)
      
      // Click post menu
      await page.locator('[data-testid="post-menu"], button[aria-label*="more"]').first().click()
      
      // Click report
      await page.click('text=/report/i')
      
      // Report dialog should open
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('text=/report.*post/i')).toBeVisible()
    })
  })

  test.describe('Creator Profile Posts', () => {
    test.skip('should view creator profile and posts', async ({ page, loginAsFan }) => {
      await loginAsFan()
      
      // Navigate to a creator profile
      await page.goto('/creator/testcreator')
      await waitForPageLoad(page)
      
      // Should show creator info
      await expect(page.locator('h1, h2')).toContainText(/test.*creator/i)
      
      // Should show creator's posts
      await expect(page.locator('[data-testid="post-card"]').first()).toBeVisible({ timeout: 10000 })
    })

    test.skip('should filter posts by type', async ({ page, loginAsFan }) => {
      await loginAsFan()
      await page.goto('/creator/testcreator')
      await waitForPageLoad(page)
      
      // Click filter tabs
      const filters = ['All', 'Images', 'Videos']
      
      for (const filter of filters) {
        await page.click(`button:has-text("${filter}")`)
        await page.waitForTimeout(500)
        
        // Posts should update
        await expect(page.locator('[data-testid="post-card"]').first()).toBeVisible()
      }
    })
  })
})
