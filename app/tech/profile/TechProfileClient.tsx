'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateProfileImage } from './actions';

interface TechProfileClientProps {
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  business: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    phone: string | null;
    logoUrl: string | null;
  };
  role: string;
}

export function TechProfileClient({ user, business, role }: TechProfileClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileImageUrl, setProfileImageUrl] = useState(user.profileImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const firstName = user.firstName || user.email.split('@')[0];
  const lastName = user.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Upload to Supabase storage via API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();

      // Update profile with new image URL
      const result = await updateProfileImage(url);
      if (result.error) {
        throw new Error(result.error);
      }

      setProfileImageUrl(url);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Remove your profile photo?')) return;

    setUploading(true);
    const result = await updateProfileImage(null);
    setUploading(false);

    if (result.success) {
      setProfileImageUrl(null);
      router.refresh();
    }
  };

  const roleLabel = role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'Technician';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Profile</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          View your account information
        </p>
      </div>

      {/* Profile Photo */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Photo</h3>

          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={`${firstName} ${lastName}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {initials}
                </div>
              )}
              {profileImageUrl && (
                <button
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-camera mr-2"></i>
                    {profileImageUrl ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG or PNG, max 2MB
              </p>
              {error && (
                <p className="text-sm text-destructive mt-2">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {error}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-foreground">
                {user.firstName || user.lastName
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : '—'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <p className="text-foreground">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                  <i className="fas fa-user-tag text-xs"></i>
                  {roleLabel}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Company</h3>
          <div className="flex items-start gap-4">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-16 h-16 object-contain rounded-lg border bg-white"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <i className="fas fa-building text-2xl text-muted-foreground"></i>
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                <p className="text-foreground font-medium">{business.name}</p>
              </div>
              {(business.address || business.city) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-foreground">
                    {[business.address, business.city, business.state, business.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
              {business.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-foreground">{business.phone}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
