'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createWorkLog } from '@/app/schedule/actions';

type FormField = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: { label: string; value: string }[];
};

type FormTemplate = {
  id: string;
  name: string;
  work_type: string | null;
  schema: { fields: FormField[] };
};

interface WorkLogFormProps {
  onClose: () => void;
  onSuccess: () => void;
  formTemplates?: FormTemplate[];
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

export function WorkLogForm({ onClose, onSuccess, formTemplates = [] }: WorkLogFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState(WORK_TYPES[0]);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});

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
        return (
          <div className="border-2 border-dashed rounded-md p-4 text-center text-muted-foreground">
            <i className="fas fa-camera text-2xl mb-2"></i>
            <p className="text-sm">Photo capture (coming soon)</p>
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
        return (
          <div className="border-2 border-dashed rounded-md p-4 text-center text-muted-foreground">
            <i className="fas fa-map-marker-alt text-2xl mb-2"></i>
            <p className="text-sm">GPS location (coming soon)</p>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer Name *</label>
          <input
            name="customerName"
            required
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
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="City"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State *</label>
          <input
            name="state"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="CA"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ZIP *</label>
          <input
            name="zipCode"
            required
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
          {selectedForm.schema.fields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </label>
              {renderFormField(field)}
            </div>
          ))}
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
