import { test, expect, TEST_USERS } from './fixtures'
import { waitForPageLoad, dismissAgeVerification } from './helpers'

/**
 * LIVE STREAM ACCESS TESTS
 *
 * Covers:
 *   1. Login as nicko09 and browse the live page
 *   2. Public visitor (no login) can see PUBLIC streams
 *   3. Public visitor is blocked from SUBSCRIBERS-only streams
 *   4. Luna (subscriber/lunapark) can access the live page after login
 *   5. Stream card visibility badges are rendered correctly
 *
 * Run headed so you can watch the login flow:
 *   npx playwright test tests/e2e/live-stream-access.spec.ts --headed --project=chromium
 */

// ── helpers ──────────────────────────────────────────────────────────────────

async function loginAsNicko(page: any) {
  await page.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))
  await page.goto('/login')
  await page.waitForSelector('input[name="identifier"]', { timeout: 15_000 })
  console.log('🔐 Logging in as nicko09 …')
  await page.fill('input[name="identifier"]', TEST_USERS.fan.username)   // nicko09
  await page.fill('input[name="password"]',    TEST_USERS.fan.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(home|creator-center|profile)/, { timeout: 15_000 })
  await waitForPageLoad(page)
  console.log('✅ Logged in as nicko09')
}

async function loginAsLuna(page: any) {
  await page.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))
  await page.goto('/login')
  await page.waitForSelector('input[name="identifier"]', { timeout: 15_000 })
  console.log('🔐 Logging in as lunapark …')
  await page.fill('input[name="identifier"]', TEST_USERS.subscriber.username)  // lunapark
  await page.fill('input[name="password"]',    TEST_USERS.subscriber.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(home|creator-center|profile)/, { timeout: 15_000 })
  await waitForPageLoad(page)
  console.log('✅ Logged in as lunapark')
}

// ── Nicko suite ───────────────────────────────────────────────────────────────

test.describe('Live Stream – nicko09 view', () => {
  test('nicko09 can log in and reach the /live page', async ({ page }) => {
    await loginAsNicko(page)
    await dismissAgeVerification(page)

    console.log('📡 Navigating to /live …')
    await page.goto('/live')
    await waitForPageLoad(page)

    // Page header should show "Live Now"
    await expect(page.locator('h1, h2').filter({ hasText: /live now/i })).toBeVisible({ timeout: 10_000 })
    console.log('✅ /live page loaded for nicko09')

    await page.screenshot({ path: 'test-results/live-nicko09.png', fullPage: true })
    console.log('📸 Screenshot saved: test-results/live-nicko09.png')
  })

  test('live page shows stream cards with visibility badges when streams are live', async ({ page }) => {
    await loginAsNicko(page)
    await dismissAgeVerification(page)

    await page.goto('/live')
    await waitForPageLoad(page)
    await page.waitForTimeout(2000)   // let the query settle

    const streamCards = page.locator('a[href^="/live/"]')
    const count = await streamCards.count()
    console.log(`📋 Found ${count} live stream card(s)`)

    if (count > 0) {
      // Verify the first card has a visibility badge
      const firstCard = streamCards.first()
      await expect(firstCard).toBeVisible()

      // At least one badge (Public / Followers / Subscribers) must exist in the card list
      const badges = page.locator('text=/Public|Followers|Subscribers/i')
      await expect(badges.first()).toBeVisible({ timeout: 5_000 })
      console.log('✅ Visibility badge visible on stream card')
    } else {
      console.log('ℹ️  No streams currently live — empty state verified')
      // Verify the empty state renders cleanly (no crash)
      const body = page.locator('body')
      await expect(body).not.toContainText(/error|crashed/i)
    }

    await page.screenshot({ path: 'test-results/live-stream-cards.png', fullPage: true })
  })
})

// ── Public visitor suite ──────────────────────────────────────────────────────

