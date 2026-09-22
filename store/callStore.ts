import { create } from 'zustand'

export type CallType   = 'audio' | 'video'
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'active'

export interface IncomingCall {
  callerId:       string
  callerUsername: string
  conversationId: string
  callType:       CallType
  channel:        string
}

export interface ActiveCall {
  conversationId: string
  callType:       CallType
  channel:        string
  startedAt:      number
  /** userId of the remote participant (used for billing) */
  remoteUserId:   string
}

interface CallState {
  status:       CallStatus
  incoming:     IncomingCall | null
  active:       ActiveCall  | null

  setIncoming:  (call: IncomingCall) => void
  setCalling:   (call: Omit<ActiveCall, 'startedAt'>) => void
  setActive:    () => void
  endCall:      () => void
  clearCall:    () => void
}

export const useCallStore = create<CallState>((set) => ({
  status:  'idle',
  incoming: null,
  active:   null,

  setIncoming: (call) => set({ status: 'ringing', incoming: call }),

  setCalling: (call) => set({
    status: 'calling',
    incoming: null,
    active: { ...call, startedAt: Date.now() },
  }),

  setActive: () => set((s) => ({
    status: 'active',
    active: s.active ? { ...s.active, startedAt: Date.now() } : s.active,
  })),

  endCall:   () => set({ status: 'idle', incoming: null, active: null }),
  clearCall: () => set({ status: 'idle', incoming: null, active: null }),
}))
