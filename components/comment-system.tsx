"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrigamiButton } from "@/components/ui/origami-button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Heart, Flag, ArrowUpDown } from "@/components/simple-icons"

interface Comment {
  id: string
  user: {
    name: string
    avatar: string
    verified: boolean
  }
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
  replies?: Comment[]
  createdAt?: number // Added for sorting
}

interface CommentSystemProps {
  nftId: string
  comments: Comment[]
}

type SortOption = "newest" | "oldest" | "most-liked" | "most-replies"

export function CommentSystem({ nftId, comments: initialComments }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest") // Added sort state

  const sortedComments = useMemo(() => {
    const commentsWithTimestamp = comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt || Date.now() - Math.random() * 86400000, // Fallback for existing comments
    }))

    switch (sortBy) {
      case "oldest":
        return commentsWithTimestamp.sort((a, b) => a.createdAt - b.createdAt)
      case "most-liked":
        return commentsWithTimestamp.sort((a, b) => b.likes - a.likes)
      case "most-replies":
        return commentsWithTimestamp.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0))
      case "newest":
      default:
        return commentsWithTimestamp.sort((a, b) => b.createdAt - a.createdAt)
    }
  }, [comments, sortBy])

  const addComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      user: {
        name: "Current User",
        avatar: "/placeholder.svg",
        verified: false,
      },
      content: newComment,
      timestamp: "Just now",
      likes: 0,
      isLiked: false,
      createdAt: Date.now(), // Added timestamp for sorting
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  const addReply = (parentId: string) => {
    if (!replyContent.trim()) return

    const reply: Comment = {
      id: Date.now().toString(),
      user: {
        name: "Current User",
        avatar: "/placeholder.svg",
        verified: false,
      },
      content: replyContent,
      timestamp: "Just now",
      likes: 0,
      isLiked: false,
      createdAt: Date.now(), // Added timestamp for sorting
    }

    setComments(
      comments.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          }
        }
        return comment
      }),
    )

    setReplyContent("")
    setReplyingTo(null)
  }

  const toggleLike = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          }
        }
        return comment
      }),
    )
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? "ml-12" : ""}`}>
      <div className="flex space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
          <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-foreground text-sm">{comment.user.name}</span>
            {comment.user.verified && <Badge className="bg-blue-500/10 text-blue-500 text-xs">Verified</Badge>}
            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
          </div>

          <p className="text-sm text-foreground mb-2">{comment.content}</p>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => toggleLike(comment.id)}
              className={`flex items-center space-x-1 text-xs transition-colors ${
                comment.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart className="w-3 h-3" fill={comment.isLiked ? "currentColor" : "none"} />
              <span>{comment.likes}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Reply
              </button>
            )}

            <button className="text-xs text-muted-foreground hover:text-red-500 transition-colors">
              <Flag className="w-3 h-3" />
            </button>
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
              />
              <div className="flex space-x-2">
                <OrigamiButton variant="primary" size="sm" onClick={() => addReply(comment.id)}>
                  Reply
                </OrigamiButton>
                <OrigamiButton variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                  Cancel
                </OrigamiButton>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Card className="origami-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Comments ({comments.length})</span>
          </CardTitle>

          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="most-liked">Most liked</SelectItem>
                <SelectItem value="most-replies">Most replies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment */}
        <div className="space-y-3">
          <Textarea
            placeholder="Share your thoughts about this NFT..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <OrigamiButton variant="primary" onClick={addComment} disabled={!newComment.trim()}>
              Post Comment
            </OrigamiButton>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          {comments.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
