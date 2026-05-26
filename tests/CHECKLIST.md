# E2E Testing Checklist

## ✅ UX Audit Checklist

Use this checklist to systematically audit the user experience of the BangMe application.

### 🔐 Authentication Flow

#### Registration
- [ ] Registration form displays all required fields
- [ ] Email validation works correctly
- [ ] Password strength requirements are clear
- [ ] Password confirmation matches validation
- [ ] Show/hide password toggle works
- [ ] Error messages are clear and helpful
- [ ] Success state redirects appropriately
- [ ] Email verification flow works (if applicable)
- [ ] Username uniqueness is validated
- [ ] Loading states are shown during submission

#### Login
- [ ] Login form accepts email and username
- [ ] Password field has show/hide toggle
- [ ] "Remember me" option works
- [ ] Error messages are specific (wrong password vs. user not found)
- [ ] Loading state during authentication
- [ ] Redirects to appropriate page based on user role
- [ ] "Forgot password" link is visible and works
- [ ] Link to registration page works

#### Forgot Password
- [ ] Email field validation works
- [ ] Success message is clear
- [ ] Loading state during submission
- [ ] Link back to login works
- [ ] Email is sent (check email/dev logs)

#### Logout
- [ ] Logout button is accessible
- [ ] Confirmation dialog (if applicable)
- [ ] Clears authentication tokens
- [ ] Redirects to login/landing page
- [ ] Cannot access protected routes after logout

---

### 📝 Post Features

#### Create Post (Creator Only)
- [ ] Create post button is visible and accessible
- [ ] Modal/dialog opens smoothly
- [ ] Text input is functional with character count
- [ ] Image upload works with preview
- [ ] Video upload works with preview
- [ ] Multiple images can be uploaded
- [ ] File size validation works
- [ ] File type validation works
- [ ] Visibility options (free/paid/subscriber-only) are clear
- [ ] Loading state during upload
- [ ] Success message after posting
- [ ] Modal closes after success
- [ ] New post appears in feed immediately

#### View Posts
- [ ] Posts display correctly in feed
- [ ] Images load properly
- [ ] Videos play correctly
- [ ] Post metadata (time, likes, comments) visible
- [ ] Infinite scroll or pagination works
- [ ] Loading states for new posts

#### Interact with Posts
- [ ] Like button works (toggle on/off)
- [ ] Like count updates immediately
- [ ] Unlike works correctly
- [ ] Comment button opens comment section
- [ ] Comment submission works
- [ ] Comment appears immediately
- [ ] Share button opens share options
- [ ] Save/bookmark post works
- [ ] Report post option accessible
- [ ] Creator menu options (edit/delete) work

#### Post Details View
- [ ] Clicking post opens detail view
- [ ] All post content is visible
- [ ] Comments section is functional
- [ ] Back navigation works
- [ ] Deep linking works (direct URL to post)

---

### 💬 Messaging Features

#### Conversations List
- [ ] Conversations list displays correctly
- [ ] Search conversations works
- [ ] Recent conversations appear first
- [ ] Unread count displays correctly
- [ ] Conversation preview shows latest message
- [ ] Timestamps are formatted correctly
- [ ] Empty state is shown when no conversations

#### Start Conversation
- [ ] "New Message" button accessible
- [ ] User search works
- [ ] Can select user to message
- [ ] Creator profiles have "Message" button
- [ ] Clicking message button opens chat

#### Send Messages
- [ ] Text input is responsive
- [ ] Send button is disabled when empty
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line
- [ ] Message appears immediately after sending
- [ ] Loading/sending indicator works
- [ ] Character limit (if any) is enforced
- [ ] Emoji picker works
- [ ] Image upload works with preview
- [ ] Voice message recording works

#### Real-time Features
- [ ] Typing indicator appears
- [ ] New messages appear automatically
- [ ] Message read status updates
- [ ] Online/offline status shows

#### Message Actions
- [ ] Long-press/right-click opens menu
- [ ] Copy message works
- [ ] Delete message works (own messages)
- [ ] React to message works
- [ ] Reply to message works

#### Conversation Management
- [ ] Conversation settings accessible
- [ ] Mute notifications works
- [ ] Delete conversation works
- [ ] Block user works
- [ ] Unblock user works

