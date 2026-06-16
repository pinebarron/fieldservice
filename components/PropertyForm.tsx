'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createProperty, updateProperty } from '@/app/properties/actions';

interface Property {
  id: string;
  property_name: string;
  customer_name: string;
  property_type: string;
  location_name: string;
  city: string;
  state: string;
  zip_code: string;
  status: string;
  notes: string | null;
}

interface PropertyFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editProperty?: Property;
}

export function PropertyForm({ onClose, onSuccess, editProperty }: PropertyFormProps) {
  const isEditMode = !!editProperty;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [propertyName, setPropertyName] = useState(editProperty?.property_name || '');
  const [customerName, setCustomerName] = useState(editProperty?.customer_name || '');
  const [locationName, setLocationName] = useState(editProperty?.location_name || '');
  const [city, setCity] = useState(editProperty?.city || '');
  const [state, setState] = useState(editProperty?.state || '');
  const [zipCode, setZipCode] = useState(editProperty?.zip_code || '');
  const [notes, setNotes] = useState(editProperty?.notes || '');
  const [status, setStatus] = useState(editProperty?.status || 'active');
  const [propertyType, setPropertyType] = useState(editProperty?.property_type || 'residential');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.set('propertyName', propertyName);
    formData.set('customerName', customerName);
    formData.set('locationName', locationName);
    formData.set('city', city);
    formData.set('state', state);
    formData.set('zipCode', zipCode);
    formData.set('notes', notes);
    formData.set('status', status);
    formData.set('propertyType', propertyType);

    let result;
    if (isEditMode && editProperty) {
      result = await updateProperty(editProperty.id, formData);
    } else {
      result = await createProperty(formData);
    }

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Property Name *</label>
        <input
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Smith Residence"
        />
        <p className="text-xs text-muted-foreground mt-1">A friendly name to identify this property</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Main Point of Contact *</label>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="John Smith"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Property Type *</label>
        <div className="flex gap-3">
          <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md border cursor-pointer transition-colors ${
            propertyType === 'residential'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-input bg-background hover:bg-muted'
          }`}>
            <input
              type="radio"
              name="propertyType"
              value="residential"
              checked={propertyType === 'residential'}
              onChange={(e) => setPropertyType(e.target.value)}
              className="sr-only"
            />
            <i className="fas fa-home"></i>
            <span className="font-medium">Residential</span>
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md border cursor-pointer transition-colors ${
            propertyType === 'commercial'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-input bg-background hover:bg-muted'
          }`}>
            <input
              type="radio"
              name="propertyType"
              value="commercial"
              checked={propertyType === 'commercial'}
              onChange={(e) => setPropertyType(e.target.value)}
              className="sr-only"
            />
            <i className="fas fa-building"></i>
            <span className="font-medium">Commercial</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Street Address *</label>
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="123 Main St"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City *</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Los Angeles"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State *</label>
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="CA"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ZIP *</label>
          <input
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="90001"
          />
        </div>
      </div>

      {isEditMode && (
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Property')}
        </Button>
      </div>
    </form>
  );
}