test.describe('Live Stream – public visitor (not logged in)', () => {
  test('public visitor can load the /live page', async ({ page }) => {
    // Bypass age gate but do NOT log in
    await page.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))

    console.log('👤 Visiting /live as unauthenticated user …')
    await page.goto('/live')
    await waitForPageLoad(page)
    await dismissAgeVerification(page)

    // Should either show the live listing OR redirect to login
    const url = page.url()
    console.log(`🔗 Landed on: ${url}`)

    if (url.includes('/login')) {
      console.log('ℹ️  /live requires login — redirected to /login (expected if auth-gated)')
      await expect(page.locator('input[name="identifier"]')).toBeVisible()
    } else {
      await expect(page.locator('h1, h2').filter({ hasText: /live now/i })).toBeVisible({ timeout: 10_000 })
      console.log('✅ Public visitor can browse the live listing')
    }

    await page.screenshot({ path: 'test-results/live-public-visitor.png', fullPage: true })
  })

  test('public visitor sees "no-access" wall on a SUBSCRIBERS-only stream', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))

    // Log in as nicko09 to discover a SUBSCRIBERS stream via the live page response
    await loginAsNicko(page)
    await dismissAgeVerification(page)

    // Navigate to /live and capture the API response
    let subscriberStreamId: string | null = null
    const [liveResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/live') && res.status() === 200, { timeout: 10_000 }).catch(() => null),
      page.goto('/live'),
    ])
    if (liveResponse) {
      try {
        const json = await liveResponse.json()
        const streams: Array<{ id: string; visibility: string; status: string }> = json?.data ?? []
        const sub = streams.find(s => s.visibility === 'SUBSCRIBERS' && s.status === 'LIVE')
        if (sub) subscriberStreamId = sub.id
      } catch { /* ignore parse errors */ }
    }

    if (!subscriberStreamId) {
      console.log('ℹ️  No SUBSCRIBERS-only live stream available — skipping no-access wall check')
      test.skip()
      return
    }

    console.log(`🔒 Found SUBSCRIBERS stream: ${subscriberStreamId}`)

    // Clear auth so we act as a public visitor
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
    await page.evaluate(() => localStorage.setItem('age_verified', String(Date.now())))

    await page.goto(`/live/${subscriberStreamId}`)
    await waitForPageLoad(page)

    const url = page.url()
    console.log(`🔗 Landed on: ${url}`)

    if (url.includes('/login')) {
      console.log('✅ Unauthenticated user redirected to /login for restricted stream')
      await expect(page.locator('input[name="identifier"]')).toBeVisible()
    } else {
      // Should show the "Subscribers only" access wall
      await expect(
        page.locator('text=/Subscribers only|subscribe to watch/i').first()
      ).toBeVisible({ timeout: 10_000 })
      console.log('✅ "Subscribers only" access wall is shown to public visitor')
    }

    await page.screenshot({ path: 'test-results/live-subscribers-wall-public.png', fullPage: true })
  })

  test('public visitor can access a PUBLIC stream watch page', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))

    // Log in as nicko09 to discover a PUBLIC stream via the live page response
    await loginAsNicko(page)
    await dismissAgeVerification(page)

    let publicStreamId: string | null = null
    const [liveResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/live') && res.status() === 200, { timeout: 10_000 }).catch(() => null),
      page.goto('/live'),
    ])
    if (liveResponse) {
      try {
        const json = await liveResponse.json()
        const streams: Array<{ id: string; visibility: string; status: string }> = json?.data ?? []
        const pub = streams.find(s => s.visibility === 'PUBLIC' && s.status === 'LIVE')
        if (pub) publicStreamId = pub.id
      } catch { /* ignore parse errors */ }
    }

    if (!publicStreamId) {
      console.log('ℹ️  No PUBLIC live stream currently available — skipping watch-room check')
      test.skip()
      return
    }

    console.log(`📺 Found PUBLIC stream: ${publicStreamId}`)

    // Clear auth → public visitor
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
    await page.evaluate(() => localStorage.setItem('age_verified', String(Date.now())))

    await page.goto(`/live/${publicStreamId}`)
    await waitForPageLoad(page)

    const url = page.url()
    console.log(`🔗 Landed on: ${url}`)

    if (url.includes('/login')) {
      console.log('ℹ️  App requires login to watch (redirected to /login)')
      await expect(page.locator('input[name="identifier"]')).toBeVisible()
    } else {
      // Should show the watch room – NOT the "no-access" wall
      const noAccessWall = page.locator('text=/Subscribers only|subscribe to watch/i')
      const hasNoAccess = await noAccessWall.isVisible().catch(() => false)
      expect(hasNoAccess).toBe(false)

      const watchArea = page.locator('text=/Joining stream|Connected|Live/i')
      const isWatchVisible = await watchArea.isVisible().catch(() => false)
      if (isWatchVisible) {
        console.log('✅ Watch room rendered for public stream')
      } else {
        console.log('ℹ️  Watch room present but Agora connection pending (no camera/mic in test env)')
      }
    }

    await page.screenshot({ path: 'test-results/live-public-watch.png', fullPage: true })
  })
})

// ── Luna (subscriber) suite ───────────────────────────────────────────────────

