# BangMe Frontend — Skills & Context

> **Folder:** `bangme-fe/`  
> **Stack:** Next.js 16 (App Router) · React 18 · TypeScript 5 · Tailwind CSS 3

---

## Project Structure (actual on disk)

```
bangme-fe/
├── app/
│   ├── globals.css               # CSS variables + Tailwind base
│   ├── layout.tsx                # Root layout (fonts, Providers wrapper)
│   ├── providers.tsx             # QueryClientProvider + other global providers
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (landing)/
│   │   └── page.tsx              # Public landing / marketing page
│   ├── (user)/
│   │   ├── layout.tsx            # Sidebar + nav wrapper (authenticated users)
│   │   ├── home/page.tsx
│   │   ├── explore/page.tsx
│   │   ├── bangcoins/page.tsx
│   │   ├── become-creator/page.tsx
│   │   ├── creator/[username]/page.tsx
│   │   ├── creator-center/page.tsx   # Creator role only
│   │   ├── messages/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── settings/page.tsx
│   └── (admin)/
│       ├── layout.tsx            # Admin sidebar layout
│       └── admin/dashboard/page.tsx
├── components/
│   └── layout/
│       ├── Sidebar.tsx           # User/Creator nav sidebar
│       └── AdminSidebar.tsx      # Admin nav sidebar
├── lib/
│   ├── api.ts                    # Axios instance + auth interceptors
│   ├── socket.ts                 # Socket.io client singleton
│   ├── stripe.ts                 # Stripe.js loader
│   └── utils.ts                  # cn(), formatCoins(), etc.
├── store/
│   ├── authStore.ts              # Zustand: user, accessToken, isAuthenticated
│   ├── walletStore.ts            # Zustand: BangCoin balance
│   └── chatStore.ts              # Zustand: active conversation
├── types/
│   └── index.ts                  # Shared TypeScript types
│   │   ├── creator-profile/page.tsx  # Creator self-profile
│   │   └── profile/page.tsx          # Subscriber self-profile
│   └── (admin)/
│       ├── layout.tsx            # Admin sidebar layout
│       └── admin/
│           ├── dashboard/page.tsx    # Live accounts monitor (real API)
│           ├── login/page.tsx        # Admin-only login portal
│           └── register/page.tsx     # Admin-only registration (requires secret)
├── middleware.ts                 # Next.js route protection by role
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_CDN_DOMAIN=localhost
JWT_ACCESS_SECRET=local_dev_access_secret_pad_to_32_characters_ok
```

> **Security:** NEVER put Stripe secret keys or any private key in `.env.local`.

---

## Build Scripts

```bash
npm run dev         # next dev -p 3000
npm run build       # next build
npm start           # next start -p 3000
npm run lint        # next lint
npm run type-check  # tsc --noEmit
npm run test        # vitest run
npm run test:e2e    # playwright test
```

---

## Routing & Route Groups

| Route Group | Layout | Purpose |
|-------------|--------|---------|
| `(auth)` | None (bare) | Login, Register — no sidebar |
| `(landing)` | None | Public marketing/landing page |
| `(user)` | Sidebar layout | All authenticated user/creator pages |
| `(admin)` | AdminSidebar layout | Admin-only pages |

### Page → URL Mapping

| Page | Route | Role |
|------|-------|------|
| Landing | `/` | Public |
| User Login | `/login` | Public (Subscriber + Creator) |
| User Register | `/register` | Public (Subscriber + Creator only) |
| Admin Login | `/admin/login` | Public (Admin only) |
| Admin Register | `/admin/register` | Public (Admin only, requires secret) |
| Home feed | `/home` | User / Creator |
| Explore | `/explore` | User / Creator |
| Creator profile | `/creator/[username]` | User / Creator |
| Messages | `/messages` | User / Creator |
| Notifications | `/notifications` | User / Creator |
| BangCoins | `/bangcoins` | User / Creator |
| Subscriber Profile | `/profile` | User |
| Creator Self-Profile | `/creator-profile` | Creator |
| Creator Center | `/creator-center` | Creator only |
| Become Creator | `/become-creator` | User only |
| Settings | `/settings` | User / Creator |
| Admin Dashboard | `/admin/dashboard` | Admin only |

---

## Route Protection (middleware.ts)

