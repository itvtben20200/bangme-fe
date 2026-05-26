# Quick Start: Running Playwright Tests

## TL;DR - Fastest Way to Get Started

### 1. Install Playwright Browsers (First Time Only)

```powershell
npx playwright install
```

### 2. Start Your Servers

Open two terminals:

**Terminal 1 - Backend:**
```powershell
cd dev/bengme-be
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd dev/bangme-fe
npm run dev
```

### 3. Run Tests in UI Mode (Recommended)

```powershell
cd dev/bangme-fe
npx playwright test --ui
```

This opens an interactive interface where you can:
- Select which tests to run
- Watch tests execute in real-time
- See results immediately
- Debug failures easily

### 4. Important: Most Tests Are Skipped by Default

Tests are marked with `.skip` because they need test users. To enable:

1. **Create test users** through your registration page:
   - Email: `creator@test.com` / Password: `Test123!@#`
   - Email: `fan@test.com` / Password: `Test123!@#`

2. **Remove `.skip` from tests** you want to run

3. **Update credentials** in `tests/e2e/fixtures.ts` if needed

### 5. Run Specific Tests

```powershell
# Run only authentication tests
npx playwright test tests/e2e/auth.spec.ts --ui

# Run only navigation tests
npx playwright test tests/e2e/navigation.spec.ts --headed

# Run all tests (those not skipped)
npm run test:e2e
```

## What Tests Are Available?

- **auth.spec.ts**: Login, registration, password reset
- **posts.spec.ts**: Creating posts, liking, commenting
- **messaging.spec.ts**: Sending messages, conversations
- **profile.spec.ts**: Updating profile, uploading avatar/banner
- **navigation.spec.ts**: Navigation flows, user journeys

## Viewing Results

After tests run:

```powershell
npx playwright show-report
```

## Need Help?

See the full [README.md](./README.md) for detailed instructions.

## Common Issues

**"Tests timing out"**: Make sure both frontend (port 3002) and backend (port 4000) are running.

**"Test failed"**: Tests might need adjustment to match your actual UI. Check data-testid attributes match.

**"No test users"**: Create them manually or enable tests one at a time to see what's needed.

---

**Pro Tip**: Start with UI mode (`--ui`) - it's the easiest way to see what's happening!
