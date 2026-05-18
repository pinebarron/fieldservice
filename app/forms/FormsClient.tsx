'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createFormTemplate, deleteFormTemplate, type FormField, type FormFieldType } from './actions';

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  work_type: string | null;
  schema: { fields: FormField[] };
  is_active: string;
}

interface FormsClientProps {
  formTemplates: FormTemplate[] | null;
}

const FIELD_TYPES: { type: FormFieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Text', icon: 'fa-font' },
  { type: 'textarea', label: 'Long Text', icon: 'fa-align-left' },
  { type: 'number', label: 'Number', icon: 'fa-hashtag' },
  { type: 'date', label: 'Date', icon: 'fa-calendar' },
  { type: 'time', label: 'Time', icon: 'fa-clock' },
  { type: 'select', label: 'Dropdown', icon: 'fa-caret-square-down' },
  { type: 'checkbox', label: 'Checkbox', icon: 'fa-check-square' },
  { type: 'radio', label: 'Radio', icon: 'fa-dot-circle' },
  { type: 'photo', label: 'Photo', icon: 'fa-camera' },
  { type: 'signature', label: 'Signature', icon: 'fa-signature' },
  { type: 'gps', label: 'GPS Location', icon: 'fa-map-marker-alt' },
];

const WORK_TYPES = [
  'Solar Installation',
  'Solar Maintenance',
  'Solar Repair',
  'Inspection',
  'Maintenance',
  'Repair',
  'Installation',
  'Consultation',
];

export function FormsClient({ formTemplates }: FormsClientProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const router = useRouter();

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${FIELD_TYPES.find(f => f.type === type)?.label || 'Field'}`,
      required: false,
      options: type === 'select' || type === 'radio' ? [{ label: 'Option 1', value: 'option1' }] : undefined,
    };
    setFields([...fields, newField]);
    setEditingField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (editingField === id) setEditingField(null);
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === id);
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      setFields(newFields);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('fields', JSON.stringify(fields));

    const result = await createFormTemplate(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowBuilder(false);
      setFields([]);
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this form template?')) return;
    setDeleting(id);
    await deleteFormTemplate(id);
    router.refresh();
    setDeleting(null);
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    setFields([]);
    setEditingField(null);
    setError('');
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Form Templates</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Create custom forms for jobs</p>
        </div>
        <Button className="gap-2" onClick={() => setShowBuilder(true)}>
          <i className="fas fa-plus"></i>New Form
        </Button>
      </div>

      {/* Form Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardContent className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create Form Template</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

                {/* Form Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Form Name *</label>
                    <input name="name" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Solar Inspection Checklist" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link to Work Type</label>
                    <select name="workType" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Any work type</option>
                      {WORK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea name="description" rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Form description..." />
                </div>

                {/* Field Type Buttons */}
                <div>
                  <label className="block text-sm font-medium mb-2">Add Fields</label>
                  <div className="flex flex-wrap gap-2">
                    {FIELD_TYPES.map(({ type, label, icon }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addField(type)}
                        className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
                      >
                        <i className={`fas ${icon} text-primary`}></i>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field List */}
                {fields.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Form Fields ({fields.length})</label>
                    <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                      {fields.map((field, index) => (
                        <div key={field.id} className={`border rounded-lg p-3 bg-background ${editingField === field.id ? 'ring-2 ring-primary' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                              <button type="button" onClick={() => moveField(field.id, 'up')} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <i className="fas fa-chevron-up text-xs"></i>
                              </button>
                              <button type="button" onClick={() => moveField(field.id, 'down')} disabled={index === fields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <i className="fas fa-chevron-down text-xs"></i>
                              </button>
                            </div>
                            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                              <i className={`fas ${FIELD_TYPES.find(f => f.type === field.type)?.icon} text-primary text-sm`}></i>
                            </div>
                            <div className="flex-1">
                              {editingField === field.id ? (
                                <input
                                  value={field.label}
                                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                                  className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                                  autoFocus
                                />
                              ) : (
                                <p className="font-medium text-sm">{field.label}</p>
                              )}
                              <p className="text-xs text-muted-foreground">{FIELD_TYPES.find(f => f.type === field.type)?.label} {field.required && '• Required'}</p>
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={field.required || false}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                className="rounded"
                              />
                              Required
                            </label>
                            <button type="button" onClick={() => setEditingField(editingField === field.id ? null : field.id)} className="text-muted-foreground hover:text-foreground">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button type="button" onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>

                          {/* Options for select/radio */}
                          {editingField === field.id && (field.type === 'select' || field.type === 'radio') && (
                            <div className="mt-3 pl-11">
                              <label className="block text-xs font-medium mb-1">Options (one per line)</label>
                              <textarea
                                value={field.options?.map(o => o.label).join('\n') || ''}
                                onChange={(e) => {
                                  const options = e.target.value.split('\n').filter(Boolean).map(label => ({
                                    label,
                                    value: label.toLowerCase().replace(/\s+/g, '_')
                                  }));
                                  updateField(field.id, { options });
                                }}
                                rows={3}
                                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={closeBuilder} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={loading || fields.length === 0} className="flex-1">
                    {loading ? 'Creating...' : 'Create Form'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form Templates List */}
      {!formTemplates || formTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-alt text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">No form templates yet</h3>
            <p className="text-muted-foreground mb-4">Create custom forms for job inspections and reports.</p>
            <Button onClick={() => setShowBuilder(true)}><i className="fas fa-plus mr-2"></i>Create First Form</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {formTemplates.map((form) => (
            <Card key={form.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-file-alt text-primary"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{form.name}</h3>
                    {form.description && <p className="text-sm text-muted-foreground line-clamp-2">{form.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.work_type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{form.work_type}</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {form.schema?.fields?.length || 0} fields
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(form.id)} disabled={deleting === form.id} className="text-muted-foreground hover:text-destructive">
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
