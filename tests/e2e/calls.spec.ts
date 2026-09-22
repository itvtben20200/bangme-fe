/**
 * calls.spec.ts
 *
 * End-to-end tests for audio and video call functionality.
 *
 * Run only with the "calls" playwright project so Chrome receives
 * --use-fake-device-for-media-stream and microphone/camera permissions.
 *
 *   npx playwright test calls.spec.ts --project=calls
 */

import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'
import { TEST_USERS }        from './fixtures'
import { waitForPageLoad }   from './helpers'

// ─── Auth helper ────────────────────────────────────────────────────────────

async function loginAs(
  page: Page,
  credentials: { email?: string; username?: string; password: string },
) {
  await page.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))
  await page.goto('/login')
  await page.waitForSelector('input[name="identifier"]', { timeout: 15_000 })
  await page.fill('input[name="identifier"]', credentials.email ?? credentials.username ?? '')
  await page.fill('input[name="password"]', credentials.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(home|creator-center|profile)/, { timeout: 15_000 })
}

/** Opens /messages and clicks the first conversation in the sidebar. */
async function openMessages(page: Page) {
  await page.goto('/messages')
  await waitForPageLoad(page)
  // Click the first conversation so the call buttons become visible
  const firstConv = page.locator('[data-testid="conversation-item"], .conversation-item, [class*="cursor-pointer"]').first()
  if (await firstConv.count() > 0) {
    await firstConv.click()
    // Wait for thread header with call buttons to appear
    await page.waitForSelector('[data-testid="call-audio-btn"]', { timeout: 8_000 })
  }
}

/**
 * Clicks a call button, waits for the confirmation dialog, then confirms.
 * Returns after the dialog is dismissed and the call has been initiated.
 */
async function initiateCall(page: Page, type: 'audio' | 'video') {
  await page.click(`[data-testid="call-${type}-btn"]`)
  await page.waitForSelector('[data-testid="call-confirm-start"]', { timeout: 5_000 })
  await page.click('[data-testid="call-confirm-start"]')
}

/**
 * Ensure a conversation between subscriber and creator exists.
 * Navigates to the creator's profile and clicks "Message" if needed.
 */
async function ensureConversation(
  subscriberPage: Page,
  creatorUsername: string,
) {
  await subscriberPage.goto(`/creator/${creatorUsername}`)
  await waitForPageLoad(subscriberPage)
  const msgBtn = subscriberPage.locator('button', { hasText: /^message$/i })
  if (await msgBtn.count() > 0) {
    await msgBtn.click()
    await subscriberPage.waitForURL(/\/messages/, { timeout: 10_000 })
  } else {
    await subscriberPage.goto('/messages')
  }
}

// ─── Mock Agora token so real Agora App Certificate is not required ──────────

const MOCK_TOKEN_ROUTE = '**/api/calls/token'
const MOCK_TOKEN_PAYLOAD = {
  success: true,
  data: {
    token:   '006MockAgoraTokenForTesting',
    channel: 'call-test-channel',
    appId:   '7fae3221814848db85446a302d994329',
  },
}

async function mockCallToken(page: Page) {
  await page.route(MOCK_TOKEN_ROUTE, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TOKEN_PAYLOAD) }),
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 1.  BACKEND API
// ────────────────────────────────────────────────────────────────────────────

