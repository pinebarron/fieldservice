'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createWorkLog, updateWorkLog } from '@/app/schedule/actions';
import { FormPhotoField } from '@/components/FormPhotoField';
import { FormDocumentField } from '@/components/FormDocumentField';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import type { FormPhotoValue, PhotoFieldConfig, FormDocumentValue, DocumentFieldConfig } from '@/lib/form-types';

// Conditional display rule
type ShowIfCondition = {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'isNotEmpty' | 'isEmpty';
  value?: string | boolean;
};

type FormField = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  sectionId?: string;
  photoConfig?: PhotoFieldConfig;
  documentConfig?: DocumentFieldConfig;
  showIf?: ShowIfCondition;
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

type FormSubmission = {
  id: string;
  template_id: string;
  responses: Record<string, unknown>;
  submitted_at: string;
  form_templates?: {
    name: string;
    schema: { fields: FormField[]; sections?: FormSection[] };
  };
};

type WorkLog = {
  id: string;
  customer_name: string;
  work_type: string;
  location_name: string;
  city: string;
  state: string;
  zip_code: string;
  service_date: string;
  status: string;
  work_performed: string;
  additional_notes: string | null;
  image_urls: string[] | null;
  photo_metadata: { url: string; type: string; capturedAt: string; lat?: number; lng?: number; accuracy?: number }[] | null;
  form_submissions?: FormSubmission[];
  property_id?: string | null;
  technician_user_id?: string | null;
};

type TeamMember = {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};

