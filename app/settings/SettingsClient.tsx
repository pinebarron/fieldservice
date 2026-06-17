'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateBusinessInfo, updateBusinessLogo } from './actions';

interface Business {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  logo_url: string | null;
  brand_color: string | null;
}

interface UserProfile {
  firstName: string | null;
  lastName: string | null;
}

interface Props {
  business: Business;
  userEmail: string;
  userProfile: UserProfile | null;
}

export function SettingsClient({ business, userEmail, userProfile }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Business form state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(business.name);
  const [address, setAddress] = useState(business.address || '');
  const [city, setCity] = useState(business.city || '');
  const [state, setState] = useState(business.state || '');
  const [zipCode, setZipCode] = useState(business.zip_code || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [brandColor, setBrandColor] = useState(business.brand_color || '#2d5a3d');

  // Logo state
  const [logoUrl, setLogoUrl] = useState(business.logo_url);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.set('name', name);
    formData.set('address', address);
    formData.set('city', city);
    formData.set('state', state);
    formData.set('zipCode', zipCode);
    formData.set('phone', phone);
    formData.set('brandColor', brandColor);

    const result = await updateBusinessInfo(formData);
    setSaving(false);

    if (result.success) {
      setEditing(false);
      router.refresh();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLogoError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    setLogoError('');

    try {
      // Upload to Supabase storage via API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();

      // Update business with new logo URL
      const result = await updateBusinessLogo(url);
      if (result.error) {
        throw new Error(result.error);
      }

      setLogoUrl(url);
      router.refresh();
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Remove your business logo?')) return;

    setUploadingLogo(true);
    const result = await updateBusinessLogo(null);
    setUploadingLogo(false);

    if (result.success) {
      setLogoUrl(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo & Branding */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Logo & Branding</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your logo appears on estimates, invoices, and emails sent to customers.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {logoUrl ? (
                <div className="relative group">
                  <img
                    src={logoUrl}
                    alt="Business logo"
                    className="w-32 h-32 object-contain rounded-lg border bg-white"
                  />
                  <button
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/30">
                  <div className="text-center text-muted-foreground">
                    <i className="fas fa-image text-2xl mb-1"></i>
                    <p className="text-xs">No logo</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload mr-2"></i>
                    {logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, PNG or JPG, max 2MB
              </p>
              {logoError && (
                <p className="text-sm text-destructive">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {logoError}
                </p>
              )}
            </div>
          </div>

          {/* Brand Color */}
          <div className="mt-6 pt-6 border-t">
            <label className="text-sm font-medium mb-2 block">Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                placeholder="#2d5a3d"
              />
              <span className="text-sm text-muted-foreground">
                Used in estimates and emails
              </span>
            </div>
            {brandColor !== business.brand_color && (
              <Button
                size="sm"
                className="mt-3"
                onClick={async () => {
                  const formData = new FormData();
                  formData.set('name', name);
                  formData.set('brandColor', brandColor);
                  await updateBusinessInfo(formData);
                  router.refresh();
                }}
              >
                Save Color
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Business Information</h3>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <i className="fas fa-edit mr-2"></i>
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Business Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">State / Province</label>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">ZIP / Postal</label>
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                <p className="text-foreground">{business.name}</p>
              </div>
              {(business.address || business.city) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-foreground">
                    {[business.address, business.city, business.state, business.zip_code]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="text-foreground">{business.phone || '—'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Account</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground">{userEmail}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-foreground">
                {userProfile?.firstName || userProfile?.lastName
                  ? `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim()
                  : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beta Features */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Beta Features</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              Experimental
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            These features are still in development and may change.
          </p>
          <div className="space-y-2">
            <Link href="/vendors">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <i className="fas fa-handshake text-muted-foreground"></i>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Vendors</p>
                  <p className="text-sm text-muted-foreground">Manage supplier and vendor relationships</p>
                </div>
                <i className="fas fa-chevron-right text-muted-foreground"></i>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
