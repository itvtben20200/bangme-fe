'use client'
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Lock, Coins, Pencil, CornerDownRight } from 'lucide-react'
import EditPostModal from '@/components/EditPostModal'
import Link from 'next/link'
import { toast } from 'sonner'
import api from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface PostCardProps {
  post: {
    id: string
    caption?: string | null
    mediaKey?: string | null
    previewKey?: string | null
    mediaType?: string | null
    likesCount: number
    commentsCount: number
    isLiked: boolean
    createdAt: string
    isPremium?: boolean
    premiumPrice?: number | null
    /** Viewer does not have the required subscription/follow to see the media */
    isLocked?: boolean
    visibility?: 'PUBLIC' | 'FOLLOWERS' | 'SUBSCRIBERS'
    creator: {
      username: string
      displayName?: string | null
      avatarKey?: string | null
      isVerified?: boolean
      creatorProfile?: { monthlySubPrice: number | null } | null
    }
  }
  currentUserId?: string
  onDelete?: () => void
  onPostClick?: (post: PostCardProps['post']) => void
}

export default function PostCard({ post, currentUserId, onDelete, onPostClick }: PostCardProps) {
  const qc = useQueryClient()
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [showMenu, setShowMenu] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [unlockedMediaKey, setUnlockedMediaKey] = useState<string | null>(null)
  const isUnlocked = !!unlockedMediaKey
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const effectiveMediaKey = unlockedMediaKey ?? post.mediaKey
  const viewablePost = isUnlocked ? { ...post, mediaKey: effectiveMediaKey, isLocked: false } : post

  useEffect(() => {
    setIsLiked(post.isLiked)
    setLikesCount(post.likesCount)
  }, [post.id, post.isLiked, post.likesCount])

  const isOwner = currentUserId === post.creator.username

  // Like/Unlike mutation
  // Pass the current liked-state as a variable so mutationFn and onMutate
  // always act on the value at the moment of the click (no stale closures).
  const { mutate: toggleLike, isPending: isLiking } = useMutation({
    mutationFn: async (currentIsLiked: boolean) => {
      if (currentIsLiked) {
        return api.delete(`/posts/${post.id}/like`)
      } else {
        return api.post(`/posts/${post.id}/like`)
      }
    },
    onMutate: (currentIsLiked: boolean) => {
      // Snapshot current values so we can roll back on error
      const prevIsLiked    = isLiked
      const prevLikesCount = likesCount
      // Optimistic update
      setIsLiked(!currentIsLiked)
      setLikesCount(prev => currentIsLiked ? prev - 1 : prev + 1)
      return { prevIsLiked, prevLikesCount }
    },
    onError: (_err, _vars, context) => {
      // Roll back using the snapshot captured in onMutate
      if (context) {
        setIsLiked(context.prevIsLiked)
        setLikesCount(context.prevLikesCount)
      }
      toast.error('Like konnte nicht aktualisiert werden')
    },
    onSuccess: (response) => {
      setIsLiked(response.data.data.isLiked)
      setLikesCount(response.data.data.likesCount)
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['post', post.id] })
      qc.invalidateQueries({ queryKey: ['creator-posts'] })
    },
  })

  // Unlock premium post mutation
  const { mutate: unlockPost, isPending: isUnlocking } = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/unlock`),
    onSuccess: (res) => {
      setUnlockedMediaKey((res.data.mediaKey ?? res.data.data?.mediaKey) as string)
      toast.success(`Beitrag freigeschaltet! ${post.premiumPrice} BangCoins wurden berechnet.`)
      qc.invalidateQueries({ queryKey: ['wallet'] })
    },
    onError: (err: any) => {
      if (err?.response?.status === 402) {
        toast.error('Nicht genug BangCoins - lade dein Guthaben auf.')
      } else {
        toast.error(err?.response?.data?.message ?? 'Beitrag konnte nicht freigeschaltet werden')
      }
    },
  })

  // Delete post mutation
  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: () => api.delete(`/posts/${post.id}`),
    onSuccess: () => {
      toast.success('Beitrag gelöscht')
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      onDelete?.()
    },
    onError: () => {
      toast.error('Beitrag konnte nicht gelöscht werden')
    },
  })

  // Load comments
  const loadComments = async () => {
    if (comments.length > 0) return   // already loaded
    setLoadingComments(true)
    try {
      const response = await api.get(`/posts/${post.id}/comments`)
      setComments(response.data.data)
    } catch {
      toast.error('Kommentare konnten nicht geladen werden')
    } finally {
      setLoadingComments(false)
    }
  }

  // Add comment / reply mutation
  const { mutate: addComment, isPending: isCommenting } = useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: string }) =>
      api.post(`/posts/${post.id}/comments`, { body, parentId }),
    onSuccess: (response, variables) => {
      const newComment = response.data.data
      if (variables.parentId) {
        // Append reply inside its parent comment
        setComments(prev =>
          prev.map(c =>
            c.id === variables.parentId
              ? { ...c, replies: [...(c.replies ?? []), newComment] }
              : c
          )
        )
        // Auto-expand replies for that parent
        setExpandedReplies(prev => ({ ...prev, [variables.parentId!]: true }))
      } else {
        setComments(prev => [{ ...newComment, replies: [], isLiked: false, likesCount: 0 }, ...prev])
      }
      setCommentText('')
      setReplyingTo(null)
    },
    onError: () => {
      toast.error('Kommentar konnte nicht hinzugefügt werden')
    },
  })

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (commentText.trim()) {
      addComment({ body: commentText.trim(), parentId: replyingTo?.id })
    }
  }

  const handleReply = (comment: { id: string; user: { username: string } }) => {
    setReplyingTo({ id: comment.id, username: comment.user.username })
    setCommentText('')
    if (!showComments) {
      setShowComments(true)
      loadComments()
    }
  }

  const toggleCommentLike = (commentId: string, currentIsLiked: boolean, isReply?: boolean, parentId?: string) => {
    // Optimistic toggle
    const applyToggle = (list: any[]): any[] =>
      list.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !currentIsLiked,
            likesCount: currentIsLiked ? Math.max(0, (c.likesCount ?? 0) - 1) : (c.likesCount ?? 0) + 1,
          }
        }
        if (isReply && c.id === parentId && c.replies) {
          return { ...c, replies: applyToggle(c.replies) }
        }
        return c
      })
    setComments(prev => applyToggle(prev))

    const req = currentIsLiked
      ? api.delete(`/posts/${post.id}/comments/${commentId}/like`)
      : api.post(`/posts/${post.id}/comments/${commentId}/like`)

    req.then(res => {
      const { isLiked, likesCount } = res.data.data
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) return { ...c, isLiked, likesCount }
          if (isReply && c.id === parentId && c.replies) {
            return { ...c, replies: c.replies.map((r: any) => r.id === commentId ? { ...r, isLiked, likesCount } : r) }
          }
          return c
        })
      )
    }).catch(() => {
      // Roll back optimistic update
      setComments(prev => applyToggle(prev))
      toast.error('Like konnte nicht aktualisiert werden')
    })
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }))
  }

  const toggleCommentsSection = () => {
    setShowComments(!showComments)
    if (!showComments) {
      loadComments()
    }
  }

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`
    
    // Try native share API first (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Beitrag von ${post.creator.displayName || post.creator.username}`,
          text: post.caption || 'Sieh dir diesen Beitrag an!',
          url: postUrl,
        })
        toast.success('Beitrag geteilt!')
        return
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(postUrl)
      toast.success('Link in die Zwischenablage kopiert!')
    } catch {
      toast.error('Link konnte nicht kopiert werden')
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800">
      {showEdit && (
        <EditPostModal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          post={{
            id: post.id,
            caption: post.caption,
            mediaKey: post.mediaKey,
            mediaType: post.mediaType,
            visibility: post.visibility,
          }}
        />
      )}
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link href={`/creator/${post.creator.username}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            {post.creator.avatarKey ? (
              <img src={mediaUrl(post.creator.avatarKey)!} alt={post.creator.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {post.creator.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-semibold hover:underline">
                {post.creator.displayName || post.creator.username}
              </span>
              {post.creator.isVerified && (
                <svg className="w-4 h-4 text-[#ff0618]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 0l2.5 6.5L19 7.5l-5.5 4.5L15 19l-5-3.5L5 19l1.5-7L1 7.5l6.5-1z" />
                </svg>
              )}
            </div>
            <span className="text-gray-400 text-sm">
              @{post.creator.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
        </Link>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-700 z-10">
                <button
                  onClick={() => { setShowMenu(false); setShowEdit(true) }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-gray-800 flex items-center gap-2 rounded-lg"
                >
                  <Pencil size={16} />
                  Beitrag bearbeiten
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    deletePost()
                  }}
                  disabled={isDeleting}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800 flex items-center gap-2 rounded-lg"
                >
                  <Trash2 size={16} />
                  {isDeleting ? 'Wird gelöscht...' : 'Beitrag löschen'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div
          className={`px-4 pb-3 ${onPostClick ? 'cursor-pointer' : ''}`}
          onClick={() => onPostClick?.(viewablePost)}
        >
          <p className="text-white whitespace-pre-wrap">{post.caption}</p>
        </div>
      )}

      {/* Media — locked state */}
      {post.isLocked && !isUnlocked && (
        <div className="relative border-t border-gray-800 overflow-hidden">
          {/* Blurred background preview — drives container height */}
          {post.previewKey ? (
            post.mediaType === 'VIDEO' ? (
              <video
                src={mediaUrl(post.previewKey)!}
                className="w-full max-h-[500px] object-cover block"
                style={{ filter: 'blur(12px)', transform: 'scale(1.12)', transformOrigin: 'center' }}
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
            ) : (
              <img
                src={mediaUrl(post.previewKey)!}
                alt=""
                className="w-full max-h-[500px] object-cover block"
                style={{ filter: 'blur(12px)', transform: 'scale(1.12)', transformOrigin: 'center' }}
                aria-hidden="true"
              />
            )
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-gray-900 to-[#1a1a1a]" />
          )}
          {/* Semi-transparent overlay + lock UI — matches mockup style */}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 px-6 text-center">
            {post.isPremium ? (
              <>
                <p className="text-white font-bold text-base drop-shadow-lg">
                  {post.premiumPrice} BangCoin{post.premiumPrice !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => unlockPost()}
                  disabled={isUnlocking}
                  className="flex items-center gap-2 px-5 py-2 bg-[#ff0618] hover:bg-[#ff0618] disabled:opacity-60 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-[#ff0618]/30"
                >
                  <Coins size={15} />
                  {isUnlocking ? 'Wird freigeschaltet...' : 'Freischalten'}
                </button>
              </>
            ) : (
              <>
                <p className="text-white font-bold text-sm drop-shadow-lg">
                  {post.visibility === 'FOLLOWERS' ? 'Nur für Follower' : 'Nur für Abonnenten'}
                </p>
                {post.visibility === 'SUBSCRIBERS' && (
                  <Link
                    href={`/subscribe/${post.creator.username}`}
                    className="px-5 py-2 bg-[#ff0618] hover:bg-[#ff0618] text-white text-sm font-bold rounded-lg transition shadow-lg shadow-[#ff0618]/30"
                  >
                    Abonnieren{post.creator.creatorProfile?.monthlySubPrice
                      ? ` · $${post.creator.creatorProfile.monthlySubPrice}/mo`
                      : ''}
                  </Link>
                )}
                {post.visibility === 'FOLLOWERS' && (
                  <p className="text-gray-300 text-xs drop-shadow-lg">Folge diesem Creator, um den Inhalt zu sehen</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Media — unlocked state (also shows locally unlocked premium posts) */}
      {(!post.isLocked || isUnlocked) && effectiveMediaKey && (
        <div
          className={`relative bg-black ${onPostClick ? 'cursor-pointer' : ''}`}
          onClick={() => onPostClick?.(viewablePost)}
        >
          {post.mediaType === 'IMAGE' ? (
            <img
              src={mediaUrl(effectiveMediaKey)!}
              alt="Beitragsinhalt"
              className="w-full max-h-[600px] object-contain"
            />
          ) : post.mediaType === 'VIDEO' ? (
            <video
              src={mediaUrl(effectiveMediaKey)!}
              controls
              className="w-full max-h-[600px]"
              onClick={e => e.stopPropagation()}
            />
          ) : null}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-6">
          <button
            onClick={() => toggleLike(isLiked)}
            disabled={isLiking}
            className="flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Heart
              size={24}
              className={isLiked ? 'fill-[#ff0618] text-[#ff0618]' : 'text-gray-400 hover:text-[#ff0618]'}
            />
            <span className={isLiked ? 'text-[#ff0618] font-semibold' : 'text-gray-400'}>
              {likesCount}
            </span>
          </button>
          <button
            onClick={toggleCommentsSection}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <MessageCircle size={24} />
            <span>{post.commentsCount}</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            title="Beitrag teilen"
          >
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#2a2a2a] rounded-lg px-3 py-2">
              <CornerDownRight size={14} className="text-[#ff0618]" />
              <span>Antwort an <span className="text-white font-semibold">@{replyingTo.username}</span></span>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-auto text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? `Antwort an @${replyingTo.username}...` : 'Kommentar hinzufügen...'}
              className="flex-1 bg-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0618]"
              disabled={isCommenting}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isCommenting}
              className="px-4 py-2 bg-[#ff0618] text-white rounded-lg hover:bg-[#ff0618] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isCommenting ? 'Wird gepostet...' : 'Posten'}
            </button>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center text-gray-400 py-4">Kommentare werden geladen...</div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    {comment.user.avatarKey ? (
                      <img src={mediaUrl(comment.user.avatarKey)!} alt={comment.user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                        {comment.user.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">
                        {comment.user.displayName || comment.user.username}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{comment.body}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <button
                        onClick={() => toggleCommentLike(comment.id, comment.isLiked)}
                        className="flex items-center gap-1 text-xs transition-colors"
                      >
                        <Heart
                          size={13}
                          className={comment.isLiked ? 'fill-[#ff0618] text-[#ff0618]' : 'text-gray-500 hover:text-[#ff0618]'}
                        />
                        <span className={comment.isLiked ? 'text-[#ff0618]' : 'text-gray-500'}>
                          {comment.isLiked ? 'Gefällt dir' : 'Gefällt mir'}{comment.likesCount > 0 ? ` · ${comment.likesCount}` : ''}
                        </span>
                      </button>
                      <button
                        onClick={() => handleReply(comment)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        <CornerDownRight size={13} />
                        Antworten
                      </button>
                    </div>

                    {/* View / hide replies */}
                    {comment.replies?.length > 0 && (
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="mt-2 flex items-center gap-1 text-xs text-[#ff0618] hover:text-[#ff0618] transition-colors font-medium"
                      >
                        <CornerDownRight size={13} />
                        {expandedReplies[comment.id]
                          ? 'Antworten ausblenden'
                          : `${comment.replies.length} Antwort${comment.replies.length === 1 ? '' : 'en'} anzeigen`}
                      </button>
                    )}

                    {/* Nested replies */}
                    {expandedReplies[comment.id] && comment.replies?.length > 0 && (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-700">
                        {comment.replies.map((reply: any) => (
                          <div key={reply.id} className="flex gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                              {reply.user.avatarKey ? (
                                <img src={mediaUrl(reply.user.avatarKey)!} alt={reply.user.username} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                  {reply.user.username[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-xs">
                                  {reply.user.displayName || reply.user.username}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-gray-300 text-xs mt-0.5">{reply.body}</p>
                              <button
                                onClick={() => toggleCommentLike(reply.id, reply.isLiked, true, comment.id)}
                                className="flex items-center gap-1 text-xs mt-1 transition-colors"
                              >
                                <Heart
                                  size={11}
                                  className={reply.isLiked ? 'fill-[#ff0618] text-[#ff0618]' : 'text-gray-500 hover:text-[#ff0618]'}
                                />
                                <span className={reply.isLiked ? 'text-[#ff0618]' : 'text-gray-500'}>
                                  {reply.isLiked ? 'Gefällt dir' : 'Gefällt mir'}{reply.likesCount > 0 ? ` · ${reply.likesCount}` : ''}
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">Noch keine Kommentare. Schreibe den ersten Kommentar!</div>
          )}
        </div>
      )}
    </div>
  )
}
