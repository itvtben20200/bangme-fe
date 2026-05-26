# Playwright E2E Testing Guide

## Overview

This document provides comprehensive instructions for running Playwright end-to-end tests for the BangMe application. The test suite covers all major user flows including authentication, posting, messaging, profile management, and navigation.

## Prerequisites

- Node.js 18+ installed
- Frontend and backend servers running
- Test database with seed data (optional but recommended)

## Installation

Playwright is already installed in the project. To install browsers:

```powershell
npx playwright install
```

This will download Chromium, Firefox, and WebKit browsers needed for testing.

## Project Structure

```
tests/
├── e2e/
│   ├── auth.spec.ts           # Authentication flows (login, registration)
│   ├── posts.spec.ts           # Post creation and interactions
│   ├── messaging.spec.ts       # Messaging features
│   ├── profile.spec.ts         # Profile updates and image uploads
│   ├── navigation.spec.ts      # Navigation and user journeys
│   ├── fixtures.ts             # Test fixtures and authenticated contexts
│   └── helpers.ts              # Helper functions and utilities
├── fixtures/
│   ├── test-avatar.jpg         # Test avatar image
│   ├── test-banner.jpg         # Test banner image
│   ├── test-image.jpg          # Test post image
│   └── test-video.mp4          # Test video file
└── playwright.config.ts        # Playwright configuration
```

## Running Tests

### Run All Tests

```powershell
npm run test:e2e
```

### Run Specific Test File

```powershell
npx playwright test tests/e2e/auth.spec.ts
```

### Run Tests in UI Mode (Recommended for Development)

```powershell
npx playwright test --ui
```

This opens an interactive UI where you can:
- See all tests
- Run tests individually
- See live test execution
- Debug failures

### Run Tests in Headed Mode (Watch Browser)

```powershell
npx playwright test --headed
```

### Run Tests in Debug Mode

```powershell
npx playwright test --debug
```

This opens Playwright Inspector for step-by-step debugging.

### Run Tests for Specific Browser

```powershell
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari) only
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"

# Mobile Safari
npx playwright test --project="Mobile Safari"
```

## Test Data Setup

### Option 1: Using Skipped Tests (Default)

Most tests are marked with `test.skip()` by default because they require:
- Test users in the database
- Backend server running
- Proper authentication

To enable tests:
1. Remove `.skip` from tests you want to run
2. Ensure test users exist in database
3. Update credentials in `tests/e2e/fixtures.ts`

### Option 2: Seed Test Data

Run database seed script:

```powershell
cd dev/bengme-be
npx prisma db seed
```

This should create:
- Test creator account: `creator@test.com` / `Test123!@#`
- Test fan account: `fan@test.com` / `Test123!@#`

### Option 3: Manual Setup

1. Start the backend server:
   ```powershell
   cd dev/bengme-be
   npm run dev
   ```

2. Start the frontend server:
   ```powershell
   cd dev/bangme-fe
   npm run dev
   ```

3. Create test users manually through registration

4. Update credentials in `tests/e2e/fixtures.ts`:
   ```typescript
   export const TEST_USERS = {
     creator: {
       email: 'your-creator@test.com',
       password: 'your-password',
     },
     fan: {
       email: 'your-fan@test.com',
       password: 'your-password',
     },
   }
   ```

## Test Fixtures

Create test image files in `tests/fixtures/`:

### Creating Test Images (Windows)

```powershell
# Create fixtures directory
New-Item -ItemType Directory -Path "tests\fixtures" -Force

# You can use any image files you have, or download placeholder images
# For example, copy an existing image:
Copy-Item "path\to\your\image.jpg" "tests\fixtures\test-avatar.jpg"
Copy-Item "path\to\your\image.jpg" "tests\fixtures\test-banner.jpg"
Copy-Item "path\to\your\image.jpg" "tests\fixtures\test-image.jpg"
```

Or use PowerShell to create simple test images:

```powershell
# This requires ImageMagick or similar tool
# Alternative: Download from placeholder services
Invoke-WebRequest -Uri "https://via.placeholder.com/400x400.jpg" -OutFile "tests\fixtures\test-avatar.jpg"
Invoke-WebRequest -Uri "https://via.placeholder.com/1200x400.jpg" -OutFile "tests\fixtures\test-banner.jpg"
Invoke-WebRequest -Uri "https://via.placeholder.com/800x600.jpg" -OutFile "tests\fixtures\test-image.jpg"
```

## Running Specific Test Suites

### Authentication Tests

```powershell
npx playwright test tests/e2e/auth.spec.ts
```

Tests covered:
- ✅ Registration form validation
- ✅ Login with email/username
- ✅ Password visibility toggle
- ✅ Forgot password flow
- ✅ Logout

### Post Tests

```powershell
npx playwright test tests/e2e/posts.spec.ts
```

Tests covered:
- ✅ Create text-only post
- ✅ Create post with image
- ✅ Create post with video
- ✅ Like/unlike posts
- ✅ Comment on posts
- ✅ Share posts

### Messaging Tests

```powershell
npx playwright test tests/e2e/messaging.spec.ts
```

Tests covered:
- ✅ View conversations
- ✅ Send text messages
- ✅ Send image messages
- ✅ Start new conversation
- ✅ Delete messages
- ✅ Video/voice calls