interface WorkLogFormProps {
  onClose: () => void;
  onSuccess: () => void;
  formTemplates?: FormTemplate[];
  properties?: Property[];
  teamMembers?: TeamMember[];
  editJob?: WorkLog;
  defaultCity?: string;
  defaultState?: string;
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

// Evaluate whether a field should be shown based on its showIf condition
function evaluateShowIf(condition: ShowIfCondition | undefined, formResponses: Record<string, any>): boolean {
  if (!condition) return true; // No condition = always show
  if (!condition.field) return true; // No field selected = always show

  const fieldValue = formResponses[condition.field];
  let conditionValue = condition.value;

  // Normalize boolean comparisons (handle string "true"/"false" vs actual booleans)
  if (conditionValue === 'true') conditionValue = true;
  if (conditionValue === 'false') conditionValue = false;

  // Also normalize the field value for comparison
  let normalizedFieldValue = fieldValue;
  if (normalizedFieldValue === 'true') normalizedFieldValue = true;
  if (normalizedFieldValue === 'false') normalizedFieldValue = false;

  switch (condition.operator) {
    case 'equals':
      // For checkboxes, treat undefined/null as false
      if (conditionValue === true) {
        return normalizedFieldValue === true;
      }
      if (conditionValue === false) {
        return normalizedFieldValue === false || normalizedFieldValue === undefined || normalizedFieldValue === null;
      }
      return normalizedFieldValue === conditionValue;
    case 'notEquals':
      if (conditionValue === true) {
        return normalizedFieldValue !== true;
      }
      if (conditionValue === false) {
        return normalizedFieldValue === true;
      }
      return normalizedFieldValue !== conditionValue;
    case 'contains':
      return typeof fieldValue === 'string' && fieldValue.includes(String(condition.value));
    case 'isNotEmpty':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '' &&
             !(Array.isArray(fieldValue) && fieldValue.length === 0);
    case 'isEmpty':
      return fieldValue === undefined || fieldValue === null || fieldValue === '' ||
             (Array.isArray(fieldValue) && fieldValue.length === 0);
    default:
      return true;
  }
}

export function WorkLogForm({ onClose, onSuccess, formTemplates = [], properties = [], teamMembers = [], editJob, defaultCity = '', defaultState = '' }: WorkLogFormProps) {
  const isEditMode = !!editJob;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState(editJob?.work_type || WORK_TYPES[0]);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [formInitialized, setFormInitialized] = useState(false);

  // Form field values (controlled for property auto-fill)
  const [customerName, setCustomerName] = useState(editJob?.customer_name || '');
  const [locationName, setLocationName] = useState(editJob?.location_name || '');
  const [city, setCity] = useState(editJob?.city || defaultCity);
  const [state, setState] = useState(editJob?.state || defaultState);
  const [zipCode, setZipCode] = useState(editJob?.zip_code || '');
  const [selectedPropertyId, setSelectedPropertyId] = useState(editJob?.property_id || '');
  const [serviceDate, setServiceDate] = useState(editJob?.service_date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState(editJob?.status || 'scheduled');
  const [workPerformed, setWorkPerformed] = useState(editJob?.work_performed || '');
  const [notes, setNotes] = useState(editJob?.additional_notes || '');
  const [assignedTo, setAssignedTo] = useState(editJob?.technician_user_id || '');
  const [saveAsProperty, setSaveAsProperty] = useState(false);

  // Initialize form from editJob (only once)
  useEffect(() => {
    if (editJob && !formInitialized) {
      // Check if there's a form submission to restore
      const submission = editJob.form_submissions?.[0];
      if (submission) {
        // Find the matching form template
        const matchingTemplate = formTemplates.find(f => f.id === submission.template_id);
        if (matchingTemplate) {
          setSelectedForm(matchingTemplate);
          // Restore form responses including photos
          const restoredResponses: Record<string, any> = { ...submission.responses as Record<string, any> };
          setFormResponses(restoredResponses);
        }
      } else {
        // No form submission - restore legacy photos into default photo fields
        if (editJob.photo_metadata && editJob.photo_metadata.length > 0) {
          const beforePhotos = editJob.photo_metadata.filter(p => p.type === 'before').map(p => ({
            url: p.url,
            capturedAt: p.capturedAt,
            lat: p.lat,
            lng: p.lng,
            accuracy: p.accuracy,
          }));
          const afterPhotos = editJob.photo_metadata.filter(p => p.type === 'after').map(p => ({
            url: p.url,
            capturedAt: p.capturedAt,
            lat: p.lat,
            lng: p.lng,
            accuracy: p.accuracy,
          }));
          setFormResponses({
            _default_before_photos: beforePhotos,
            _default_after_photos: afterPhotos,
          });
        }
      }
      setFormInitialized(true);
    }
  }, [editJob, formTemplates, formInitialized]);

  // Auto-select form when work type changes (only for new jobs)
  useEffect(() => {
    if (isEditMode && !formInitialized) return; // Skip during edit initialization
    if (isEditMode) return; // Don't auto-switch forms in edit mode

    const matchingForm = formTemplates.find(f => f.work_type === selectedWorkType);
    if (matchingForm) {
      setSelectedForm(matchingForm);
      setFormResponses({});
    } else {
      setSelectedForm(null);
      setFormResponses({});
    }
  }, [selectedWorkType, formTemplates, isEditMode, formInitialized]);

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

    // Include form template ID and responses
    if (selectedForm) {
      formData.set('formTemplateId', selectedForm.id);
      formData.set('formResponses', JSON.stringify(formResponses));
    } else {
      // When no form template, include default photo fields in responses
      formData.set('formResponses', JSON.stringify(formResponses));
    }

    // Extract photos from form responses (only from form templates)
    const allPhotos: { url: string; type: string; fieldLabel: string; capturedAt: string; lat?: number; lng?: number; accuracy?: number; altitude?: number; hasExif?: boolean }[] = [];
    const photoFieldIds = selectedForm
      ? selectedForm.schema.fields.filter(f => f.type === 'photo').map(f => f.id)
      : [];

    for (const fieldId of photoFieldIds) {
      const photos = formResponses[fieldId] as FormPhotoValue[] | undefined;
      if (photos && Array.isArray(photos)) {
        // Determine photo type and label from field
        const field = selectedForm?.schema.fields.find(f => f.id === fieldId);
        const photoType = field?.photoConfig?.classification || 'general';
        const fieldLabel = field?.label || 'Photos';

        allPhotos.push(...photos.map(p => ({
          url: p.url,
          type: photoType,
          fieldLabel: fieldLabel,
          capturedAt: p.capturedAt,
          lat: p.lat,
          lng: p.lng,
          accuracy: p.accuracy,
          altitude: p.altitude,
          hasExif: p.hasExif,
        })));
      }
    }

    // Add photos in legacy format for backwards compatibility
    if (allPhotos.length > 0) {
      formData.set('images', JSON.stringify(allPhotos));
    }

    // Add property ID if selected
    if (selectedPropertyId) {
      formData.set('propertyId', selectedPropertyId);
    }

    // Add assigned technician
    if (assignedTo) {
      formData.set('assignedTo', assignedTo);
    }

    // Add save as property flag
    if (saveAsProperty && !selectedPropertyId) {
      formData.set('saveAsProperty', 'true');
    }

    let result;
    if (isEditMode && editJob) {
      result = await updateWorkLog(editJob.id, formData);
    } else {
      result = await createWorkLog(formData);
    }

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess();
      onClose();
    }
  };

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
        const photoValue = (value as FormPhotoValue[] | undefined) || [];
        return (
          <FormPhotoField
            field={field as any}
            value={photoValue}
            onChange={(photos) => handleFieldChange(field.id, photos)}
            jobLocation={undefined} // TODO: Pass geocoded job location when available
            disabled={loading}
          />
        );
      case 'document':
        const documentValue = (value as FormDocumentValue[] | undefined) || [];
        return (
          <FormDocumentField
            field={field as any}
            value={documentValue}
            onChange={(documents) => handleFieldChange(field.id, documents)}
            disabled={loading}
          />
        );
      case 'signature':
        return (
          <SignatureCanvas
            value={formResponses[field.id] as string | undefined}
            onChange={(sig) => handleFieldChange(field.id, sig)}
            disabled={loading}
            label={field.label}
          />
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
          <label className="block text-sm font-medium mb-1">Main Point of Contact *</label>
          <input
            name="customerName"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="John Smith"
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
        <label className="block text-sm font-medium mb-1">Street Address *</label>
        <input
          name="locationName"
          required
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="123 Main St"
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

      {/* Save as Property option - only show for new jobs without a property selected */}
      {!isEditMode && !selectedPropertyId && (
        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <input
            type="checkbox"
            checked={saveAsProperty}
            onChange={(e) => setSaveAsProperty(e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-sm">
            <i className="fas fa-building text-primary mr-1"></i>
            Save customer info as a new Property
          </span>
        </label>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Service Date *</label>
          <input
            name="serviceDate"
            type="date"
            required
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Technician Assignment */}
      {teamMembers.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">
            <i className="fas fa-user-hard-hat text-primary mr-2"></i>
            Assign To
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {teamMembers.map(member => (
              <option key={member.userId} value={member.userId}>
                {member.user?.first_name || member.user?.email?.split('@')[0] || 'Unknown'} {member.user?.last_name || ''}
                {member.role === 'owner' ? ' (Owner)' : member.role === 'admin' ? ' (Admin)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Work Overview</label>
        <textarea
          name="workPerformed"
          rows={3}
          value={workPerformed}
          onChange={(e) => setWorkPerformed(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Brief description of work to be done or completed..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Additional Notes</label>
        <textarea
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Any additional notes..."
        />
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
                {unsectionedFields.map(field => {
                  // Check if field should be shown based on conditional logic
                  if (!evaluateShowIf(field.showIf, formResponses)) {
                    return null;
                  }
                  return (
                    <div key={field.id} className="animate-in fade-in duration-200">
                      <label className="block text-sm font-medium mb-1">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                      </label>
                      {renderFormField(field)}
                    </div>
                  );
                })}

                {/* Then sectioned fields */}
                {sections.map(section => {
                  const sectionFields = fields.filter(f => f.sectionId === section.id);
                  // Filter to only visible fields in this section
                  const visibleSectionFields = sectionFields.filter(f => evaluateShowIf(f.showIf, formResponses));
                  if (visibleSectionFields.length === 0) return null;

                  return (
                    <div key={section.id} className="border-t pt-4 mt-4">
                      <h5 className="font-medium text-sm text-primary mb-3 flex items-center gap-2">
                        <i className="fas fa-folder-open"></i>
                        {section.title}
                      </h5>
                      <div className="space-y-4">
                        {sectionFields.map(field => {
                          // Check if field should be shown based on conditional logic
                          if (!evaluateShowIf(field.showIf, formResponses)) {
                            return null;
                          }
                          return (
                            <div key={field.id} className="animate-in fade-in duration-200">
                              <label className="block text-sm font-medium mb-1">
                                {field.label} {field.required && <span className="text-destructive">*</span>}
                              </label>
                              {renderFormField(field)}
                            </div>
                          );
                        })}
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
          {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Work Log')}
        </Button>
      </div>
    </form>
  );
}
