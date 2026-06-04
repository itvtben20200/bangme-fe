'use client'
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Lock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import api from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface PostCardProps {
  post: {
    id: string
    caption?: string | null
    mediaKey?: string | null
    mediaType?: string | null
    likesCount: number
    commentsCount: number
    isLiked: boolean
    createdAt: string
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
}

export default function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const qc = useQueryClient()
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)

  useEffect(() => {
    setIsLiked(post.isLiked)
    setLikesCount(post.likesCount)
  }, [post.id, post.isLiked, post.likesCount])

  const isOwner = currentUserId === post.creator.username

  // Like/Unlike mutation
  const { mutate: toggleLike } = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        return api.delete(`/posts/${post.id}/like`)
      } else {
        return api.post(`/posts/${post.id}/like`)
      }
    },
    onMutate: () => {
      // Optimistic update
      setIsLiked(prev => !prev)
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
    },
    onError: () => {
      // Revert on error
      setIsLiked(prev => !prev)
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1)
      toast.error('Failed to update like')
    },
    onSuccess: (response) => {
      setIsLiked(response.data.data.isLiked)
      setLikesCount(response.data.data.likesCount)
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['post', post.id] })
      qc.invalidateQueries({ queryKey: ['creator-posts'] })
    },
  })

  // Delete post mutation
  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: () => api.delete(`/posts/${post.id}`),
    onSuccess: () => {
      toast.success('Post deleted')
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      onDelete?.()
    },
    onError: () => {
      toast.error('Failed to delete post')
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
      toast.error('Failed to load comments')
    } finally {
      setLoadingComments(false)
    }
  }

  // Add comment mutation
  const { mutate: addComment, isPending: isCommenting } = useMutation({
    mutationFn: (body: string) => api.post(`/posts/${post.id}/comments`, { body }),
    onSuccess: (response) => {
      setComments([response.data.data, ...comments])
      setCommentText('')
      toast.success('Comment added')
      qc.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: () => {
      toast.error('Failed to add comment')
    },
  })

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (commentText.trim()) {
      addComment(commentText.trim())
    }
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
          title: `Post by ${post.creator.displayName || post.creator.username}`,
          text: post.caption || 'Check out this post!',
          url: postUrl,
        })
        toast.success('Post shared!')
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
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800">
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
                <svg className="w-4 h-4 text-[#ff4757]" fill="currentColor" viewBox="0 0 20 20">
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
                  onClick={() => {
                    setShowMenu(false)
                    deletePost()
                  }}
                  disabled={isDeleting}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800 flex items-center gap-2 rounded-lg"
                >
                  <Trash2 size={16} />
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-white whitespace-pre-wrap">{post.caption}</p>
        </div>
      )}

      {/* Media — locked state */}
      {post.isLocked && (
        <div className="relative bg-gradient-to-br from-gray-900 to-[#1a1a1a] border-t border-gray-800">
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#ff4757]/15 flex items-center justify-center">
              <Lock size={28} className="text-[#ff4757]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                {post.visibility === 'FOLLOWERS' ? 'Followers-only content' : 'Subscriber-only content'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {post.visibility === 'FOLLOWERS'
                  ? 'Follow this creator to see this post'
                  : 'Subscribe to unlock this post'}
              </p>
            </div>
            {post.visibility === 'SUBSCRIBERS' && (
              <Link
                href={`/subscribe/${post.creator.username}`}
                className="mt-1 px-5 py-2 bg-[#ff4757] hover:bg-[#ff2f43] text-white text-sm font-bold rounded-lg transition"
              >
                Subscribe
                {post.creator.creatorProfile?.monthlySubPrice
                  ? ` · $${post.creator.creatorProfile.monthlySubPrice}/mo`
                  : ''}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Media — unlocked state */}
      {!post.isLocked && post.mediaKey && (
        <div className="relative bg-black">
          {post.mediaType === 'IMAGE' ? (
            <img
              src={mediaUrl(post.mediaKey)!}
              alt="Post content"
              className="w-full max-h-[600px] object-contain"
            />
          ) : post.mediaType === 'VIDEO' ? (
            <video
              src={mediaUrl(post.mediaKey)!}
              controls
              className="w-full max-h-[600px]"
            />
          ) : null}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-6">
          <button
            onClick={() => toggleLike()}
            className="flex items-center gap-2 transition-colors"
          >
            <Heart
              size={24}
              className={isLiked ? 'fill-[#ff4757] text-[#ff4757]' : 'text-gray-400 hover:text-[#ff4757]'}
            />
            <span className={isLiked ? 'text-[#ff4757] font-semibold' : 'text-gray-400'}>
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
            title="Share post"
          >
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff4757]"
              disabled={isCommenting}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isCommenting}
              className="px-4 py-2 bg-[#ff4757] text-white rounded-lg hover:bg-[#ff2f43] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isCommenting ? 'Posting...' : 'Post'}
            </button>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center text-gray-400 py-4">Loading comments...</div>
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">No comments yet. Be the first to comment!</div>
          )}
        </div>
      )}
    </div>
  )
}
