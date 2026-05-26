# Playwright E2E Testing — Skills & Guide

> **Tool:** Playwright Test  
> **Location:** `bangme-fe/tests/`  
> **Purpose:** End-to-end testing and UX auditing for BangMe application

---

## Quick Commands

```bash
# Install browsers (first time only)
npm run playwright:install

# Run all tests
npm run test:e2e

# Run with interactive UI (RECOMMENDED)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run specific test suite
npm run test:e2e:auth          # Authentication tests
npm run test:e2e:posts         # Post creation tests
npm run test:e2e:messaging     # Messaging tests
npm run test:e2e:profile       # Profile & image uploads
npm run test:e2e:navigation    # Navigation flows

# Debug mode
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

---

## Project Structure

```
tests/
├── QUICKSTART.md              # 5-minute getting started guide
├── README.md                  # Comprehensive documentation
├── CHECKLIST.md               # UX audit checklist
├── SETUP_SUMMARY.md           # Complete overview
├── e2e/
│   ├── fixtures.ts            # Test fixtures & auth helpers
│   ├── helpers.ts             # Utility functions
│   ├── auth.spec.ts           # 🔐 Authentication tests
│   ├── posts.spec.ts          # 📝 Post creation/interaction
│   ├── messaging.spec.ts      # 💬 Messaging features
│   ├── profile.spec.ts        # 👤 Profile updates & images
│   └── navigation.spec.ts     # 🧭 Navigation & journeys
└── fixtures/
    ├── test-avatar.jpg        # Test avatar image
    ├── test-banner.jpg        # Test banner image
    └── test-image.jpg         # Test post image
```

---

## Configuration

**File:** `playwright.config.ts`

- **Base URL:** `http://localhost:3003`
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Auto-start:** Frontend server starts automatically
- **Screenshots:** Captured on failure
- **Videos:** Recorded on failure
- **Traces:** Captured on first retry

---

## Test Fixtures & Helpers

### Fixtures (fixtures.ts)

```typescript
// Test user credentials
TEST_USERS = {
  creator: { email, password },
  fan: { email, password },
  newUser: { email, password }
}

// Authenticated fixtures
loginAsCreator()  // Login as creator
loginAsFan()      // Login as fan
```

### Helpers (helpers.ts)

```typescript
// Navigation & waiting
waitForPageLoad(page)
isVisible(page, selector)

// Form interactions
fillAndSubmitForm(page, fields, submitSelector)

// File uploads
uploadFile(page, selector, filePath)

// Notifications
waitForToast(page, message?)

// API responses
waitForApiResponse(page, urlPattern, method)

// Accessibility
checkBasicAccessibility(page)

// Screenshots
takeAnnotatedScreenshot(page, name, annotations?)
```

---

## Test Suites Overview

### 🔐 Authentication (auth.spec.ts)

**Tests without setup needed:**
- ✅ Display registration form
- ✅ Validate required fields
- ✅ Validate email format
- ✅ Validate password match
- ✅ Show/hide password toggle
- ✅ Display login form
- ✅ Validate login fields
- ✅ Navigate between pages

**Tests requiring test users:**
- ⊘ Successful login (email/username)
- ⊘ Invalid credentials error
- ⊘ Logout

### 📝 Posts (posts.spec.ts)

**Requires:** Creator account

- Create text-only post
- Create post with image
- Create post with video
- Set visibility (free/paid)
- Like/unlike posts
- Comment on posts
- Share posts
- View creator profile posts

### 💬 Messaging (messaging.spec.ts)

**Requires:** Test users

- View conversations list
- Start new conversation
- Send text messages
- Send image messages
- Delete messages
- Video/voice calls
- Real-time typing indicators

### 👤 Profile (profile.spec.ts)

**Tests without setup:**
- ✅ Display profile page
- ✅ Profile form validation

**Requires:** Logged in user + test images