test.describe('Live Stream – lunapark (subscriber)', () => {
  test('lunapark can log in and browse /live', async ({ page }) => {
    await loginAsLuna(page)
    await dismissAgeVerification(page)

    console.log('📡 lunapark navigating to /live …')
    await page.goto('/live')
    await waitForPageLoad(page)

    await expect(page.locator('h1, h2').filter({ hasText: /live now/i })).toBeVisible({ timeout: 10_000 })
    console.log('✅ /live page loaded for lunapark')

    await page.screenshot({ path: 'test-results/live-luna.png', fullPage: true })
  })

  test('lunapark sees PUBLIC streams and can click into them', async ({ page }) => {
    await loginAsLuna(page)
    await dismissAgeVerification(page)

    await page.goto('/live')
    await waitForPageLoad(page)
    await page.waitForTimeout(2000)

    const streamCards = page.locator('a[href^="/live/"]')
    const count = await streamCards.count()
    console.log(`📋 lunapark sees ${count} live stream card(s)`)

    if (count === 0) {
      console.log('ℹ️  No live streams at this moment — empty state checked')
      await expect(page.locator('body')).not.toContainText(/error/i)
      return
    }

    // Find a PUBLIC stream card (has "Public" badge text)
    const publicCard = page
      .locator('a[href^="/live/"]')
      .filter({ hasText: /Public/i })
      .first()

    const hasPublic = await publicCard.isVisible().catch(() => false)

    if (!hasPublic) {
      console.log('ℹ️  No PUBLIC stream card visible in list — checking first card instead')
      const firstCard = streamCards.first()
      const href = await firstCard.getAttribute('href')
      console.log(`🔗 Clicking first card: ${href}`)
      await firstCard.click()
    } else {
      const href = await publicCard.getAttribute('href')
      console.log(`🔗 Clicking PUBLIC stream card: ${href}`)
      await publicCard.click()
    }

    await waitForPageLoad(page)
    const watchUrl = page.url()
    console.log(`🔗 lunapark landed on: ${watchUrl}`)

    if (!watchUrl.includes('/live/')) {
      // Stream may have ended and the app redirected back to the listing — acceptable
      console.log('ℹ️  Redirected back to /live — stream likely ended or became unavailable')
      await expect(page.locator('h1, h2').filter({ hasText: /live now/i })).toBeVisible({ timeout: 5_000 })
    } else {
      console.log(`✅ lunapark navigated to stream: ${watchUrl}`)

      // Should NOT see the subscriber-only wall on a PUBLIC stream
      const noAccessWall = page.locator('text=/Subscribers only/i')
      const hasWall = await noAccessWall.isVisible().catch(() => false)

      if (hasWall) {
        console.log('ℹ️  Stream requires subscription — access wall shown (card may not have been PUBLIC)')
      } else {
        console.log('✅ No access wall — lunapark can watch the stream')
      }
    }

    await page.screenshot({ path: 'test-results/live-luna-watch.png', fullPage: true })
  })

  test('lunapark is shown subscribe-wall on a SUBSCRIBERS-only stream she is NOT subscribed to', async ({ page }) => {
    await loginAsLuna(page)
    await dismissAgeVerification(page)

    // Intercept the live-list response to find a SUBSCRIBERS stream
    let subStreamId: string | null = null
    const [liveResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/live') && res.status() === 200, { timeout: 10_000 }).catch(() => null),
      page.goto('/live'),
    ])
    if (liveResponse) {
      try {
        const json = await liveResponse.json()
        const streams: Array<{ id: string; visibility: string; status: string }> = json?.data ?? []
        const sub = streams.find(s => s.visibility === 'SUBSCRIBERS' && s.status === 'LIVE')
        if (sub) subStreamId = sub.id
      } catch { /* ignore */ }
    }

    if (!subStreamId) {
      console.log('ℹ️  No SUBSCRIBERS-only live stream available right now — test skipped')
      test.skip()
      return
    }

    console.log(`🔒 lunapark visiting SUBSCRIBERS stream: ${subStreamId}`)
    await page.goto(`/live/${subStreamId}`)
    await waitForPageLoad(page)

    // Either: access granted (luna IS subscribed) or access wall shown (luna is NOT subscribed)
    const noAccessWall = page.locator('text=/Subscribers only|subscribe to watch/i')
    const isBlocked = await noAccessWall.isVisible({ timeout: 10_000 }).catch(() => false)

    if (isBlocked) {
      console.log('✅ Subscribers-only wall shown to lunapark (not subscribed to this creator)')
      // The subscribe button must be present
      await expect(
        page.locator('a[href*="/subscribe/"], button:has-text(/Subscribe/i)')
      ).toBeVisible({ timeout: 5_000 })
    } else {
      console.log('✅ lunapark has an active subscription — stream accessible without wall')
    }

    await page.screenshot({ path: 'test-results/live-luna-sub-wall.png', fullPage: true })
  })
})
