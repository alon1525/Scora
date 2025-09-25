import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../config/api';

const CommentsModal = ({ isOpen, onClose, fixtureId, fixtureTitle }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [sortBy, setSortBy] = useState('likes'); // 'likes' or 'newest'

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen && fixtureId) {
      loadComments();
    }
  }, [isOpen, fixtureId, sortBy]);

  const loadComments = async (page = 1) => {
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}/${fixtureId}?page=${page}&limit=5&sort=${sortBy}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setComments(data.data.comments);
        setPagination(data.data.pagination);
      } else {
        toast.error('Failed to load comments');
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Error loading comments');
    } finally {
      setLoading(false);
    }
  };

  // Simple profanity filter
  const profanityWords = [
    'fuck', 'shit', 'damn', 'bitch', 'ass', 'asshole', 'bastard', 'cunt', 'piss', 'hell',
    'crap', 'dick', 'cock', 'pussy', 'fag', 'faggot', 'nigger', 'nigga', 'retard', 'stupid',
    'idiot', 'moron', 'dumb', 'hate', 'kill', 'die', 'death', 'suicide', 'murder'
  ];

  const filterProfanity = (text) => {
    let filteredText = text;
    profanityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    return filteredText;
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Check character limit
    if (newComment.length > 100) {
      toast.error('Comment must be 100 characters or less');
      return;
    }

    // Filter profanity
    const filteredComment = filterProfanity(newComment.trim());
    
    setSubmitting(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}/${fixtureId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: filteredComment })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewComment('');
        loadComments(1); // Reload first page
        toast.success('Comment added!');
      } else {
        toast.error(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error adding comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId, isLiked) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the comment in the local state with the correct data from backend
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes_count: data.data.likes_count,
                // Update liked_by_users based on the like state
                liked_by_users: data.data.is_liked 
                  ? [...comment.liked_by_users, user.id] // Add current user
                  : comment.liked_by_users.filter(id => id !== user.id) // Remove current user
              }
            : comment
        ));
      } else {
        // Show the specific error message from backend
        toast.error(data.error || 'Failed to like comment');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Error liking comment');
    }
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPagination({ page: 1, total: 0, pages: 0 });
  };

  const handleLoadMore = () => {
    loadComments(pagination.page + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comments-modal-header">
          <h3>Comments - {fixtureTitle}</h3>
          <button className="comments-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="comments-modal-content">
          {/* Sort Options */}
          <div className="comments-sort">
            <button 
              className={`sort-btn ${sortBy === 'likes' ? 'active' : ''}`}
              onClick={() => handleSortChange('likes')}
            >
              Most Liked
            </button>
            <button 
              className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`}
              onClick={() => handleSortChange('newest')}
            >
              Newest
            </button>
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleSubmitComment} className="comments-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={100}
              rows={3}
              className="comments-textarea"
            />
            <div className="comments-form-footer">
              <span className={`char-count ${newComment.length > 100 ? 'char-limit-exceeded' : ''}`}>
                {newComment.length}/100
              </span>
              <button 
                type="submit" 
                disabled={!newComment.trim() || submitting}
                className="comments-submit-btn"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {loading ? (
              <div className="comments-loading">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="comments-empty">No comments yet. Be the first to comment!</div>
            ) : (
              comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  onLike={handleLike}
                />
              ))
            )}
          </div>

          {/* Load More Button */}
          {pagination.page < pagination.pages && (
            <button 
              onClick={handleLoadMore}
              className="comments-load-more"
              disabled={loading}
            >
              {loading ? 'Loading...' : `Load More (${pagination.page}/${pagination.pages})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Individual Comment Component
const CommentItem = ({ comment, onLike, onEdit, onDelete }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [isOwnComment, setIsOwnComment] = useState(false);

  useEffect(() => {
    // Check if current user liked this comment and if it's their own comment
    const checkUserLike = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLiked(comment.liked_by_users.includes(user.id));
        setIsOwnComment(comment.user_id === user.id);
      }
    };
    checkUserLike();
  }, [comment.liked_by_users, comment.user_id]);

  const handleLike = async () => {
    // Don't update UI optimistically - wait for backend response
    await onLike(comment.id, isLiked);
  };


  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await onDelete(comment.id);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`comment-item ${isOwnComment ? 'own-comment' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <span className="comment-author-name">
            {comment.user_profiles?.display_name || comment.user_profiles?.email?.split('@')[0] || 'Anonymous'}
            {isOwnComment && <span className="own-comment-badge">(You)</span>}
            <span className="comment-date">
              • {formatDate(comment.created_at)}
              {comment.is_edited && ' (edited)'}
            </span>
          </span>
        </div>
        {isOwnComment && (
          <button 
            className="comment-delete-btn"
            onClick={handleDelete}
            title="Delete comment"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        )}
      </div>
      
      <div className="comment-content">
        {comment.comment}
      </div>
      
      <div className="comment-actions">
        <button 
          className={`comment-like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isOwnComment}
          title={isOwnComment ? "Can't like your own comment" : isLiked ? 'Unlike' : 'Like'}
        >
          <span className="material-symbols-outlined">
            {isLiked ? 'favorite' : 'favorite_border'}
          </span>
          <span>{likesCount}</span>
        </button>
      </div>
    </div>
  );
};

export default CommentsModal;