- Update display name
- Update bio
- **Upload avatar image**
- **Upload banner image**
- View profile tabs
- Profile stats

### 🧭 Navigation (navigation.spec.ts)

**Tests without setup:**
- ✅ Display navigation menu
- ✅ Navigate between pages
- ✅ Search interface
- ✅ Mobile responsive
- ✅ Keyboard navigation
- ✅ 404 page

**Requires:** Logged in user

- Active nav highlighting
- Complete user journey
- Notification badges

---

## Running Tests Step-by-Step

### 1. Prerequisites

✅ Backend running on port **4000**
✅ Frontend running on port **3003**
✅ Test images in `tests/fixtures/`

### 2. Run Tests That Work Immediately

These don't need test users:

```bash
# Run in UI mode to see them
npx playwright test tests/e2e/auth.spec.ts --ui

# Or headed mode to watch browser
npx playwright test tests/e2e/auth.spec.ts --headed
```

**Will pass:**
- Registration form validation tests
- Login form validation tests
- Navigation tests

### 3. Enable Tests Requiring Authentication

**Create test users:**
- Email: `creator@test.com` / Password: `Test123!@#`
- Email: `fan@test.com` / Password: `Test123!@#`

**Remove `.skip` from tests in spec files**

**Update credentials in `tests/e2e/fixtures.ts` if needed**

### 4. Run Full Test Suite

```bash
npm run test:e2e
```

---

## Test Data Setup

### Option 1: Manual Registration
1. Go to `http://localhost:3003/register`
2. Create accounts matching `TEST_USERS` in fixtures.ts

### Option 2: Database Seed
```bash
cd ../bengme-be
npx prisma db seed
```

### Option 3: API Scripts
Create users via backend API (advanced)

---

## Debugging Failed Tests

### 1. View Screenshot
Failed tests auto-capture screenshots:
```
test-results/[test-name]/test-failed-1.png
```

### 2. View Video
```
test-results/[test-name]/video.webm
```

### 3. View HTML Report
```bash
npm run test:e2e:report
```

### 4. Debug Mode
```bash
npx playwright test tests/e2e/auth.spec.ts:42 --debug
```
Runs test at line 42 in step-by-step mode

### 5. Common Issues

**"Element not found"**
- Check data-testid attributes exist
- Update selectors in test file
- Use browser DevTools to inspect elements

**"Timeout waiting for element"**
- Increase timeout in test
- Check if element actually appears
- Verify API is responding

**"CORS error"**
- Verify backend CORS allows port 3003
- Check `.env` file: `CORS_ORIGIN=http://localhost:3000,http://localhost:3002,http://localhost:3003`

**"Test user doesn't exist"**
- Create test users manually
- Or run database seed
- Update credentials in fixtures.ts

---

## Writing New Tests

### Basic Pattern

```typescript
import { test, expect } from './fixtures'
import { waitForPageLoad } from './helpers'

test('should do something', async ({ page }) => {
  await page.goto('/some-page')
  await waitForPageLoad(page)
  
  // Your test code
  await expect(page.locator('h1')).toBeVisible()
})
```

### With Authentication

```typescript
test.skip('should do something as creator', async ({ page, loginAsCreator }) => {
  await loginAsCreator()
  
  // Now logged in as creator
  await page.goto('/creator-center')
  // ...test code
})
```

### Best Practices

**1. Use data-testid for stable selectors:**
```typescript
// ✅ Good
await page.click('[data-testid="submit-button"]')

// ⚠️ Less reliable
await page.click('button:has-text("Submit")')
```

**2. Wait for elements properly:**
```typescript
// ✅ Good - automatic waiting
await expect(page.locator('.message')).toBeVisible()

// ❌ Bad - arbitrary timeout
await page.waitForTimeout(5000)
```

**3. Use helpers for common operations:**
```typescript
// ✅ Good
await fillAndSubmitForm(page, { email: 'test@test.com' })

// ⚠️ Verbose
await page.fill('input[name="email"]', 'test@test.com')
await page.click('button[type="submit"]')
```