#### Voice/Video Calls (if implemented)
- [ ] Video call button accessible
- [ ] Voice call button accessible
- [ ] Call interface loads
- [ ] Camera/microphone permissions requested
- [ ] Video feeds display
- [ ] Mute audio works
- [ ] Turn off video works
- [ ] End call works

---

### 👤 Profile Features

#### View Profile
- [ ] Profile page loads correctly
- [ ] Avatar displays or shows placeholder
- [ ] Banner displays or shows placeholder
- [ ] Display name is visible
- [ ] Username is visible
- [ ] Bio displays correctly
- [ ] Follower count displays
- [ ] Following count displays
- [ ] Post count displays
- [ ] Verification badge shows (if verified)
- [ ] Creator badge shows (if creator)
- [ ] User role is clear

#### Edit Profile
- [ ] Edit profile button accessible
- [ ] Display name field editable
- [ ] Bio field editable with character count
- [ ] Changes save successfully
- [ ] Success message appears
- [ ] Profile updates immediately
- [ ] Cancel button discards changes
- [ ] Validation errors are clear

#### Update Avatar
- [ ] Avatar edit button accessible
- [ ] File picker opens
- [ ] Image preview shows before upload
- [ ] Upload progress indicator works
- [ ] Success message appears
- [ ] Avatar updates immediately across app
- [ ] File type validation works
- [ ] File size validation works
- [ ] Error handling works (upload failed)

#### Update Banner
- [ ] Banner edit button accessible
- [ ] File picker opens
- [ ] Image preview shows before upload
- [ ] Upload progress indicator works
- [ ] Success message appears
- [ ] Banner updates immediately
- [ ] File type validation works
- [ ] File size validation works
- [ ] Error handling works (upload failed)

#### Profile Tabs
- [ ] All tabs are visible
- [ ] Posts tab shows user's posts
- [ ] Liked tab shows liked posts
- [ ] Saved tab shows saved posts
- [ ] Empty states are shown when appropriate
- [ ] Tab switching works smoothly
- [ ] Content loads for each tab

#### Profile Actions
- [ ] Follow/unfollow button works (on other profiles)
- [ ] Subscribe button works (creator profiles)
- [ ] Message button works
- [ ] Share profile works
- [ ] Report profile accessible
- [ ] Block user works

#### Profile Stats
- [ ] Clicking follower count shows followers list
- [ ] Clicking following count shows following list
- [ ] Lists are scrollable/paginated
- [ ] Follow/unfollow works from lists

---

### 🧭 Navigation

#### Main Navigation
- [ ] All nav items are visible
- [ ] Home navigation works
- [ ] Explore navigation works
- [ ] Messages navigation works
- [ ] Notifications navigation works
- [ ] Profile navigation works
- [ ] Creator Center navigation works (creators)
- [ ] Active nav item is highlighted
- [ ] Navigation persists across pages

#### Search
- [ ] Search input is accessible
- [ ] Search suggestions appear
- [ ] Search results load correctly
- [ ] Filter options work (users/posts/etc)
- [ ] Results are paginated
- [ ] Empty state shows when no results
- [ ] Recent searches are saved (if applicable)

#### Mobile Navigation
- [ ] Mobile menu button works
- [ ] Bottom navigation bar visible
- [ ] All navigation items accessible
- [ ] Menu opens and closes smoothly
- [ ] Active item highlighted

#### Keyboard Navigation
- [ ] Tab order is logical
- [ ] All interactive elements focusable
- [ ] Focus indicators visible
- [ ] Enter key activates links/buttons
- [ ] Escape key closes modals
- [ ] Arrow keys navigate lists (if applicable)

#### Breadcrumbs
- [ ] Breadcrumbs show current location
- [ ] Back button works correctly
- [ ] Browser back button works
- [ ] Deep links work correctly

---

### 🔔 Notifications

#### Notification Center
- [ ] Notification icon shows count
- [ ] Clicking opens notification panel
- [ ] Notifications are categorized
- [ ] Timestamps are readable
- [ ] Unread notifications highlighted
- [ ] Clicking notification navigates to content
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Clear all works