```typescript
// Public paths (no auth required)
const PUBLIC_PATHS = [
  '/', '/login', '/register',
  '/admin/login', '/admin/register',     // ← admin auth is public but separate
  '/terms', '/privacy', '/faqs', '/help', '/contact',
]

// Guards:
// Unauthenticated → redirect to /login
// /admin/** and role !== 'admin' → redirect to /home
// /login or /register and role === 'admin' → redirect to /admin/dashboard
// /creator-center and role === 'user' → redirect to /become-creator
```

### Auth Portal Separation
| Portal | URL | Who |
|--------|-----|-----|
| User login | `/login` | Subscriber + Creator |
| User register | `/register` | Subscriber + Creator |
| Admin login | `/admin/login` | Admin only |
| Admin register | `/admin/register` | Admin only (requires `ADMIN_SECRET`) |

---

## Authentication Flow

### Login
1. `POST /api/v1/auth/login` → `{ accessToken, refreshToken, user }`
2. `accessToken` → Zustand `authStore` (memory only)
3. `refreshToken` → `httpOnly` cookie set by backend
4. Axios interceptor adds `Authorization: Bearer <accessToken>` to all requests
5. On 401 → interceptor calls `POST /auth/refresh` → retries original request

### Session Persistence
- `accessToken` in Zustand (cleared on tab close)
- `refreshToken` in `httpOnly` cookie (survives browser refresh)
- On boot: `GET /auth/me` with cookie → restore session

### Auth Store Shape
```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (credentials) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<void>
}
```

---

## State Management

| Store | Lib | Holds |
|-------|-----|-------|
| `authStore` | Zustand | user, role, accessToken |
| `walletStore` | Zustand | BangCoin balance, pending transactions |
| `chatStore` | Zustand | Active conversation, unread counts |
| Server data | React Query | Posts, creators, notifications, history |

### React Query (providers.tsx)
```typescript
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})
```

---

## API Integration (lib/api.ts)

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,   // sends httpOnly refresh token cookie
})

// Attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401) {
    await useAuthStore.getState().refreshSession()
    return api(error.config)
  }
  return Promise.reject(error)
})
```

---

## Real-Time (Socket.io — lib/socket.ts)

```typescript
// Socket singleton — connects with access token
export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token: useAuthStore.getState().accessToken },
      transports: ['websocket'],
    })
  }
  return socket
}
```

### Key Events

| Direction | Event | Purpose |
|-----------|-------|---------|
| client → server | `message:send` | Send DM |
| client → server | `live:join` | Join live stream room |
| client → server | `live:tip` | Send coins during live |
| client → server | `live:chat` | Live chat message |
| server → client | `message:new` | Incoming DM |
| server → client | `notification:new` | New notification |
| server → client | `wallet:updated` | Balance changed |
| server → client | `live:chat_message` | Live chat |
| server → client | `live:tip_received` | Tip alert (creator) |

---

## BangCoins & Payments UI

### Top-Up Flow
1. `PackageSelector.tsx` — user picks coin package
2. `PaymentMethodModal.tsx` — select: Card (Stripe Element) / Google Pay / Apple Pay
3. `POST /wallet/topup` → `{ clientSecret }`
4. `stripe.confirmCardPayment(clientSecret)`
5. On success → `walletStore` balance updates + Sonner toast

### Cash-Out Flow (Creator)
1. Enter amount (min $10), select method (PayPal / Bank / Crypto)
2. Live fee preview: 25% platform tax + 2.5% processing fee
3. `POST /wallet/cashout` → pending payout in admin panel
4. Admin approves → backend fires Stripe Connect or PayPal payout

### Fee Formula
```
platformTax    = gross * 0.25
processingFee  = (gross - platformTax) * 0.025
netAmount      = gross - platformTax - processingFee
```

---

## Live Video (Agora RTC)

### Creator — Go Live
```typescript
const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
await client.setClientRole('host')
const { data: { token } } = await api.get(`/live/token/${channelId}`)
await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, channelId, token)
const [videoTrack, audioTrack] = await Promise.all([
  AgoraRTC.createCameraVideoTrack(),
  AgoraRTC.createMicrophoneAudioTrack(),
])
await client.publish([videoTrack, audioTrack])
```

### Viewer — Join Live
```typescript
const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
await client.setClientRole('audience')
await client.join(appId, channelId, token)
client.on('user-published', async (user, mediaType) => {
  await client.subscribe(user, mediaType)
  user.videoTrack?.play('live-player-container')
})
```

- Live chat is Socket.io alongside the Agora video player (`LiveChat.tsx`)

---

## Styling & Theming

### Theme Colors (tailwind.config.ts)
```typescript
colors: {
  brand: {
    red:     '#ff4757',
    dark:    '#121212',
    surface: '#161616',
    card:    '#171717',
    border:  '#222222',
    muted:   '#888888',
    text:    '#dddddd',
  }
}
```

### CSS Variables (globals.css)
```css
:root {
  --bg-primary: #121212;   --bg-surface: #161616;
  --bg-card: #171717;      --border: #222222;
  --text-primary: #ffffff; --text-muted: #aaaaaa;
  --accent: #ff4757;       --success: #51cf66;
  --warning: #ffb84d;
}
```

### Font: Poppins (400/600/700/800) via `next/font/google`

---

## Role-Based UI

```typescript
// hooks/useAuth.ts pattern
const { isUser, isCreator, isAdmin } = useAuth()