---

## CI/CD Integration

### GitHub Actions Workflow

Located at: `.github/workflows/e2e-tests.yml`

**Runs on:**
- Push to main/develop
- Pull requests

**Steps:**
1. Setup Node.js
2. Install dependencies
3. Setup PostgreSQL
4. Run migrations & seed
5. Start servers
6. Run E2E tests
7. Upload artifacts (reports, screenshots)

**Enable in CI:**
```bash
CI=true npm run test:e2e
```

---

## Test Coverage Checklist

### ✅ Currently Covered

- [x] Authentication flows (login, registration, validation)
- [x] Post creation (text, images, videos)
- [x] Post interactions (like, comment, share)
- [x] Messaging (conversations, send messages)
- [x] Profile management (display name, bio)
- [x] Image uploads (avatar, banner)
- [x] Navigation (menu, search, mobile)
- [x] Form validations
- [x] Error states
- [x] Basic accessibility

### 🔲 To Be Added

- [ ] Payment flows (BangCoins purchase)
- [ ] Subscription management
- [ ] Admin panel features
- [ ] Live streaming
- [ ] Advanced search/filters
- [ ] Notification preferences
- [ ] Account settings
- [ ] Two-factor authentication
- [ ] Password reset flow (full E2E)

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module` | Check import paths use `./` for same directory |
| `EADDRINUSE` port in use | Kill process: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3003).OwningProcess -Force` |
| Tests timing out | Ensure servers are running, increase timeout |
| CORS errors | Update `.env`: `CORS_ORIGIN=...3003` |
| Element not found | Add data-testid, or update selector |
| Test images missing | Create test images in `tests/fixtures/` |

---

## Resources

- 📖 [Playwright Docs](https://playwright.dev)
- 📝 [tests/QUICKSTART.md](tests/QUICKSTART.md) - 5-min start
- 📚 [tests/README.md](tests/README.md) - Full guide
- ✅ [tests/CHECKLIST.md](tests/CHECKLIST.md) - UX audit
- 🎯 [tests/SETUP_SUMMARY.md](tests/SETUP_SUMMARY.md) - Overview

---

## Common Workflows

### Daily Development Testing
```bash
# Quick smoke test
npm run test:e2e:auth

# Watch mode while coding
npm run test:e2e:ui
```

### Before Committing
```bash
# Run full suite
npm run test:e2e

# Check report
npm run test:e2e:report
```

### UX Audit Session
```bash
# Run with visible browser
npm run test:e2e:headed

# Use checklist
# Open tests/CHECKLIST.md
```

### Debugging Specific Issue
```bash
# Debug single test
npx playwright test tests/e2e/auth.spec.ts:42 --debug

# Run with console logs
npx playwright test --headed --debug
```

---

## Tips & Tricks

**1. Focus on one test:**
```typescript
test.only('this test', async ({ page }) => { ... })
```

**2. Skip flaky tests temporarily:**
```typescript
test.skip('fix later', async ({ page }) => { ... })
```

**3. Run tests in specific browser:**
```bash
npx playwright test --project=firefox
npx playwright test --project="Mobile Chrome"
```

**4. Generate test code:**
```bash
npx playwright codegen http://localhost:3003
```
Opens browser and records your actions as test code!

**5. Update screenshots (visual regression):**
```bash
npx playwright test --update-snapshots
```

---

## Next Steps

1. ✅ Install browsers: `npm run playwright:install`
2. ✅ Run UI mode: `npm run test:e2e:ui`
3. ✅ Create test users (creator@test.com, fan@test.com)
4. ✅ Add test images to `tests/fixtures/`
5. ✅ Remove `.skip` from tests to enable them
6. ✅ Run full suite: `npm run test:e2e`
7. ✅ Review report: `npm run test:e2e:report`

**Happy Testing! 🚀**
