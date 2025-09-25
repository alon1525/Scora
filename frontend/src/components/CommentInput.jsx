import React, { useState } from 'react';

const CommentInput = ({ 
  value = '', 
  onChange, 
  onSave, 
  onCancel, 
  isVisible = false, 
  maxLength = 200,
  placeholder = "Add a comment (optional)..."
}) => {
  const [comment, setComment] = useState(value);
  const [isExpanded, setIsExpanded] = useState(isVisible);

  const handleSave = () => {
    if (onSave) {
      onSave(comment.trim());
    }
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setComment(value);
    setIsExpanded(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isExpanded) {
    return (
      <button
        className="comment-toggle-btn"
        onClick={() => setIsExpanded(true)}
        title="Add a comment"
      >
        <span className="material-symbols-outlined">comment</span>
        {value ? 'Edit comment' : 'Add comment'}
      </button>
    );
  }

  return (
    <div className="comment-input-container">
      <div className="comment-input-header">
        <span className="material-symbols-outlined">comment</span>
        <span>Add a comment</span>
        <button 
          className="comment-close-btn"
          onClick={handleCancel}
          title="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <textarea
        className="comment-textarea"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        autoFocus
      />
      
      <div className="comment-input-footer">
        <div className="comment-char-count">
          {comment.length}/{maxLength}
        </div>
        <div className="comment-actions">
          <button 
            className="comment-cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="comment-save-btn"
            onClick={handleSave}
            disabled={comment.trim() === value.trim()}
          >
            Save
          </button>
        </div>
      </div>
      
      <div className="comment-hint">
        Press Ctrl+Enter to save, Esc to cancel
      </div>
    </div>
  );
};

export default CommentInput;
