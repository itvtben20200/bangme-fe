/**
 * Seed Script: Creates 3 male + 2 non-binary creator accounts for filter testing.
 *
 * Account summary:
 * ┌─────────────────┬─────────────────────────────┬──────────────┬────────────┬──────────────┐
 * │ Username        │ Email                       │ Password     │ Gender     │ Date of Birth│
 * ├─────────────────┼─────────────────────────────┼──────────────┼────────────┼──────────────┤
 * │ marcuswave      │ marcus.wave@bangme.dev      │ BangMe@Seed1 │ male       │ 1995-03-15   │
 * │ tylerbolt       │ tyler.bolt@bangme.dev       │ BangMe@Seed1 │ male       │ 1992-07-22   │
 * │ djmike88        │ dj.mike88@bangme.dev        │ BangMe@Seed1 │ male       │ 1988-11-05   │
 * │ skyler_nb       │ skyler.nb@bangme.dev        │ BangMe@Seed1 │ non-binary │ 1997-04-10   │
 * │ alex_bnd        │ alex.bnd@bangme.dev         │ BangMe@Seed1 │ non-binary │ 2000-09-25   │
 * └─────────────────┴─────────────────────────────┴──────────────┴────────────┴──────────────┘
 *
 * Run with:  npx playwright test seed-test-accounts --project=chromium
 */

import { test, expect } from '@playwright/test'

const API = 'http://localhost:4002/api'
const PASSWORD = 'BangMe@Seed1'

const ACCOUNTS = [
  {
    username:    'marcuswave',
    email:       'marcus.wave@bangme.dev',
    displayName: 'Marcus Wave',
    gender:      'male',
    dateOfBirth: '1995-03-15',
  },
  {
    username:    'tylerbolt',
    email:       'tyler.bolt@bangme.dev',
    displayName: 'Tyler Bolt',
    gender:      'male',
    dateOfBirth: '1992-07-22',
  },
  {
    username:    'djmike88',
    email:       'dj.mike88@bangme.dev',
    displayName: 'DJ Mike',
    gender:      'male',
    dateOfBirth: '1988-11-05',
  },
  {
    username:    'skyler_nb',
    email:       'skyler.nb@bangme.dev',
    displayName: 'Skyler NB',
    gender:      'non-binary',
    dateOfBirth: '1997-04-10',
  },
  {
    username:    'alex_bnd',
    email:       'alex.bnd@bangme.dev',
    displayName: 'Alex Bnd',
    gender:      'non-binary',
    dateOfBirth: '2000-09-25',
  },
]

test.describe('Seed – gender/age filter accounts', () => {
  /** Safely extract ?token= from a possibly-malformed devVerifyUrl */
  function extractToken(url: string): string | null {
    const m = url.match(/[?&]token=([a-f0-9]+)/)
    return m ? m[1] : null
  }

  for (const acct of ACCOUNTS) {
    test(`create ${acct.username} (${acct.gender})`, async ({ request }) => {

      // ── 1. Register ─────────────────────────────────────────────────────────
      const regRes = await request.post(`${API}/auth/register`, {
        data: {
          username:    acct.username,
          email:       acct.email,
          password:    PASSWORD,
          displayName: acct.displayName,
        },
      })

      let devVerifyUrl: string | undefined

      if (regRes.ok()) {
        const body = await regRes.json()
        devVerifyUrl = body.devVerifyUrl
        console.log(`  ✅  ${acct.username}: registered`)
      } else {
        const body = await regRes.json()
        if (regRes.status() === 409) {
          console.log(`  ℹ️  ${acct.username}: already registered`)
        } else {
          throw new Error(`Registration failed: ${JSON.stringify(body)}`)
        }
      }

      // ── 2. Verify email ──────────────────────────────────────────────────────
      // If we didn't get a devVerifyUrl from registration (account already existed),
      // use resend-verification to get a fresh token.
      if (!devVerifyUrl) {
        const resendRes = await request.post(`${API}/auth/resend-verification`, {
          data: { email: acct.email },
        })
        if (resendRes.ok()) {
          const resendBody = await resendRes.json()
          devVerifyUrl = resendBody.devVerifyUrl
          console.log(`  ℹ️  ${acct.username}: resent verification email`)
        }
      }

      if (devVerifyUrl) {
        const token = extractToken(devVerifyUrl)
        expect(token, `verify token missing from: ${devVerifyUrl}`).toBeTruthy()

        const verRes = await request.post(`${API}/auth/verify-email`, {
          data: { token },
        })
        expect(verRes.ok(), `email verify failed: ${await verRes.text()}`).toBeTruthy()
        console.log(`  ✅  ${acct.username}: email verified`)
      }

      // ── 3. Login ─────────────────────────────────────────────────────────────
      const loginRes = await request.post(`${API}/auth/login`, {
        data: { identifier: acct.email, password: PASSWORD },
      })
      expect(loginRes.ok(), `login failed: ${await loginRes.text()}`).toBeTruthy()
      const loginBody = await loginRes.json()
      const accessToken: string = loginBody.data?.accessToken
      expect(accessToken, 'access token must be present').toBeTruthy()
      console.log(`  ✅  ${acct.username}: logged in`)

      const authHeaders = { Authorization: `Bearer ${accessToken}` }

      // ── 4. Upgrade to creator ────────────────────────────────────────────────
      const becomeRes = await request.post(`${API}/creators/become`, {
        headers: authHeaders,
      })
      if (becomeRes.ok()) {
        console.log(`  ✅  ${acct.username}: upgraded to creator`)
      } else if (becomeRes.status() === 403) {
        // already a creator — that's fine
        console.log(`  ℹ️  ${acct.username}: already a creator`)
      } else {
        const body = await becomeRes.json().catch(() => ({}))
        console.warn(`  ⚠️  become-creator status ${becomeRes.status()}: ${JSON.stringify(body)}`)
      }

      // ── 5. Set gender & date of birth ────────────────────────────────────────
      const profileRes = await request.patch(`${API}/users/me`, {
        headers: authHeaders,
        data: {
          displayName: acct.displayName,
          gender:      acct.gender,
          dateOfBirth: acct.dateOfBirth,
        },
      })
      expect(profileRes.ok(), `profile update failed: ${await profileRes.text()}`).toBeTruthy()
      const profileBody = await profileRes.json()
      expect(profileBody.data.gender).toBe(acct.gender)
      console.log(`  ✅  ${acct.username}: gender="${acct.gender}" dob="${acct.dateOfBirth}" saved`)
    })
  }
})