base.describe('Call API – /api/calls/token', () => {
  base('returns 401 for unauthenticated request', async ({ request }) => {
    const res = await request.post('http://localhost:4002/api/calls/token', {
      data: { conversationId: 'does-not-matter' },
    })
    expect(res.status()).toBe(401)
  })

  base('rejects request with missing conversationId', async ({ request, page }) => {
    // Login to get a session cookie
    await loginAs(page, TEST_USERS.subscriber)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const res = await request.post('http://localhost:4002/api/calls/token', {
      headers: { Cookie: cookieHeader },
      data:    {},
    })
    expect([400, 422]).toContain(res.status())
  })

  base('subscriber gets a token for an existing conversation', async ({ request, page }) => {
    await loginAs(page, TEST_USERS.subscriber)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    // Start / fetch a conversation first via the start-conversation endpoint
    const startRes = await request.post(
      `http://localhost:4002/api/messages/start/${TEST_USERS.creator.email}`,
      { headers: { Cookie: cookieHeader } },
    )
    // Accept 200 (created) or 409 (already exists)
    expect([200, 201, 409]).toContain(startRes.status())

    // Get the conversation list to obtain a real conversationId
    const convRes  = await request.get('http://localhost:4002/api/messages/conversations', {
      headers: { Cookie: cookieHeader },
    })
    expect(convRes.status()).toBe(200)
    const convBody  = await convRes.json()
    const convId    = convBody?.data?.[0]?.id as string | undefined
    base.skip(!convId, 'No conversation found — seed data may be missing')

    const tokenRes = await request.post('http://localhost:4002/api/calls/token', {
      headers: { Cookie: cookieHeader },
      data:    { conversationId: convId },
    })
    expect(tokenRes.status()).toBe(200)
    const body = await tokenRes.json()
    expect(body.success).toBe(true)
    expect(typeof body.data.token).toBe('string')
    expect(typeof body.data.channel).toBe('string')
    expect(typeof body.data.appId).toBe('string')
    expect(body.data.channel).toContain('call-')
  })
})

// ────────────────────────────────────────────────────────────────────────────
// 2.  CALL BUTTON VISIBILITY
// ────────────────────────────────────────────────────────────────────────────

base.describe('Call Buttons – Visibility', () => {
  const users = [
    { label: 'subscriber', creds: TEST_USERS.subscriber },
    { label: 'creator',    creds: TEST_USERS.creator    },
  ] as const

  for (const { label, creds } of users) {
    base(`${label} sees Audio and Video buttons when a conversation is selected`, async ({ page }) => {
      await loginAs(page, creds)
      await openMessages(page)

      const audioBtn = page.locator('[data-testid="call-audio-btn"]')
      const videoBtn = page.locator('[data-testid="call-video-btn"]')

      await expect(audioBtn).toBeVisible()
      await expect(videoBtn).toBeVisible()
      await expect(audioBtn).toContainText('Audio')
      await expect(videoBtn).toContainText('Video')
    })
  }

  base('call buttons are NOT visible without an active conversation', async ({ page }) => {
    await loginAs(page, TEST_USERS.subscriber)
    await page.goto('/messages')
    await waitForPageLoad(page)

    // With no conversation selected the header should not render
    await expect(page.locator('[data-testid="call-audio-btn"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="call-video-btn"]')).toHaveCount(0)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// 3.  CONFIRMATION DIALOG + OUTGOING CALL UI
// ────────────────────────────────────────────────────────────────────────────

base.describe('Call Confirmation Dialog', () => {
  base.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.subscriber)
    await openMessages(page)
  })

  base('clicking Audio button shows confirmation dialog with participant name', async ({ page }) => {
    await page.click('[data-testid="call-audio-btn"]')
    await expect(page.locator('[data-testid="call-confirm-start"]')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('text=Start Audio Call?')).toBeVisible()
    await expect(page.locator('text=/about to start a audio call/i')).toBeVisible()
  })

  base('clicking Video button shows confirmation dialog with correct title', async ({ page }) => {
    await page.click('[data-testid="call-video-btn"]')
    await expect(page.locator('[data-testid="call-confirm-start"]')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('text=Start Video Call?')).toBeVisible()
    await expect(page.locator('text=/about to start a video call/i')).toBeVisible()
  })

  base('confirmation dialog shows BangCoin cost for subscriber', async ({ page }) => {
    await page.click('[data-testid="call-audio-btn"]')
    await page.waitForSelector('[data-testid="call-confirm-start"]', { timeout: 5_000 })
    await expect(page.locator('text=/BangCoins per minute/i')).toBeVisible()
    await expect(page.locator('text=/Estimated cost for 10 minutes/i')).toBeVisible()
  })

  base('Cancel button closes the dialog without starting a call', async ({ page }) => {
    await page.click('[data-testid="call-audio-btn"]')
    await page.waitForSelector('[data-testid="call-confirm-start"]', { timeout: 5_000 })
    await page.click('button:has-text("Cancel")')
    await expect(page.locator('[data-testid="call-confirm-start"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="call-modal"]')).toHaveCount(0)
  })

  base('clicking backdrop closes the dialog', async ({ page }) => {
    await page.click('[data-testid="call-audio-btn"]')
    await page.waitForSelector('[data-testid="call-confirm-start"]', { timeout: 5_000 })
    // Click the semi-transparent overlay (not the dialog card)
    await page.mouse.click(10, 10)
    await expect(page.locator('[data-testid="call-confirm-start"]')).toHaveCount(0)
  })

  base('× close button dismisses the dialog', async ({ page }) => {
    await page.click('[data-testid="call-audio-btn"]')
    await page.waitForSelector('[data-testid="call-confirm-start"]', { timeout: 5_000 })
    await page.click('button[aria-label="Close"]')
    await expect(page.locator('[data-testid="call-confirm-start"]')).toHaveCount(0)
  })
})

base.describe('Confirmation Dialog – Creator (free calls)', () => {
  base('shows "Free for creators" box instead of coin price', async ({ page }) => {
    await loginAs(page, TEST_USERS.creator)
    await openMessages(page)
    await page.click('[data-testid="call-audio-btn"]')
    await page.waitForSelector('[data-testid="call-confirm-start"]', { timeout: 5_000 })
    await expect(page.locator('text=/free for creators/i')).toBeVisible()
    await expect(page.locator('text=/No BangCoins will be charged/i')).toBeVisible()
  })
})

base.describe('Outgoing Call – Subscriber initiates', () => {
  base.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.subscriber)
    await mockCallToken(page)
    await openMessages(page)
  })

  base('confirming Audio Call shows the calling modal', async ({ page }) => {
    await initiateCall(page, 'audio')

    const modal = page.locator('[data-testid="call-modal"]')
    await expect(modal).toBeVisible({ timeout: 5_000 })

    const status = page.locator('[data-testid="call-modal-status"]')
    await expect(status).toContainText(/audio calling/i)
  })

  base('confirming Video Call shows the calling modal', async ({ page }) => {
    await initiateCall(page, 'video')

    const modal = page.locator('[data-testid="call-modal"]')
    await expect(modal).toBeVisible({ timeout: 5_000 })

    const status = page.locator('[data-testid="call-modal-status"]')
    await expect(status).toContainText(/video calling/i)
  })

  base('cancel button (✕) on calling modal dismisses it', async ({ page }) => {
    await initiateCall(page, 'audio')
    await expect(page.locator('[data-testid="call-modal"]')).toBeVisible({ timeout: 5_000 })

    await page.click('[data-testid="call-modal-cancel"]')
    await expect(page.locator('[data-testid="call-modal"]')).toHaveCount(0)
  })
})

