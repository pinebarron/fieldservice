'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createVendor, deleteVendor } from './actions';

interface Vendor {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
}

interface VendorsClientProps {
  vendors: Vendor[] | null;
}

export function VendorsClient({ vendors }: VendorsClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const result = await createVendor(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vendor?')) return;
    setDeleting(id);
    await deleteVendor(id);
    router.refresh();
    setDeleting(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendors</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Manage subcontractors and vendors</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i>Add Vendor
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Vendor</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor Name *</label>
                  <input name="name" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Vendor name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input name="contactName" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Contact person" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input name="contactEmail" type="email" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input name="contactPhone" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="(555) 123-4567" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea name="notes" rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Notes..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Adding...' : 'Add Vendor'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {!vendors || vendors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-handshake text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">No vendors yet</h3>
            <p className="text-muted-foreground mb-4">Add vendors and subcontractors you work with.</p>
            <Button onClick={() => setShowForm(true)}><i className="fas fa-plus mr-2"></i>Add First Vendor</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-handshake text-primary"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{vendor.name}</h3>
                    {vendor.contact_name && <p className="text-sm text-muted-foreground">{vendor.contact_name}</p>}
                    {vendor.contact_phone && <p className="text-xs text-muted-foreground">{vendor.contact_phone}</p>}
                  </div>
                  <button onClick={() => handleDelete(vendor.id)} disabled={deleting === vendor.id} className="text-muted-foreground hover:text-destructive">
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
