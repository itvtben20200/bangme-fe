// ─── Roles ──────────────────────────────────────────────────────────────────
export type Role = 'user' | 'creator' | 'admin'

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id:          string
  username:    string
  email:       string
  displayName: string | null
  avatarKey:   string | null
  bannerKey:   string | null
  bio:         string | null
  role:        Role
  isVerified:  boolean
  isBanned:    boolean
  lastSeenAt:  string | null
  createdAt:   string
}

// ─── Creator ─────────────────────────────────────────────────────────────────
export interface CreatorProfile {
  userId:               string
  monthlySubPrice:      number
  messagePrice:         number
  audioCallPricePerMin: number
  videoCallPricePerMin: number
  isLive:               boolean
  paypalEmail:          string | null
  preferredPayoutMethod: 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO'
}

// ─── Post ────────────────────────────────────────────────────────────────────
export interface Post {
  id:            string
  creatorId:     string
  creator:       Pick<User, 'username' | 'displayName' | 'avatarKey'> & {
    isVerified?: boolean
    creatorProfile?: { monthlySubPrice: number | null; isLive: boolean } | null
  }
  caption:       string | null
  mediaKey:      string | null
  mediaType:     'IMAGE' | 'VIDEO' | 'AUDIO' | null
  isPremium:     boolean
  premiumPrice:  number | null
  visibility:    'PUBLIC' | 'FOLLOWERS' | 'SUBSCRIBERS'
  likesCount:    number
  commentsCount: number
  isLiked:       boolean
  /** True when the viewer does not have subscription/follow access to this post */
  isLocked?:     boolean
  createdAt:     string
}

// ─── Message ─────────────────────────────────────────────────────────────────
export interface Conversation {
  id:               string
  participant:      Pick<User, 'id' | 'username' | 'avatarKey'>
  lastMessage:      string | null
  unreadCount:      number
  lastMessageAt:    string | null
  isOnline:         boolean
}

export interface Message {
  id:                string
  conversationId:    string
  senderId:          string
  body:              string | null
  mediaKey:          string | null
  type:              'TEXT' | 'IMAGE' | 'VIDEO' | 'CALL_LOG'
  bangcoinsCharged:  number
  createdAt:         string
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export type TransactionType    = 'TOPUP' | 'TIP' | 'SUBSCRIPTION' | 'MESSAGE' | 'CALL' | 'CONTENT_UNLOCK' | 'CASHOUT' | 'GHOST_MODE' | 'REFUND'
export type TransactionStatus  = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'

export interface Transaction {
  id:                   string
  type:                 TransactionType
  bangcoinsAmount:      number
  usdAmount:            number
  platformFeeUsd:       number
  processingFeeUsd:     number
  netUsd:               number
  status:               TransactionStatus
  paymentMethod:        string | null
  note:                 string | null
  createdAt:            string
}

// ─── Notification ────────────────────────────────────────────────────────────
export type NotificationType = 'NEW_FOLLOWER' | 'NEW_SUBSCRIBER' | 'NEW_TIP' | 'NEW_COMMENT' | 'NEW_LIKE' | 'NEW_MESSAGE' | 'PAYOUT_SENT' | 'SYSTEM'

export interface Notification {
  id:         string
  type:       NotificationType
  actor:      Pick<User, 'username' | 'avatarKey'> | null
  body:       string | null
  isRead:     boolean
  createdAt:  string
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers:     number
  activeCreators: number
  revenue30d:     number
  chargebacks:    number
}

export interface Payout {
  id:                  string
  creatorId:           string
  creator:             Pick<User, 'username' | 'avatarKey'>
  amountRequestedUsd:  number
  netPayoutUsd:        number
  method:              'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO'
  status:              'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED'
  createdAt:           string
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data:    T
  meta?:   { page: number; perPage: number; total: number }
}
