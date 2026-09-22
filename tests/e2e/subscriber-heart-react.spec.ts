import { test, expect, TEST_USERS } from './fixtures'
import { waitForPageLoad, dismissAgeVerification } from './helpers'

/**
 * Tests subscriber (lunapark) login and heart/like reaction
 * on nicko09's post found in the home feed dashboard.
 *
 * PostCard DOM structure (relevant part):
 *   <div class="bg-[#1a1a1a] rounded-lg ...">        ← PostCard root
 *     <div class="p-4 ...">
 *       <span>@nicko09 · ...</span>                  ← username span
 *     </div>
 *     <div class="p-4 space-y-2">
 *       <button>                                      ← likeButton
 *         <svg class="lucide lucide-heart ..." />     ← heartIcon
 *         <span>{likesCount}</span>                  ← countSpan (INSIDE button)
 *       </button>
 *     </div>
 *   </div>
 */

/** Locate the PostCard root div for a given creator username in the feed. */
function getPostCard(page: any, username: string) {
  return page
    .locator('[class*="bg-[#1a1a1a]"]')
    .filter({ hasText: `@${username}` })
    .filter({ has: page.locator('button:has(svg.lucide-heart)') })
    .first()
}

/** Log in as lunapark on any page object (fresh context safe). */
async function loginAsLuna(page: any) {
  await page.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))
  await page.goto('/login')
  await page.waitForSelector('input[name="identifier"]', { timeout: 15000 })
  await page.fill('input[name="identifier"]', TEST_USERS.subscriber.username)
  await page.fill('input[name="password"]', TEST_USERS.subscriber.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(home|creator-center|profile)/, { timeout: 15000 })
  await waitForPageLoad(page)
}