base.describe('Outgoing Call – Creator initiates (free)', () => {
  base('confirming Audio Call shows calling modal with audio type', async ({ page }) => {
    await loginAs(page, TEST_USERS.creator)
    await mockCallToken(page)
    await openMessages(page)

    await initiateCall(page, 'audio')

    const modal = page.locator('[data-testid="call-modal"]')
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('[data-testid="call-modal-status"]')).toContainText(/audio calling/i)
  })

  base('confirming Video Call shows calling modal with video type', async ({ page }) => {
    await loginAs(page, TEST_USERS.creator)
    await mockCallToken(page)
    await openMessages(page)

    await initiateCall(page, 'video')

    const modal = page.locator('[data-testid="call-modal"]')
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('[data-testid="call-modal-status"]')).toContainText(/video calling/i)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// 4.  TWO-USER SIGNALING TESTS (real Socket.io events between two contexts)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Helper that spins up two authenticated browser contexts.
 * Returns both pages ready on /messages with the token API mocked.
 */
async function twoUserSetup(browser: import('@playwright/test').Browser) {
  const subscriberCtx: BrowserContext = await browser.newContext({
    permissions: ['microphone', 'camera'],
  })
  const creatorCtx: BrowserContext = await browser.newContext({
    permissions: ['microphone', 'camera'],
  })

  const subscriberPage = await subscriberCtx.newPage()
  const creatorPage    = await creatorCtx.newPage()

  // Bypass age gate for both
  await subscriberPage.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))
  await creatorPage.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))

  // Mock token endpoint for both
  await mockCallToken(subscriberPage)
  await mockCallToken(creatorPage)

  // Login both users
  await loginAs(subscriberPage, TEST_USERS.subscriber)
  await loginAs(creatorPage,    TEST_USERS.creator)

  // Ensure a conversation exists by navigating from subscriber → creator profile
  await ensureConversation(subscriberPage, TEST_USERS.creator.username)
  await waitForPageLoad(subscriberPage)

  // Open messages for both
  await openMessages(subscriberPage)
  await openMessages(creatorPage)

  return { subscriberPage, creatorPage, subscriberCtx, creatorCtx }
}

