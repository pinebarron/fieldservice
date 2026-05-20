'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { createWorkLog } from '@/app/schedule/actions';
import { uploadImage } from '@/app/schedule/upload-action';
import { ImageUpload, type UploadedImage } from '@/components/ImageUpload';

type FormField = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  sectionId?: string;
};

type FormSection = {
  id: string;
  title: string;
};

type FormTemplate = {
  id: string;
  name: string;
  work_type: string | null;
  schema: { fields: FormField[]; sections?: FormSection[] };
};

type Property = {
  id: string;
  property_name: string;
  customer_name: string;
  location_name: string;
  city: string;
  state: string;
  zip_code: string;
};

interface WorkLogFormProps {
  onClose: () => void;
  onSuccess: () => void;
  formTemplates?: FormTemplate[];
  properties?: Property[];
}

const WORK_TYPES = [
  'Solar Installation',
  'Solar Maintenance',
  'Solar Repair',
  'Inspection',
  'Maintenance',
  'Repair',
  'Installation',
  'Consultation',
  'Other',
];

export function WorkLogForm({ onClose, onSuccess, formTemplates = [], properties = [] }: WorkLogFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState(WORK_TYPES[0]);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Form field values (controlled for property auto-fill)
  const [customerName, setCustomerName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Auto-select form when work type changes
  useEffect(() => {
    const matchingForm = formTemplates.find(f => f.work_type === selectedWorkType);
    if (matchingForm) {
      setSelectedForm(matchingForm);
      setFormResponses({});
    } else {
      setSelectedForm(null);
      setFormResponses({});
    }
  }, [selectedWorkType, formTemplates]);

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    if (propertyId) {
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        setCustomerName(property.customer_name);
        setLocationName(property.location_name);
        setCity(property.city);
        setState(property.state);
        setZipCode(property.zip_code);
      }
    }
  };

  const handleFormChange = (formId: string) => {
    const form = formTemplates.find(f => f.id === formId);
    setSelectedForm(form || null);
    setFormResponses({});
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    if (selectedForm) {
      formData.set('formTemplateId', selectedForm.id);
      formData.set('formResponses', JSON.stringify(formResponses));
    }

    // Add images
    if (images.length > 0) {
      formData.set('images', JSON.stringify(images));
    }

    // Add property ID if selected
    if (selectedPropertyId) {
      formData.set('propertyId', selectedPropertyId);
    }

    const result = await createWorkLog(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess();
      onClose();
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const renderFormField = (field: FormField) => {
    const value = formResponses[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={field.label}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={field.label}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        );
      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                />
                {opt.label}
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
            />
            {field.label}
          </label>
        );
      case 'photo':
        const photoUrl = value as string;
        const photoInputId = `photo-input-${field.id}`;
        return (
          <div className="space-y-2">
            {photoUrl ? (
              <div className="relative inline-block">
                <img src={photoUrl} alt={field.label} className="w-32 h-32 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => handleFieldChange(field.id, '')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full text-xs flex items-center justify-center"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  id={photoInputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    const result = await uploadImage(formData);
                    if (result.url) {
                      handleFieldChange(field.id, result.url);
                    }
                    e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(photoInputId)?.click()}
                >
                  <i className="fas fa-camera mr-2"></i>
                  Take Photo
                </Button>
                <input
                  id={`${photoInputId}-file`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    const result = await uploadImage(formData);
                    if (result.url) {
                      handleFieldChange(field.id, result.url);
                    }
                    e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`${photoInputId}-file`)?.click()}
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload
                </Button>
              </div>
            )}
          </div>
        );
      case 'signature':
        return (
          <div className="border-2 border-dashed rounded-md p-4 text-center text-muted-foreground">
            <i className="fas fa-signature text-2xl mb-2"></i>
            <p className="text-sm">Signature capture (coming soon)</p>
          </div>
        );
      case 'gps':
        const gpsValue = value as { lat: number; lng: number } | null;
        return (
          <div className="space-y-2">
            {gpsValue ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <i className="fas fa-map-marker-alt text-primary text-lg"></i>
                <div className="flex-1">
                  <p className="text-sm font-medium">Location captured</p>
                  <p className="text-xs text-muted-foreground">
                    {gpsValue.lat.toFixed(6)}, {gpsValue.lng.toFixed(6)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFieldChange(field.id, null)}
                >
                  <i className="fas fa-times mr-1"></i>
                  Clear
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        handleFieldChange(field.id, {
                          lat: position.coords.latitude,
                          lng: position.coords.longitude,
                        });
                      },
                      (error) => {
                        alert('Unable to get location: ' + error.message);
                      },
                      { enableHighAccuracy: true }
                    );
                  } else {
                    alert('Geolocation is not supported by your browser');
                  }
                }}
              >
                <i className="fas fa-map-marker-alt mr-2"></i>
                Capture GPS Location
              </Button>
            )}
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Property Selector */}
      {properties.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <label className="block text-sm font-medium mb-2">
            <i className="fas fa-building text-primary mr-2"></i>
            Select Existing Property (auto-fills fields)
          </label>
          <select
            value={selectedPropertyId}
            onChange={(e) => handlePropertySelect(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Or enter details manually below --</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.property_name} - {property.customer_name} ({property.city}, {property.state})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer Name *</label>
          <input
            name="customerName"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Customer name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Work Type *</label>
          <select
            name="workType"
            required
            value={selectedWorkType}
            onChange={(e) => setSelectedWorkType(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {WORK_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location Name *</label>
        <input
          name="locationName"
          required
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Job site name"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City *</label>
          <input
            name="city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="City"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State *</label>
          <input
            name="state"
            required
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="CA"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ZIP *</label>
          <input
            name="zipCode"
            required
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="90001"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Service Date *</label>
          <input
            name="serviceDate"
            type="date"
            required
            defaultValue={today}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Work Performed *</label>
        <textarea
          name="workPerformed"
          required
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Describe the work performed..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Additional Notes</label>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Any additional notes..."
        />
      </div>

      {/* Photo Upload */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium mb-3">
          <i className="fas fa-camera text-primary mr-2"></i>
          Photos (Before / After)
        </label>
        <ImageUpload images={images} onChange={setImages} maxImages={10} />
      </div>

      {/* Form Template Selection */}
      {formTemplates.length > 0 && (
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-2">
            <i className="fas fa-file-alt text-primary mr-2"></i>
            Attach Form
          </label>
          <select
            value={selectedForm?.id || ''}
            onChange={(e) => handleFormChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">No form</option>
            {formTemplates.map(form => (
              <option key={form.id} value={form.id}>
                {form.name} {form.work_type && `(${form.work_type})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Form Fields */}
      {selectedForm && selectedForm.schema?.fields?.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <i className="fas fa-clipboard-list text-primary"></i>
            {selectedForm.name}
          </h4>

          {/* Render fields grouped by sections */}
          {(() => {
            const sections = selectedForm.schema.sections || [];
            const fields = selectedForm.schema.fields;
            const unsectionedFields = fields.filter(f => !f.sectionId);

            return (
              <>
                {/* Unsectioned fields first */}
                {unsectionedFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium mb-1">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    {renderFormField(field)}
                  </div>
                ))}

                {/* Then sectioned fields */}
                {sections.map(section => {
                  const sectionFields = fields.filter(f => f.sectionId === section.id);
                  if (sectionFields.length === 0) return null;

                  return (
                    <div key={section.id} className="border-t pt-4 mt-4">
                      <h5 className="font-medium text-sm text-primary mb-3 flex items-center gap-2">
                        <i className="fas fa-folder-open"></i>
                        {section.title}
                      </h5>
                      <div className="space-y-4">
                        {sectionFields.map(field => (
                          <div key={field.id}>
                            <label className="block text-sm font-medium mb-1">
                              {field.label} {field.required && <span className="text-destructive">*</span>}
                            </label>
                            {renderFormField(field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create Work Log'}
        </Button>
      </div>
    </form>
  );
}