test.describe('Subscriber – Heart React on Creator Post', () => {

  test('should login as subscriber lunapark', async ({ page, loginAsSubscriber }) => {
    await loginAsSubscriber()
    await waitForPageLoad(page)
    await dismissAgeVerification(page)

    await expect(page).toHaveURL(/\/(home|creator-center|profile)/)
    await expect(page.locator('input[name="identifier"]')).not.toBeVisible()
  })

  test('should like nicko09\'s post from the home feed dashboard', async ({ page, loginAsSubscriber }) => {
    await loginAsSubscriber()
    await waitForPageLoad(page)
    await dismissAgeVerification(page)

    await page.goto('/home')
    await waitForPageLoad(page)

    const nickoPost = getPostCard(page, TEST_USERS.fan.username)
    await expect(nickoPost).toBeVisible({ timeout: 15000 })

    const likeButton = nickoPost.locator('button:has(svg.lucide-heart)').first()
    const countSpan  = likeButton.locator('span').first()
    const heartIcon  = likeButton.locator('svg.lucide-heart')

    await expect(likeButton).toBeVisible()

    const isAlreadyLiked = await heartIcon.evaluate(
      (el: Element) => el.classList.contains('fill-[#ff0618]')
    )
    if (isAlreadyLiked) {
      await likeButton.click()
      await page.waitForTimeout(1000)
    }

    // ── Like the post ──
    await likeButton.click()
    await expect(heartIcon).toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })

    // ── Unlike (clean-up) ──
    await likeButton.click()
    await expect(heartIcon).not.toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })
  })

  test('should toggle like on nicko09\'s post and verify count changes', async ({ page, loginAsSubscriber }) => {
    await loginAsSubscriber()
    await waitForPageLoad(page)
    await dismissAgeVerification(page)

    await page.goto('/home')
    await waitForPageLoad(page)

    const nickoPost = getPostCard(page, TEST_USERS.fan.username)
    await expect(nickoPost).toBeVisible({ timeout: 15000 })

    const likeButton = nickoPost.locator('button:has(svg.lucide-heart)').first()
    const countSpan  = likeButton.locator('span').first()
    const heartIcon  = likeButton.locator('svg.lucide-heart')

    const isLiked = await heartIcon.evaluate(
      (el: Element) => el.classList.contains('fill-[#ff0618]')
    )
    if (isLiked) {
      await likeButton.click()
      await page.waitForTimeout(1000)
    }

    const before = parseInt((await countSpan.textContent()) ?? '0', 10)

    // Like → count increments by 1
    await likeButton.click()
    await expect(countSpan).toHaveText(String(before + 1), { timeout: 8000 })
    await expect(heartIcon).toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })

    // Unlike → count returns to baseline
    await likeButton.click()
    await expect(countSpan).toHaveText(String(before), { timeout: 8000 })
    await expect(heartIcon).not.toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })
  })

  test('should persist heart reaction after page reload', async ({ page, loginAsSubscriber }) => {
    await loginAsSubscriber()
    await waitForPageLoad(page)
    await dismissAgeVerification(page)

    await page.goto('/home')
    await waitForPageLoad(page)

    const nickoPost = getPostCard(page, TEST_USERS.fan.username)
    await expect(nickoPost).toBeVisible({ timeout: 15000 })

    const likeButton = nickoPost.locator('button:has(svg.lucide-heart)').first()
    const heartIcon  = likeButton.locator('svg.lucide-heart')

    const isAlreadyLiked = await heartIcon.evaluate(
      (el: Element) => el.classList.contains('fill-[#ff0618]')
    )
    if (isAlreadyLiked) {
      await likeButton.click()
      await page.waitForTimeout(1000)
    }

    // Like and confirm
    await likeButton.click()
    await expect(heartIcon).toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })

    // Reload and re-check — server must return isLiked: true
    await page.reload()
    await waitForPageLoad(page)
    await dismissAgeVerification(page)

    const afterReload = getPostCard(page, TEST_USERS.fan.username)
    await expect(afterReload).toBeVisible({ timeout: 15000 })
    const heartAfterReload = afterReload.locator('button:has(svg.lucide-heart) svg.lucide-heart')
    await expect(heartAfterReload).toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })

    // Clean up
    await afterReload.locator('button:has(svg.lucide-heart)').first().click()
    await expect(heartAfterReload).not.toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })
  })

  /**
   * TRUE fresh-login persistence test.
   * Step 1 — Session A: like the post, close the browser context.
   * Step 2 — Session B: brand-new context, log in again, verify heart is still red.
   * Step 3 — Clean up: unlike.
   *
   * This is what the user sees when manually logging in after liking something.
   */
  test('should show heart reaction when logging in again from a fresh session', async ({ browser }) => {
    // ── Session A: like the post ──────────────────────────────────────────
    const contextA = await browser.newContext()
    const pageA    = await contextA.newPage()

    await loginAsLuna(pageA)
    await pageA.goto('/home')
    await waitForPageLoad(pageA)

    const postA      = getPostCard(pageA, TEST_USERS.fan.username)
    await expect(postA).toBeVisible({ timeout: 15000 })

    const likeButtonA = postA.locator('button:has(svg.lucide-heart)').first()
    const heartIconA  = likeButtonA.locator('svg.lucide-heart')

    // Ensure un-liked before we start
    const alreadyLiked = await heartIconA.evaluate(
      (el: Element) => el.classList.contains('fill-[#ff0618]')
    )
    if (alreadyLiked) {
      await likeButtonA.click()
      await pageA.waitForTimeout(1000)
    }

    // Like and wait for server confirmation
    await likeButtonA.click()
    await expect(heartIconA).toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })

    // Close Session A (simulates closing the browser / logging out)
    await contextA.close()

    // ── Session B: completely fresh login ─────────────────────────────────
    const contextB = await browser.newContext()
    const pageB    = await contextB.newPage()

    await loginAsLuna(pageB)
    await pageB.goto('/home')
    await waitForPageLoad(pageB)

    const postB      = getPostCard(pageB, TEST_USERS.fan.username)
    await expect(postB).toBeVisible({ timeout: 15000 })

    const likeButtonB = postB.locator('button:has(svg.lucide-heart)').first()
    const heartIconB  = likeButtonB.locator('svg.lucide-heart')

    // ✅ Heart must still be red — the like was saved on the server
    await expect(heartIconB).toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })

    // Clean up: unlike
    await likeButtonB.click()
    await expect(heartIconB).not.toHaveClass(/fill-\[#ff0618\]/, { timeout: 8000 })

    await contextB.close()
  })
})