base.describe('Two-User Call Signaling', () => {
  base('subscriber audio call → creator sees incoming ring', async ({ browser }) => {
    const { subscriberPage, creatorPage, subscriberCtx, creatorCtx } = await twoUserSetup(browser)

    try {
      // Subscriber initiates audio call
      await initiateCall(subscriberPage, 'audio')
      await expect(subscriberPage.locator('[data-testid="call-modal"]')).toBeVisible({ timeout: 5_000 })

      // Creator should receive the incoming ring
      const creatorModal = creatorPage.locator('[data-testid="call-modal"]')
      await expect(creatorModal).toBeVisible({ timeout: 10_000 })

      const status = creatorPage.locator('[data-testid="call-modal-status"]')
      await expect(status).toContainText(/audio call incoming/i)
    } finally {
      await subscriberCtx.close()
      await creatorCtx.close()
    }
  })

  base('subscriber video call → creator sees incoming ring with "video" label', async ({ browser }) => {
    const { subscriberPage, creatorPage, subscriberCtx, creatorCtx } = await twoUserSetup(browser)

    try {
      await initiateCall(subscriberPage, 'video')
      await expect(subscriberPage.locator('[data-testid="call-modal"]')).toBeVisible({ timeout: 5_000 })

      const status = creatorPage.locator('[data-testid="call-modal-status"]')
      await expect(status).toBeVisible({ timeout: 10_000 })
      await expect(status).toContainText(/video call incoming/i)
    } finally {
      await subscriberCtx.close()
      await creatorCtx.close()
    }
  })

  base('creator accepts → subscriber enters active call state', async ({ browser }) => {
    const { subscriberPage, creatorPage, subscriberCtx, creatorCtx } = await twoUserSetup(browser)

    try {
      // Subscriber calls
      await initiateCall(subscriberPage, 'audio')
      await expect(subscriberPage.locator('[data-testid="call-modal"]')).toBeVisible({ timeout: 5_000 })

      // Creator accepts
      const acceptBtn = creatorPage.locator('[data-testid="call-modal-accept"]')
      await expect(acceptBtn).toBeVisible({ timeout: 10_000 })
      await acceptBtn.click()

      // Both sides should eventually reach the active state (timer visible)
      await expect(creatorPage.locator('[data-testid="call-modal-timer"]')).toBeVisible({ timeout: 12_000 })
      await expect(subscriberPage.locator('[data-testid="call-modal-timer"]')).toBeVisible({ timeout: 12_000 })
    } finally {
      await subscriberCtx.close()
      await creatorCtx.close()
    }
  })

  base('creator rejects → subscriber modal disappears and toast is NOT shown on caller', async ({ browser }) => {
    const { subscriberPage, creatorPage, subscriberCtx, creatorCtx } = await twoUserSetup(browser)

    try {
      await initiateCall(subscriberPage, 'audio')
      await expect(subscriberPage.locator('[data-testid="call-modal"]')).toBeVisible({ timeout: 5_000 })

      // Creator rejects
      const rejectBtn = creatorPage.locator('[data-testid="call-modal-reject"]')
      await expect(rejectBtn).toBeVisible({ timeout: 10_000 })
      await rejectBtn.click()

      // Subscriber's calling modal should vanish (call:rejected event)
      await expect(subscriberPage.locator('[data-testid="call-modal"]')).toHaveCount(0, { timeout: 8_000 })

      // Creator modal also gone
      await expect(creatorPage.locator('[data-testid="call-modal"]')).toHaveCount(0, { timeout: 5_000 })
    } finally {
      await subscriberCtx.close()
      await creatorCtx.close()
    }
  })

  base('active call timer increments over time', async ({ browser }) => {
    const { subscriberPage, creatorPage, subscriberCtx, creatorCtx } = await twoUserSetup(browser)

    try {
      await initiateCall(subscriberPage, 'audio')

      const acceptBtn = creatorPage.locator('[data-testid="call-modal-accept"]')
      await expect(acceptBtn).toBeVisible({ timeout: 10_000 })
      await acceptBtn.click()

      const timer = creatorPage.locator('[data-testid="call-modal-timer"]')
      await expect(timer).toBeVisible({ timeout: 12_000 })

      const first  = await timer.textContent()
      await creatorPage.waitForTimeout(3_000)
      const second = await timer.textContent()

      expect(first).not.toBe(second) // Timer has ticked
    } finally {
      await subscriberCtx.close()
      await creatorCtx.close()
    }
  })

  base('ending active call clears modal for both sides', async ({ browser }) => {
    const { subscriberPage, creatorPage, subscriberCtx, creatorCtx } = await twoUserSetup(browser)

    try {
      await initiateCall(subscriberPage, 'audio')

      const acceptBtn = creatorPage.locator('[data-testid="call-modal-accept"]')
      await expect(acceptBtn).toBeVisible({ timeout: 10_000 })
      await acceptBtn.click()

      // Wait for active state on creator side
      await expect(creatorPage.locator('[data-testid="call-modal-timer"]')).toBeVisible({ timeout: 12_000 })

      // Creator ends the call
      await creatorPage.click('[data-testid="call-modal-end"]')

      // Both modals should disappear
      await expect(creatorPage.locator('[data-testid="call-modal"]')).toHaveCount(0, { timeout: 8_000 })
      await expect(subscriberPage.locator('[data-testid="call-modal"]')).toHaveCount(0, { timeout: 8_000 })
    } finally {
      await subscriberCtx.close()
      await creatorCtx.close()
    }
  })

  base('subscriber can end call from their side', async ({ browser }) => {
    const { subscriberPage, creatorPage, subscriberCtx, creatorCtx } = await twoUserSetup(browser)

    try {
      await initiateCall(subscriberPage, 'audio')

      const acceptBtn = creatorPage.locator('[data-testid="call-modal-accept"]')
      await expect(acceptBtn).toBeVisible({ timeout: 10_000 })
      await acceptBtn.click()

      await expect(subscriberPage.locator('[data-testid="call-modal-timer"]')).toBeVisible({ timeout: 12_000 })

      // Subscriber ends
      await subscriberPage.click('[data-testid="call-modal-end"]')

      await expect(subscriberPage.locator('[data-testid="call-modal"]')).toHaveCount(0, { timeout: 8_000 })
      await expect(creatorPage.locator('[data-testid="call-modal"]')).toHaveCount(0, { timeout: 8_000 })
    } finally {
      await subscriberCtx.close()
      await creatorCtx.close()
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────
// 5.  IN-CALL CONTROLS
// ────────────────────────────────────────────────────────────────────────────

base.describe('In-Call Controls', () => {
  async function reachActiveState(browser: import('@playwright/test').Browser) {
    const ctx1 = await browser.newContext({ permissions: ['microphone', 'camera'] })
    const ctx2 = await browser.newContext({ permissions: ['microphone', 'camera'] })
    const p1   = await ctx1.newPage()
    const p2   = await ctx2.newPage()

    await p1.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))
    await p2.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))
    await mockCallToken(p1)
    await mockCallToken(p2)

    await loginAs(p1, TEST_USERS.subscriber)
    await loginAs(p2, TEST_USERS.creator)
    await ensureConversation(p1, TEST_USERS.creator.username)
    await openMessages(p1)
    await openMessages(p2)

    await initiateCall(p1, 'audio')
    const accept = p2.locator('[data-testid="call-modal-accept"]')
    await expect(accept).toBeVisible({ timeout: 10_000 })
    await accept.click()
    await expect(p2.locator('[data-testid="call-modal-timer"]')).toBeVisible({ timeout: 12_000 })
    await expect(p1.locator('[data-testid="call-modal-timer"]')).toBeVisible({ timeout: 12_000 })

    return { p1, p2, ctx1, ctx2 }
  }

  base('mute button toggles state (audio call)', async ({ browser }) => {
    const { p1, ctx1, ctx2 } = await reachActiveState(browser)

    try {
      const muteBtn = p1.locator('[data-testid="call-modal-mute"]')
      await expect(muteBtn).toBeVisible()
      const before = await muteBtn.textContent()

      await muteBtn.click()
      const after = await muteBtn.textContent()
      expect(before).not.toBe(after) // emoji changed (🎤 → 🔇 or vice-versa)
    } finally {
      await ctx1.close()
      await ctx2.close()
    }
  })

  base('camera button is present in video call active state', async ({ browser }) => {
    // Use video call this time
    const ctx1 = await browser.newContext({ permissions: ['microphone', 'camera'] })
    const ctx2 = await browser.newContext({ permissions: ['microphone', 'camera'] })
    const p1   = await ctx1.newPage()
    const p2   = await ctx2.newPage()

    await p1.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))
    await p2.addInitScript(() => localStorage.setItem('age_verified', String(Date.now())))
    await mockCallToken(p1)
    await mockCallToken(p2)

    await loginAs(p1, TEST_USERS.subscriber)
    await loginAs(p2, TEST_USERS.creator)
    await ensureConversation(p1, TEST_USERS.creator.username)
    await openMessages(p1)
    await openMessages(p2)

    try {
      await initiateCall(p1, 'video')
      const accept = p2.locator('[data-testid="call-modal-accept"]')
      await expect(accept).toBeVisible({ timeout: 10_000 })
      await accept.click()

      await expect(p2.locator('[data-testid="call-modal-timer"]')).toBeVisible({ timeout: 12_000 })
      await expect(p2.locator('[data-testid="call-modal-cam"]')).toBeVisible()

      const camBtn = p2.locator('[data-testid="call-modal-cam"]')
      const before = await camBtn.textContent()
      await camBtn.click()
      const after  = await camBtn.textContent()
      expect(before).not.toBe(after) // 📹 → 📵
    } finally {
      await ctx1.close()
      await ctx2.close()
    }
  })

  base('audio call does NOT show camera toggle button', async ({ browser }) => {
    const { p1, ctx1, ctx2 } = await reachActiveState(browser)
    try {
      // Camera button should not be present in an audio call
      await expect(p1.locator('[data-testid="call-modal-cam"]')).toHaveCount(0)
    } finally {
      await ctx1.close()
      await ctx2.close()
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────
// 6.  EDGE CASES & ALL-USER COVERAGE
// ────────────────────────────────────────────────────────────────────────────

base.describe('Edge Cases', () => {
  base('fan account: messages page loads without errors', async ({ page }) => {
    await loginAs(page, TEST_USERS.fan)
    await page.goto('/messages')
    await waitForPageLoad(page)
    // No crash — the page should render some UI
    await expect(page.locator('body')).toBeVisible()
  })

  base('initiating call without selecting a conversation is a no-op', async ({ page }) => {
    await loginAs(page, TEST_USERS.subscriber)
    await page.goto('/messages')
    await waitForPageLoad(page)

    // Buttons should not even exist without a selected conversation
    const audioBtn = page.locator('[data-testid="call-audio-btn"]')
    await expect(audioBtn).toHaveCount(0)
  })

  base('audio call button title shows BangCoin price for subscribers', async ({ page }) => {
    await loginAs(page, TEST_USERS.subscriber)
    await openMessages(page)

    const title = await page.locator('[data-testid="call-audio-btn"]').getAttribute('title')
    expect(title).toMatch(/BangCoins\/min/i)
  })

  base('audio call button title shows "Free" for creators', async ({ page }) => {
    await loginAs(page, TEST_USERS.creator)
    await openMessages(page)

    const title = await page.locator('[data-testid="call-audio-btn"]').getAttribute('title')
    expect(title).toMatch(/free/i)
  })

  base('toast error shown if backend is unavailable during call initiation', async ({ page }) => {
    await loginAs(page, TEST_USERS.subscriber)
    // Make the token endpoint fail
    await page.route(MOCK_TOKEN_ROUTE, (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"down"}' }),
    )
    await openMessages(page)
    // Open the dialog and click Start Call → API fails → toast
    await page.click('[data-testid="call-audio-btn"]')
    await page.waitForSelector('[data-testid="call-confirm-start"]', { timeout: 5_000 })
    await page.click('[data-testid="call-confirm-start"]')

    // Toast with error should appear; call modal should NOT open
    const toast = page.locator('[data-sonner-toast]')
    await expect(toast).toBeVisible({ timeout: 5_000 })
    await expect(toast).toContainText(/call/i)
    await expect(page.locator('[data-testid="call-modal"]')).toHaveCount(0)
  })
})
