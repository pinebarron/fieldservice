'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EstimateForm } from '@/components/EstimateForm';
import { updateEstimateStatus, deleteEstimate } from './actions';

interface Estimate {
  id: string;
  title: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  description: string | null;
  status: string;
  valid_until: string | null;
}

interface EstimatesClientProps {
  estimates: Estimate[] | null;
}

export function EstimatesClient({ estimates }: EstimatesClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(id);
    await updateEstimateStatus(id, status);
    router.refresh();
    setUpdating(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this estimate?')) return;
    setUpdating(id);
    await deleteEstimate(id);
    router.refresh();
    setUpdating(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estimates</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create and manage job estimates
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i>
          New Estimate
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Estimate</h3>
              <EstimateForm
                onClose={() => setShowForm(false)}
                onSuccess={() => router.refresh()}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {!estimates || estimates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-invoice-dollar text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No estimates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first estimate to send to customers.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <i className="fas fa-plus mr-2"></i>
              Create First Estimate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {estimates.map((estimate) => (
            <Card key={estimate.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-file-invoice-dollar text-primary"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{estimate.title}</p>
                      <p className="text-sm text-muted-foreground">{estimate.customer_name}</p>
                      {estimate.customer_email && (
                        <p className="text-xs text-muted-foreground">{estimate.customer_email}</p>
                      )}
                      {estimate.valid_until && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Valid until: {estimate.valid_until}
                        </p>
                      )}
                      {estimate.description && (
                        <p className="text-sm text-foreground mt-2 line-clamp-2">
                          {estimate.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <select
                      value={estimate.status}
                      onChange={(e) => handleStatusChange(estimate.id, e.target.value)}
                      disabled={updating === estimate.id}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${
                        estimate.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : estimate.status === 'sent'
                          ? 'bg-blue-100 text-blue-700'
                          : estimate.status === 'declined'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                    </select>
                    <button
                      onClick={() => handleDelete(estimate.id)}
                      disabled={updating === estimate.id}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
