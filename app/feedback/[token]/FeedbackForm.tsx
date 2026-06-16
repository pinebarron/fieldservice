'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FeedbackFormProps {
  token: string;
  workOrder: {
    customerName: string;
    workType: string;
    serviceDate: string;
  };
  businessName: string;
  alreadySubmitted: boolean;
  existingResponse?: {
    quality: number;
    professionalism: number;
    value: number;
    timeliness: number;
    comment?: string;
  };
}

type RatingCategory = 'quality' | 'professionalism' | 'value' | 'timeliness';

const RATING_CATEGORIES: { id: RatingCategory; label: string; description: string }[] = [
  { id: 'quality', label: 'Quality of Work', description: 'How satisfied are you with the work performed?' },
  { id: 'professionalism', label: 'Professionalism', description: 'How professional was our team?' },
  { id: 'value', label: 'Value', description: 'How would you rate the value for the price?' },
  { id: 'timeliness', label: 'Timeliness', description: 'How was our punctuality and time management?' },
];

export function FeedbackForm({
  token,
  workOrder,
  businessName,
  alreadySubmitted,
  existingResponse,
}: FeedbackFormProps) {
  const [ratings, setRatings] = useState<Record<RatingCategory, number>>({
    quality: existingResponse?.quality || 0,
    professionalism: existingResponse?.professionalism || 0,
    value: existingResponse?.value || 0,
    timeliness: existingResponse?.timeliness || 0,
  });
  const [comment, setComment] = useState(existingResponse?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [error, setError] = useState('');

  const handleRating = (category: RatingCategory, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    // Validate all ratings are filled
    const missingRatings = RATING_CATEGORIES.filter(cat => ratings[cat.id] === 0);
    if (missingRatings.length > 0) {
      setError('Please provide a rating for all categories');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ratings,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ category, value }: { category: RatingCategory; value: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => handleRating(category, star)}
          disabled={submitted}
          className={`text-2xl transition-colors ${
            star <= value
              ? 'text-yellow-400 hover:text-yellow-500'
              : 'text-gray-300 hover:text-yellow-300'
          } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <i className={`fas fa-star`}></i>
        </button>
      ))}
    </div>
  );

  if (submitted) {
    const avgRating = (ratings.quality + ratings.professionalism + ratings.value + ratings.timeliness) / 4;

    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check-circle text-3xl text-green-600"></i>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your feedback has been submitted. We appreciate you taking the time to share your experience.
          </p>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <p className="text-sm text-muted-foreground mb-2">Your Overall Rating</p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <i
                    key={star}
                    className={`fas fa-star text-lg ${
                      star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  ></i>
                ))}
              </div>
              <span className="font-semibold">{avgRating.toFixed(1)} / 5</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            How did we do?
          </h1>
          <p className="text-muted-foreground">
            {businessName} would love to hear about your experience
          </p>
        </div>

        {/* Work Order Info */}
        <div className="bg-muted/50 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{workOrder.customerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Service Date</p>
              <p className="font-medium">{workOrder.serviceDate}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Service Type</p>
              <p className="font-medium">{workOrder.workType}</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-6">
            {error}
          </div>
        )}

        {/* Rating Categories */}
        <div className="space-y-6 mb-8">
          {RATING_CATEGORIES.map(category => (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground">{category.label}</p>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <StarRating category={category.id} value={ratings[category.id]} />
            </div>
          ))}
        </div>

        {/* Comment */}
        <div className="mb-8">
          <label className="block font-medium text-foreground mb-2">
            Additional Comments <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Submitting...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane mr-2"></i>
              Submit Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
