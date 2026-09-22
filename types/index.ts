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
  gender:      string | null
  dateOfBirth: string | null
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
  preferredPayoutMethod: 'PAYPAL' | 'BANK_TRANSFER'
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
  /** Populated only when isLocked=true – used for the blur teaser preview */
  previewKey?:   string | null
  createdAt:     string
}

// ─── Message ─────────────────────────────────────────────────────────────────
export interface Conversation {
  id:               string
  participant:      Pick<User, 'id' | 'username' | 'avatarKey'>
  creatorPricing:   { messagePrice: number; audioCallPricePerMin: number; videoCallPricePerMin: number } | null
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

// ─── Story ────────────────────────────────────────────────────────────────────
export interface Story {
  id:        string
  userId:    string
  mediaKey:  string
  mediaType: 'IMAGE' | 'VIDEO'
  caption:   string | null
  expiresAt: string
  createdAt: string
  hasViewed: boolean
  user:      Pick<User, 'id' | 'username' | 'displayName' | 'avatarKey' | 'isVerified'>
  _count:    { views: number }
}

export interface StoryGroup {
  user:    Pick<User, 'id' | 'username' | 'displayName' | 'avatarKey' | 'isVerified'>
  stories: Story[]
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
export type NotificationType = 'NEW_FOLLOWER' | 'NEW_SUBSCRIBER' | 'NEW_TIP' | 'NEW_COMMENT' | 'NEW_LIKE' | 'NEW_MESSAGE' | 'PAYOUT_SENT' | 'CONTENT_UNLOCK' | 'SYSTEM'

export interface Notification {
  id:         string
  type:       NotificationType
  actor:      Pick<User, 'username' | 'avatarKey'> | null
  body:       string | null
  refId:      string | null
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
  method:              'PAYPAL' | 'BANK_TRANSFER'
  status:              'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED'
  createdAt:           string
}

// ─── Live Stream ─────────────────────────────────────────────────────────────
export type StreamStatus    = 'SCHEDULED' | 'LIVE' | 'ENDED'
export type StreamVisibility = 'PUBLIC' | 'FOLLOWERS' | 'SUBSCRIBERS'

export interface LiveStream {
  id:             string
  creatorId:      string
  creator:        Pick<User, 'username' | 'displayName' | 'avatarKey' | 'isVerified'>
  title:          string
  thumbnailKey:   string | null
  agoraChannelId: string
  visibility:     StreamVisibility
  status:         StreamStatus
  viewerCount:    number
  maxViewers:     number
  startedAt:      string | null
  endedAt:        string | null
  createdAt:      string
  hasAccess?:     boolean
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data:    T
  meta?:   { page: number; perPage: number; total: number }
}
