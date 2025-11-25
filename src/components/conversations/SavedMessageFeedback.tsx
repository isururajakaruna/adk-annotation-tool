'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, X } from 'lucide-react';

interface SavedMessageFeedbackProps {
  conversationId: string;
  invocationId: string;
  existingRating?: number;  // Will be _custom_rating (1-5 stars)
  existingComment?: string;  // Will be _custom_feedback
  onUpdate?: () => void;
  hasToolCalls?: boolean;
}

export function SavedMessageFeedback({
  conversationId,
  invocationId,
  existingRating,
  existingComment,
  onUpdate,
  hasToolCalls = false,
}: SavedMessageFeedbackProps) {
  const [rating, setRating] = useState<number | undefined>(existingRating);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [comment, setComment] = useState(existingComment || '');
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleRating = async (newRating: number) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/conversations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          invocationId,
          rating: newRating,
          feedback: comment || undefined,
        }),
      });

      if (response.ok) {
        setRating(newRating);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Failed to save rating:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommentSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/conversations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          invocationId,
          rating: rating,
          feedback: comment.trim() || undefined,
        }),
      });

      if (response.ok) {
        setIsCommentOpen(false);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Failed to save comment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`mt-2 ${hasToolCalls ? 'ml-0' : ''}`}>
      {/* 5-Star Rating */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = rating && star <= rating;
            const isHovered = hoveredStar !== null && star <= hoveredStar;
            
            return (
              <button
                key={star}
                onClick={() => handleRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                disabled={isSaving}
                className={`
                  p-1 transition-all
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={`${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  size={20}
                  className={`
                    transition-all
                    ${isActive || isHovered
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                    }
                    ${isHovered && 'scale-110'}
                  `}
                />
              </button>
            );
          })}
        </div>

        {rating && (
          <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
            {rating} / 5
          </span>
        )}

        <button
          onClick={() => setIsCommentOpen(!isCommentOpen)}
          className={`
            p-2 rounded-lg transition-all ml-2
            ${comment || isCommentOpen
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500'
            }
          `}
          title="Add comment"
        >
          <MessageSquare size={16} />
        </button>

        {(rating || comment) && (
          <button
            onClick={async () => {
              setRating(undefined);
              setComment('');
              setHoveredStar(null);
              await fetch('/api/conversations/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  conversationId,
                  invocationId,
                  rating: undefined,
                  feedback: undefined,
                }),
              });
              if (onUpdate) onUpdate();
            }}
            className="ml-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Comment textarea */}
      {isCommentOpen && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="flex items-start justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Add Feedback Comment
            </label>
            <button
              onClick={() => setIsCommentOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
          
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What could be improved? What was good?"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCommentSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isSaving ? 'Saving...' : 'Save Comment'}
            </button>
            <button
              onClick={() => {
                setComment(existingComment || '');
                setIsCommentOpen(false);
              }}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Show existing comment if not editing */}
      {comment && !isCommentOpen && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium text-blue-600 dark:text-blue-400">Feedback:</span> {comment}
        </div>
      )}
    </div>
  );
}