#### Notification Types
- [ ] Like notifications appear
- [ ] Comment notifications appear
- [ ] Follow notifications appear
- [ ] Message notifications appear
- [ ] Subscription notifications appear
- [ ] Payment notifications appear

---

### 🎨 Visual & UX

#### Responsiveness
- [ ] Mobile (375px) layout works
- [ ] Tablet (768px) layout works
- [ ] Desktop (1024px+) layout works
- [ ] Images scale appropriately
- [ ] Text is readable at all sizes
- [ ] Buttons are touch-friendly on mobile

#### Loading States
- [ ] Skeleton loaders show while loading
- [ ] Spinners appear during actions
- [ ] Progress bars show upload progress
- [ ] Disabled states prevent double-clicks

#### Error States
- [ ] Error messages are clear and actionable
- [ ] Network errors are handled gracefully
- [ ] 404 page displays correctly
- [ ] Error boundaries prevent crashes
- [ ] Retry options are available

#### Empty States
- [ ] Empty feed has helpful message
- [ ] No messages state is clear
- [ ] No notifications state is clear
- [ ] Empty search results are helpful
- [ ] Empty profile tabs have CTAs

#### Accessibility
- [ ] Alt text on images
- [ ] ARIA labels on buttons
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announcements (if tested)

---

### 💰 Payment Features (if implemented)

#### BangCoins
- [ ] Wallet balance displays
- [ ] Purchase BangCoins flow works
- [ ] Payment form validation works
- [ ] Transaction history visible
- [ ] Spending BangCoins works (tips, etc)

#### Subscriptions
- [ ] Subscribe button visible on creator profiles
- [ ] Subscription tiers displayed
- [ ] Payment flow works
- [ ] Subscription status visible
- [ ] Cancel subscription works
- [ ] Subscriber-only content is locked

---

### 🎯 Creator-Specific Features

#### Creator Center
- [ ] Dashboard displays key metrics
- [ ] Earnings/revenue visible
- [ ] Subscriber count visible
- [ ] Analytics accessible
- [ ] Quick actions available

#### Creator Profile
- [ ] Subscription tiers displayed
- [ ] Subscribe button prominent
- [ ] Subscriber count visible
- [ ] Exclusive content indicators

---

### 🚀 Performance

- [ ] Pages load in under 3 seconds
- [ ] Images are optimized/lazy loaded
- [ ] Videos load progressively
- [ ] Smooth scrolling (60fps)
- [ ] No jank during interactions
- [ ] Offline functionality (if applicable)

---

## 📊 Testing Strategy

### Phase 1: Smoke Tests (Quick validation)
Run these first to ensure basic functionality:
1. Login/Registration
2. View home feed
3. Basic navigation
4. Logout

### Phase 2: Feature Tests (Detailed validation)
Test each feature thoroughly:
1. All authentication flows
2. All post interactions
3. Complete messaging flow
4. Profile updates and images
5. All navigation paths

### Phase 3: Edge Cases
Test unusual scenarios:
1. Very long text inputs
2. Large file uploads
3. Slow network conditions
4. Multiple tabs open
5. Rapid clicking/actions

### Phase 4: Cross-Browser
Test on all supported browsers:
1. Chrome/Chromium
2. Firefox
3. Safari/WebKit
4. Mobile Chrome
5. Mobile Safari

### Phase 5: Accessibility
1. Keyboard-only navigation
2. Screen reader testing (manual)
3. High contrast mode
4. Zoom to 200%

---

## 🐛 Bug Reporting Template

When you find issues during testing:

```
**Issue**: [Brief description]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: [Chrome/Firefox/Safari]
**Device**: [Desktop/Mobile]
**Screenshot**: [If applicable]
**Test**: [Which test file/line]
```

---

## ✅ Sign Off

- [ ] All authentication flows tested
- [ ] All post features tested
- [ ] All messaging features tested
- [ ] All profile features tested
- [ ] All navigation tested
- [ ] Mobile responsive tested
- [ ] Accessibility basics tested
- [ ] Cross-browser tested
- [ ] Performance acceptable
- [ ] No critical bugs

**Tested by**: _______________
**Date**: _______________
**Notes**: _______________
