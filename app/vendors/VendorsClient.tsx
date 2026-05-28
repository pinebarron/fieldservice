'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createVendor, updateVendor, deleteVendor } from './actions';

interface Vendor {
  id: string;
  vendor_key: string | null;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  lat: string | null;
  lng: string | null;
  status: string;
}

interface VendorsClientProps {
  vendors: Vendor[] | null;
}

export function VendorsClient({ vendors }: VendorsClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  // Form state
  const [vendorKey, setVendorKey] = useState('');
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const resetForm = () => {
    setVendorKey('');
    setName('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setCity('');
    setState('');
    setZipCode('');
    setError('');
  };

  const openAddForm = () => {
    resetForm();
    setEditingVendor(null);
    setShowForm(true);
  };

  const openEditForm = (vendor: Vendor) => {
    setVendorKey(vendor.vendor_key || '');
    setName(vendor.name);
    setContactName(vendor.contact_name || '');
    setContactEmail(vendor.contact_email || '');
    setContactPhone(vendor.contact_phone || '');
    setCity(vendor.city || '');
    setState(vendor.state || '');
    setZipCode(vendor.zip_code || '');
    setEditingVendor(vendor);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVendor(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.set('vendorKey', vendorKey);
    formData.set('name', name);
    formData.set('contactName', contactName);
    formData.set('contactEmail', contactEmail);
    formData.set('contactPhone', contactPhone);
    formData.set('city', city);
    formData.set('state', state);
    formData.set('zipCode', zipCode);

    let result;
    if (editingVendor) {
      result = await updateVendor(editingVendor.id, formData);
    } else {
      result = await createVendor(formData);
    }

    if (result?.error) {
      setError(result.error);
    } else {
      closeForm();
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
          <p className="text-muted-foreground text-sm mt-0.5">Manage subcontractors and suppliers</p>
        </div>
        <Button className="gap-2" onClick={openAddForm}>
          <i className="fas fa-plus"></i>Add Vendor
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="ABC Electric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor Key</label>
                    <input
                      value={vendorKey}
                      onChange={(e) => setVendorKey(e.target.value.toUpperCase())}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      placeholder="ABC001"
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Unique identifier</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="John Smith"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      type="email"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="contact@vendor.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      type="tel"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Location</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Los Angeles"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="CA"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ZIP</label>
                      <input
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="90001"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    GPS coordinates will be auto-generated for route optimization
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : editingVendor ? 'Save Changes' : 'Add Vendor'}
                  </Button>
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
            <Button onClick={openAddForm}><i className="fas fa-plus mr-2"></i>Add First Vendor</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Card
              key={vendor.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => openEditForm(vendor)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-handshake text-primary"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{vendor.name}</h3>
                      {vendor.vendor_key && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded font-mono">
                          {vendor.vendor_key}
                        </span>
                      )}
                    </div>
                    {vendor.contact_name && (
                      <p className="text-sm text-muted-foreground">{vendor.contact_name}</p>
                    )}
                    {vendor.contact_phone && (
                      <p className="text-xs text-muted-foreground">
                        <i className="fas fa-phone mr-1"></i>{vendor.contact_phone}
                      </p>
                    )}
                    {vendor.contact_email && (
                      <p className="text-xs text-muted-foreground truncate">
                        <i className="fas fa-envelope mr-1"></i>{vendor.contact_email}
                      </p>
                    )}
                    {(vendor.city || vendor.state) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {[vendor.city, vendor.state, vendor.zip_code].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {vendor.lat && vendor.lng && (
                      <p className="text-xs text-green-600 mt-1">
                        <i className="fas fa-check-circle mr-1"></i>GPS ready
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(vendor);
                      }}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button
                      onClick={(e) => handleDelete(vendor.id, e)}
                      disabled={deleting === vendor.id}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <i className="fas fa-trash text-xs"></i>
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