### Profile Tests

```powershell
npx playwright test tests/e2e/profile.spec.ts
```

Tests covered:
- ✅ View profile
- ✅ Update display name
- ✅ Update bio
- ✅ Upload avatar
- ✅ Upload banner
- ✅ View profile tabs
- ✅ Profile stats

### Navigation Tests

```powershell
npx playwright test tests/e2e/navigation.spec.ts
```

Tests covered:
- ✅ Main navigation menu
- ✅ Navigate between pages
- ✅ Search functionality
- ✅ Mobile navigation
- ✅ Keyboard navigation
- ✅ Complete user journey

## Viewing Test Reports

After running tests, view the HTML report:

```powershell
npx playwright show-report
```

This opens a detailed report showing:
- Test results
- Screenshots on failure
- Videos of failed tests
- Execution traces

## Debugging Failed Tests

### 1. View Screenshots

Failed tests automatically capture screenshots in:
```
test-results/
```

### 2. View Videos

Failed tests record videos in:
```
test-results/
```

### 3. View Traces

Traces are captured on first retry. View with:

```powershell
npx playwright show-trace test-results/path-to-trace.zip
```

### 4. Run Single Test in Debug Mode

```powershell
npx playwright test tests/e2e/auth.spec.ts:10 --debug
```

This runs the test starting at line 10 in debug mode.

## CI/CD Integration

Tests are configured to run in CI environments. The configuration automatically:
- Uses headless mode
- Retries failed tests twice
- Generates JSON and HTML reports
- Runs tests sequentially (not in parallel)

To run in CI mode locally:

```powershell
$env:CI = "true"
npm run test:e2e
```

## Best Practices

### 1. Test Data Isolation

- Use unique identifiers (timestamps) when creating test data
- Clean up test data after tests (if needed)
- Don't rely on specific data existing

### 2. Waiting for Elements

Use built-in Playwright waiting:

```typescript
// ✅ Good - automatic waiting
await expect(page.locator('text="Success"')).toBeVisible()

// ❌ Bad - arbitrary timeout
await page.waitForTimeout(5000)
```

### 3. Selectors

Prefer in order:
1. Data test IDs: `[data-testid="submit-button"]`
2. Accessible roles: `button[name="Submit"]`
3. Text content: `text="Submit"`
4. CSS selectors: `.submit-button`

### 4. Authentication

Use fixtures for authenticated tests:

```typescript
test.skip('should do something', async ({ page, loginAsFan }) => {
  await loginAsFan() // Automatically logs in
  // Your test code
})
```

## Troubleshooting

### Tests Timing Out

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  actionTimeout: 30000, // 30 seconds
}
```

### Backend Not Running

Ensure backend is running on port 4000:

```powershell
cd dev/bengme-be
npm run dev
```

### Frontend Not Running

Playwright automatically starts the frontend, but you can disable this:

```typescript
// In playwright.config.ts
webServer: {
  // ...
  reuseExistingServer: true, // Use already running server
}
```

### Port Already in Use

Kill existing processes:

```powershell
# Stop frontend
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3002).OwningProcess -Force

# Stop backend
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess -Force
```

### Test Users Don't Exist

1. Create users manually via registration
2. Or run database seed:
   ```powershell
   cd dev/bengme-be
   npx prisma db seed
   ```

## Continuous Testing

### Watch Mode

For TDD workflow, run tests in UI mode:

```powershell
npx playwright test --ui
```

This allows:
- Automatic re-run on file changes
- Filter tests by name
- See test execution in real-time

### VS Code Extension

Install Playwright Test extension for VS Code:

1. Open VS Code
2. Install "Playwright Test for VSCode"
3. Tests appear in sidebar
4. Run/debug tests from editor

## Test Coverage

### Current Coverage

- ✅ Authentication flows
- ✅ Post creation and interactions
- ✅ Messaging features
- ✅ Profile management
- ✅ Image uploads (avatar/banner)
- ✅ Navigation flows
- ✅ Mobile responsive

### To Add

- [ ] Payment flows (BangCoins)
- [ ] Admin panel
- [ ] Subscription management
- [ ] Live streaming
- [ ] Advanced search/filters

## Performance Testing

Run tests with performance metrics:

```powershell
npx playwright test --reporter=html,json
```

Analyze `test-results/results.json` for timing data.

## Accessibility Testing

Tests include basic accessibility checks using `checkBasicAccessibility()` helper.

For advanced accessibility testing, install axe:

```powershell
npm install -D @axe-core/playwright
```

## Next Steps

1. **Remove `.skip` from tests** you want to enable
2. **Set up test data** (create test users)
3. **Run tests** in UI mode to see them in action
4. **Review failures** and adjust tests to match your implementation
5. **Add data-testid attributes** to components for reliable selectors
6. **Create fixture files** (test images/videos)
7. **Integrate into CI/CD** pipeline

## Support

For issues or questions:
- Check Playwright documentation: https://playwright.dev
- Review test helper functions in `helpers.ts`
- Examine existing test patterns in spec files

---

**Remember**: Most tests are skipped by default. Enable them gradually as you set up test data and verify they match your actual implementation.
