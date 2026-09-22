'use client'
import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import api from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import { toast } from 'sonner'
import type { Post } from '@/types'

interface PostDetailModalProps {
  post: Post
  onClose: () => void
  currentUserId?: string
}

export default function PostDetailModal({ post, onClose, currentUserId }: PostDetailModalProps) {
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [loadingComments, setLoadingComments] = useState(true)

  useEffect(() => {
    api.get(`/posts/${post.id}/comments`)
      .then(r => setComments(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingComments(false))
  }, [post.id])

  const { mutate: toggleLike } = useMutation({
    mutationFn: (currentIsLiked: boolean) =>
      currentIsLiked
        ? api.delete(`/posts/${post.id}/like`)
        : api.post(`/posts/${post.id}/like`),
    onMutate: (currentIsLiked) => {
      setIsLiked(!currentIsLiked)
      setLikesCount(prev => currentIsLiked ? prev - 1 : prev + 1)
    },
    onError: (_err, currentIsLiked) => {
      setIsLiked(currentIsLiked)
      setLikesCount(prev => currentIsLiked ? prev + 1 : prev - 1)
      toast.error('Like konnte nicht aktualisiert werden')
    },
    onSuccess: (res) => {
      setIsLiked(res.data.data.isLiked)
      setLikesCount(res.data.data.likesCount)
    },
  })

  const { mutate: addComment, isPending: isCommenting } = useMutation({
    mutationFn: (body: string) => api.post(`/posts/${post.id}/comments`, { body }),
    onSuccess: (res) => {
      setComments(prev => [...prev, { ...res.data.data, replies: [] }])
      setCommentText('')
    },
    onError: () => toast.error('Kommentar konnte nicht hinzugefügt werden'),
  })

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div
        className="relative flex w-[90vw] max-w-[1000px] max-h-[90vh] rounded-lg overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center text-white transition"
          aria-label="Schließen"
        >
          <X size={18} />
        </button>

        {/* Left — post image (60%) */}
        <div className="flex-[6] bg-black flex items-center justify-center min-h-[400px]">
          {post.mediaKey && post.mediaType === 'VIDEO' ? (
            <video
              src={mediaUrl(post.mediaKey)!}
              controls
              className="max-w-full max-h-full object-contain"
            />
          ) : post.mediaKey ? (
            <img
              src={mediaUrl(post.mediaKey)!}
              alt={post.caption ?? ''}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-gray-400 text-center">{post.caption}</p>
            </div>
          )}
        </div>

        {/* Right — details (40%, white bg) */}
        <div className="flex-[4] flex flex-col bg-white min-w-0 max-h-[90vh]">
          {/* Author header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
              {post.creator.avatarKey ? (
                <img
                  src={mediaUrl(post.creator.avatarKey)!}
                  alt={post.creator.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                  {post.creator.username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">@{post.creator.username}</p>
            </div>
          </div>

          {/* Caption + time */}
          <div className="p-4 border-b border-gray-100 shrink-0">
            <p className="text-sm text-gray-900 leading-relaxed">
              <span className="font-semibold mr-1">@{post.creator.username}</span>
              {post.caption}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: de })}
            </p>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {loadingComments ? (
              <p className="text-center text-gray-400 text-sm py-4">Kommentare werden geladen...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">Noch keine Kommentare. Schreibe den ersten!</p>
            ) : (
              comments.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    {c.user?.avatarKey ? (
                      <img
                        src={mediaUrl(c.user.avatarKey)!}
                        alt={c.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">
                        {c.user?.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                      <span className="font-semibold text-sm text-gray-900 mr-1.5">@{c.user?.username}</span>
                      <span className="text-sm text-gray-800">{c.body}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-1">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: de })}
                      </span>
                      <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Gefällt mir</span>
                      <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Antworten</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reactions + counts */}
          <div className="border-t border-gray-200 p-3 shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => toggleLike(isLiked)}
                className="text-2xl leading-none transition-transform hover:scale-110 active:scale-95"
                aria-label={isLiked ? 'Gefällt mir entfernen' : 'Gefällt mir'}
              >
                {isLiked ? '❤️' : '🤍'}
              </button>
              <button className="text-2xl leading-none">💬</button>
              <button className="text-2xl leading-none">🎁</button>
              <button className="text-2xl leading-none">⚡</button>
              <p className="ml-auto text-sm font-semibold text-gray-900">
                {likesCount} Likes &nbsp;{comments.length} Kommentare
              </p>
            </div>
          </div>

          {/* Comment input */}
          <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Kommentar hinzufügen..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && commentText.trim() && !isCommenting) {
                  addComment(commentText.trim())
                }
              }}
              className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={() => commentText.trim() && !isCommenting && addComment(commentText.trim())}
              disabled={!commentText.trim() || isCommenting}
              className="text-sm font-semibold text-[#0095f6] disabled:opacity-30 transition-opacity"
            >
              Posten
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
