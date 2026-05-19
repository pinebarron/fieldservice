'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createEstimate } from '@/app/estimates/actions';

interface EstimateFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function EstimateForm({ onClose, onSuccess }: EstimateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await createEstimate(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.id) {
      // Close modal first, then redirect to detail page to add line items
      onClose();
      router.push(`/estimates/${result.id}`);
    } else {
      onSuccess();
      onClose();
    }
  };

  // Default valid until 30 days from now
  const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Estimate Title *</label>
        <input
          name="title"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Solar Panel Installation - Residential"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Customer Name *</label>
        <input
          name="customerName"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="John Smith"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer Email</label>
          <input
            name="customerEmail"
            type="email"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="customer@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Customer Phone</label>
          <input
            name="customerPhone"
            type="tel"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Valid Until</label>
        <input
          name="validUntil"
          type="date"
          defaultValue={defaultValidUntil}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Describe the work to be estimated..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Internal notes..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create Estimate'}
        </Button>
      </div>
    </form>
  );
}
