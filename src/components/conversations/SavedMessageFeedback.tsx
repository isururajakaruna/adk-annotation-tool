'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavedMessageFeedbackProps {
  conversationId: string;
  invocationId: string;
  existingRating?: number;  // Will be _custom_rating (1-5 stars)
  existingComment?: string;  // Will be _custom_feedback
  onUpdate?: () => void;
  hasToolCalls?: boolean;
  onEditClick?: () => void;
}

export function SavedMessageFeedback({
  conversationId,
  invocationId,
  existingRating,
  existingComment,
  onUpdate,
  hasToolCalls = false,
  onEditClick,
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
    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
      {/* Rating and action buttons */}
      <div className="flex items-center justify-between">
        {/* 5-star rating */}
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
                className="p-1 transition-colors"
              >
                <Star
                  className={`w-4 h-4 ${
                    isActive || isHovered
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            );
          })}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCommentOpen(!isCommentOpen)}
            className={cn(
              "p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              isCommentOpen && "bg-gray-100 dark:bg-gray-800"
            )}
            title="Add comment"
          >
            <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          {onEditClick && (
            <button
              onClick={onEditClick}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Edit response"
            >
              <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* Comment input */}
      {isCommentOpen && (
        <div className="space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your feedback..."
            className="w-full min-h-[80px] p-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCommentSave}
              disabled={isSaving}
              className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Comment'}
            </button>
            <button
              onClick={() => {
                setComment(existingComment || '');
                setIsCommentOpen(false);
              }}
              className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Display saved comment */}
      {!isCommentOpen && comment && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">Your Feedback:</p>
              <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{comment}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