{isCreator && <GoLiveButton />}
{isUser && <BecomeCreatorBanner />}
{isAdmin && <AdminLink />}
```

### Sidebar Nav by Role
| Item | User | Creator | Admin |
|------|------|---------|-------|
| Home | ✅ | ✅ | — |
| Explore | ✅ | ✅ | — |
| Creator Center | — | ✅ | — |
| BangCoins | ✅ | ✅ | — |
| Admin Dashboard | — | — | ✅ |
| Settings | ✅ | ✅ | — |

---

## Forms & Validation

All forms: **React Hook Form** + **Zod** via `@hookform/resolvers/zod`.

```typescript
const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
  resolver: zodResolver(registerSchema),
})
```

---

## Component Architecture

- **Server Components** by default (Next.js App Router) — for data-fetching pages
- **`'use client'`** only for interactive/real-time parts (forms, modals, Socket listeners)
- Lazy-load heavy components: `dynamic(() => import('./LivePlayer'))` etc.
- Infinite scroll via React Query `useInfiniteQuery` (feed, explore)

---

## Planned Component Structure (not all built yet)

```
components/
├── ui/              # Button, Input, Modal, Badge, Avatar — reusable primitives
├── layout/          # Sidebar, AdminSidebar, MobileNav ← partially built
├── feed/            # PostCard, PostModal, StoriesRow, StoryLightbox
├── profile/         # ProfileHeader, PostGrid, SubscribersModal
├── messages/        # ConversationList, ThreadView, MessageInput, CallModal
├── bangcoins/       # PackageSelector, PaymentMethodModal, CashOutForm, TransactionTable
├── live/            # LivePlayer, LiveChat, GoLiveModal
├── explore/         # CreatorGrid, FiltersPanel, LiveBadge
├── admin/           # KpiCard, DataTable, PayoutRow
└── notifications/   # NotificationItem, NotificationFilters
```

---

## Dependencies Summary

| Pkg | Purpose |
|-----|---------|
| next | Framework (App Router, SSR) |
| react / react-dom | UI |
| zustand | Global state (auth, wallet, chat) |
| @tanstack/react-query | Server data fetching + caching |
| axios | HTTP client with interceptors |
| socket.io-client | Real-time WebSocket |
| agora-rtc-sdk-ng | Live video streaming |
| @stripe/react-stripe-js | Stripe card elements + payment request |
| @stripe/stripe-js | Stripe.js loader |
| react-hook-form | Form state management |
| zod | Schema validation |
| @hookform/resolvers | Connects Zod to React Hook Form |
| lucide-react | Icons |
| dayjs | Date formatting |
| sonner | Toast notifications |
| tailwind-merge + clsx | Conditional className utility |
| jose | JWT decode (client-side only) |

---

## Testing

| Type | Tool | Coverage |
|------|------|---------|
| Unit | Vitest | Hooks, utils, Zod schemas |
| Component | React Testing Library | PostCard, PackageSelector, CashOutForm |
| E2E | Playwright | auth, bangcoins, messaging, admin flows |

```bash
npx vitest run
npx playwright test
```

---

*Last updated: April 13, 2026*
