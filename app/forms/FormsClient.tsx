'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createFormTemplate, updateFormTemplate, deleteFormTemplate, cloneFormTemplate, createStarterTemplate, type FormField, type FormFieldType, type FormSection, type ShowIfCondition } from './actions';
import { cacheFormTemplates } from '@/lib/offline/formOffline';
import type { PhotoFieldConfig, DocumentFieldConfig } from '@/lib/form-types';

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  work_type: string | null;
  schema: { fields: FormField[]; sections?: FormSection[] };
  is_active: string;
}

interface FormsClientProps {
  formTemplates: FormTemplate[] | null;
  businessId: string;
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
  { type: 'document', label: 'Document', icon: 'fa-file-upload' },
  { type: 'signature', label: 'Signature', icon: 'fa-signature' },
  { type: 'gps', label: 'GPS Location', icon: 'fa-map-marker-alt' },
];

const WORK_TYPES = [
  'Solar Installation',
  'Solar Maintenance',
  'Solar Repair',
  'Inspection',
  'Site Survey',
  'Panel Cleaning',
  'Inverter Service',
  'Consultation',
];

const STARTER_TEMPLATES = [
  {
    id: 'site-survey',
    name: 'Site Survey',
    description: 'Initial site assessment for new installations',
    work_type: 'Inspection',
    icon: 'fa-clipboard-check',
  },
  {
    id: 'installation-checklist',
    name: 'Installation Checklist',
    description: 'Track installation progress and completion',
    work_type: 'Solar Installation',
    icon: 'fa-solar-panel',
  },
  {
    id: 'service-visit',
    name: 'Service Visit',
    description: 'Document maintenance and service calls',
    work_type: 'Solar Maintenance',
    icon: 'fa-tools',
  },
];

export function FormsClient({ formTemplates, businessId }: FormsClientProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWorkType, setFormWorkType] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const router = useRouter();

  // Cache form templates for offline use
  useEffect(() => {
    if (formTemplates && formTemplates.length > 0 && typeof window !== 'undefined' && navigator.onLine) {
      cacheFormTemplates(formTemplates.map(t => ({
        id: t.id,
        business_id: businessId,
        name: t.name,
        description: t.description,
        work_type: t.work_type,
        schema: t.schema,
        logic_rules: null,
        is_active: t.is_active,
        created_at: null,
      }))).catch(err => {
        console.error('Failed to cache form templates:', err);
      });
    }
  }, [formTemplates, businessId]);

  const addSection = () => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: `Section ${sections.length + 1}`,
    };
    setSections([...sections, newSection]);
    setEditingSection(newSection.id);
  };

  const updateSection = (id: string, title: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, title } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    // Remove section assignment from fields
    setFields(fields.map(f => f.sectionId === id ? { ...f, sectionId: undefined } : f));
    if (editingSection === id) setEditingSection(null);
  };

  const addField = (type: FormFieldType, sectionId?: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${FIELD_TYPES.find(f => f.type === type)?.label || 'Field'}`,
      required: false,
      options: type === 'select' || type === 'radio' ? [{ label: 'Option 1', value: 'option1' }] : undefined,
      sectionId,
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

    const formData = new FormData();
    formData.set('name', formName);
    formData.set('description', formDescription);
    formData.set('workType', formWorkType);
    formData.set('fields', JSON.stringify(fields));
    formData.set('sections', JSON.stringify(sections));

    let result;
    if (editingTemplate) {
      result = await updateFormTemplate(editingTemplate.id, formData);
    } else {
      result = await createFormTemplate(formData);
    }

    if (result?.error) {
      setError(result.error);
    } else {
      closeBuilder();
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

  const handleClone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCloning(id);
    const result = await cloneFormTemplate(id);
    if (result?.error) {
      setError(result.error);
    }
    router.refresh();
    setCloning(null);
  };

  const handleUseTemplate = async (templateId: string) => {
    setSeeding(templateId);
    setError('');
    const result = await createStarterTemplate(templateId);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowPicker(false);
      router.refresh();
    }
    setSeeding(null);
  };

  const openBuilder = () => {
    setShowPicker(false);
    setEditingTemplate(null);
    setFormName('');
    setFormDescription('');
    setFormWorkType('');
    setFields([]);
    setSections([]);
    setShowBuilder(true);
  };

  const openEditForm = (template: FormTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description || '');
    setFormWorkType(template.work_type || '');
    setFields(template.schema?.fields || []);
    setSections(template.schema?.sections || []);
    setShowBuilder(true);
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    setShowPicker(false);
    setEditingTemplate(null);
    setFormName('');
    setFormDescription('');
    setFormWorkType('');
    setFields([]);
    setSections([]);
    setEditingField(null);
    setEditingSection(null);
    setError('');
  };

  // Get fields for a section (or unsectioned fields)
  const getFieldsForSection = (sectionId: string | null) => {
    return fields.filter(f => (f.sectionId || null) === sectionId);
  };

  const renderFieldEditor = (field: FormField, index: number) => (
    <div key={field.id} className={`border rounded-lg p-3 bg-background ${editingField === field.id ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <button type="button" onClick={() => moveField(field.id, 'up')} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
            <i className="fas fa-chevron-up text-xs"></i>
          </button>
          <button type="button" onClick={() => moveField(field.id, 'down')} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
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
        {sections.length > 0 && (
          <select
            value={field.sectionId || ''}
            onChange={(e) => updateField(field.id, { sectionId: e.target.value || undefined })}
            className="text-xs rounded border border-input bg-background px-2 py-1"
          >
            <option value="">No section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        )}
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
          <label className="block text-xs font-medium mb-2">Options</label>
          <div className="space-y-2">
            {(field.options || []).map((option, optIndex) => (
              <div key={optIndex} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{optIndex + 1}.</span>
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...(field.options || [])];
                    newOptions[optIndex] = {
                      label: e.target.value,
                      value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    };
                    updateField(field.id, { options: newOptions });
                  }}
                  className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm"
                  placeholder={`Option ${optIndex + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = (field.options || []).filter((_, i) => i !== optIndex);
                    updateField(field.id, { options: newOptions.length > 0 ? newOptions : [{ label: 'Option 1', value: 'option_1' }] });
                  }}
                  className="text-muted-foreground hover:text-destructive p-1"
                  disabled={(field.options || []).length <= 1}
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const newOptions = [...(field.options || []), { label: '', value: '' }];
              updateField(field.id, { options: newOptions });
            }}
            className="mt-2 text-sm text-primary hover:underline"
          >
            <i className="fas fa-plus mr-1"></i>Add Option
          </button>
        </div>
      )}

      {/* Photo field configuration */}
      {editingField === field.id && field.type === 'photo' && (
        <div className="mt-3 pl-11 space-y-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Photo Settings</p>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.photoConfig?.gpsRequired ?? false}
                onChange={(e) => updateField(field.id, {
                  photoConfig: { ...field.photoConfig, gpsRequired: e.target.checked }
                })}
                className="rounded"
              />
              Require GPS location
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.photoConfig?.verifyLocation ?? false}
                onChange={(e) => updateField(field.id, {
                  photoConfig: { ...field.photoConfig, verifyLocation: e.target.checked }
                })}
                className="rounded"
              />
              Verify against job site
            </label>
          </div>

          {field.photoConfig?.verifyLocation && (
            <div>
              <label className="block text-xs font-medium mb-1">
                Verification Radius: {field.photoConfig?.verificationRadius ?? 100}m
              </label>
              <input
                type="range"
                min={25}
                max={500}
                step={25}
                value={field.photoConfig?.verificationRadius ?? 100}
                onChange={(e) => updateField(field.id, {
                  photoConfig: { ...field.photoConfig, verificationRadius: Number(e.target.value) }
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>25m</span>
                <span>500m</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1">Classification</label>
            <select
              value={field.photoConfig?.classification ?? 'general'}
              onChange={(e) => updateField(field.id, {
                photoConfig: { ...field.photoConfig, classification: e.target.value as 'before' | 'after' | 'general' }
              })}
              className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="before">Before (pre-work)</option>
              <option value="after">After (post-work)</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Min Photos</label>
              <input
                type="number"
                min={0}
                max={10}
                value={field.photoConfig?.minPhotos ?? 0}
                onChange={(e) => updateField(field.id, {
                  photoConfig: { ...field.photoConfig, minPhotos: Number(e.target.value) }
                })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Max Photos</label>
              <input
                type="number"
                min={1}
                max={20}
                value={field.photoConfig?.maxPhotos ?? 5}
                onChange={(e) => updateField(field.id, {
                  photoConfig: { ...field.photoConfig, maxPhotos: Number(e.target.value) }
                })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Document field configuration */}
      {editingField === field.id && field.type === 'document' && (
        <div className="mt-3 pl-11 space-y-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Document Settings</p>

          <div>
            <label className="block text-xs font-medium mb-2">Allowed File Types</label>
            <div className="flex flex-wrap gap-2">
              {(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'image', 'any'] as const).map(fileType => {
                const isSelected = field.documentConfig?.allowedTypes?.includes(fileType) ?? (fileType === 'any');
                const labels: Record<string, string> = {
                  pdf: 'PDF',
                  doc: 'Word (.doc)',
                  docx: 'Word (.docx)',
                  xls: 'Excel (.xls)',
                  xlsx: 'Excel (.xlsx)',
                  image: 'Images',
                  any: 'Any File',
                };
                return (
                  <label key={fileType} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        let newTypes = [...(field.documentConfig?.allowedTypes || ['any'])];
                        if (fileType === 'any') {
                          newTypes = e.target.checked ? ['any'] : ['pdf'];
                        } else {
                          newTypes = newTypes.filter(t => t !== 'any');
                          if (e.target.checked) {
                            newTypes.push(fileType);
                          } else {
                            newTypes = newTypes.filter(t => t !== fileType);
                          }
                          if (newTypes.length === 0) newTypes = ['any'];
                        }
                        updateField(field.id, {
                          documentConfig: { ...field.documentConfig, allowedTypes: newTypes }
                        });
                      }}
                      className="rounded"
                    />
                    {labels[fileType]}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Max File Size (MB)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={field.documentConfig?.maxFileSize ?? 10}
                onChange={(e) => updateField(field.id, {
                  documentConfig: { ...field.documentConfig, maxFileSize: Number(e.target.value) }
                })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Min Files</label>
              <input
                type="number"
                min={0}
                max={10}
                value={field.documentConfig?.minFiles ?? 0}
                onChange={(e) => updateField(field.id, {
                  documentConfig: { ...field.documentConfig, minFiles: Number(e.target.value) }
                })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Max Files</label>
              <input
                type="number"
                min={1}
                max={20}
                value={field.documentConfig?.maxFiles ?? 5}
                onChange={(e) => updateField(field.id, {
                  documentConfig: { ...field.documentConfig, maxFiles: Number(e.target.value) }
                })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Conditional Logic Configuration - available for all field types when editing */}
      {editingField === field.id && (
        <div className="mt-3 pl-11 space-y-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2">
            <i className="fas fa-code-branch text-blue-600 dark:text-blue-400"></i>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">Conditional Logic</p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!field.showIf}
              onChange={(e) => {
                if (e.target.checked) {
                  // Enable conditional logic with default values
                  updateField(field.id, {
                    showIf: { field: '', operator: 'equals', value: '' }
                  });
                } else {
                  // Disable conditional logic
                  updateField(field.id, { showIf: undefined });
                }
              }}
              className="rounded"
            />
            Only show this field when a condition is met
          </label>

          {field.showIf && (
            <div className="space-y-2 pl-6">
              <div className="text-xs text-muted-foreground mb-2">
                Show this field when...
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Field selector */}
                <select
                  value={field.showIf.field}
                  onChange={(e) => {
                    const selectedFieldId = e.target.value;
                    const targetField = fields.find(f => f.id === selectedFieldId);
                    // Auto-set appropriate default value based on field type
                    let defaultValue: string | boolean = '';
                    if (targetField?.type === 'checkbox') {
                      defaultValue = true; // Default to "checked" for checkboxes
                    } else if (targetField?.options && targetField.options.length > 0) {
                      defaultValue = targetField.options[0].value; // Default to first option
                    }
                    updateField(field.id, {
                      showIf: { ...field.showIf!, field: selectedFieldId, value: defaultValue }
                    });
                  }}
                  className="rounded border border-input bg-background px-2 py-1 text-sm"
                >
                  <option value="">Select field...</option>
                  {fields.filter(f => f.id !== field.id).map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>

                {/* Operator selector */}
                <select
                  value={field.showIf.operator}
                  onChange={(e) => updateField(field.id, {
                    showIf: { ...field.showIf!, operator: e.target.value as ShowIfCondition['operator'] }
                  })}
                  className="rounded border border-input bg-background px-2 py-1 text-sm"
                >
                  <option value="equals">equals</option>
                  <option value="notEquals">does not equal</option>
                  <option value="isNotEmpty">is filled in</option>
                  <option value="isEmpty">is empty</option>
                  <option value="contains">contains</option>
                </select>

                {/* Value input - only show for operators that need a value */}
                {field.showIf.operator !== 'isEmpty' && field.showIf.operator !== 'isNotEmpty' && (
                  (() => {
                    const targetField = fields.find(f => f.id === field.showIf?.field);
                    // If target is checkbox, show true/false dropdown
                    if (targetField?.type === 'checkbox') {
                      // Normalize the value - if it's not explicitly true/false, treat as true
                      const checkboxValue = field.showIf.value === true || field.showIf.value === 'true' ? 'true' :
                                           field.showIf.value === false || field.showIf.value === 'false' ? 'false' : 'true';
                      // Auto-fix the value if it's not set correctly
                      if (field.showIf.value !== true && field.showIf.value !== false) {
                        // Schedule an update to fix the value
                        setTimeout(() => {
                          updateField(field.id, {
                            showIf: { ...field.showIf!, value: true }
                          });
                        }, 0);
                      }
                      return (
                        <select
                          value={checkboxValue}
                          onChange={(e) => updateField(field.id, {
                            showIf: { ...field.showIf!, value: e.target.value === 'true' }
                          })}
                          className="rounded border border-input bg-background px-2 py-1 text-sm"
                        >
                          <option value="true">checked</option>
                          <option value="false">not checked</option>
                        </select>
                      );
                    }
                    // If target has options, show dropdown
                    if (targetField?.options && targetField.options.length > 0) {
                      return (
                        <select
                          value={String(field.showIf.value || '')}
                          onChange={(e) => updateField(field.id, {
                            showIf: { ...field.showIf!, value: e.target.value }
                          })}
                          className="rounded border border-input bg-background px-2 py-1 text-sm"
                        >
                          <option value="">Select value...</option>
                          {targetField.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      );
                    }
                    // Otherwise show text input
                    return (
                      <input
                        type="text"
                        value={String(field.showIf.value || '')}
                        onChange={(e) => updateField(field.id, {
                          showIf: { ...field.showIf!, value: e.target.value }
                        })}
                        placeholder="value"
                        className="rounded border border-input bg-background px-2 py-1 text-sm"
                      />
                    );
                  })()
                )}
              </div>

              {/* Preview of the condition */}
              {field.showIf.field && (
                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                  <i className="fas fa-eye mr-1"></i>
                  Preview: "{field.label}" will appear when "{fields.find(f => f.id === field.showIf?.field)?.label || field.showIf.field}"
                  {field.showIf.operator === 'equals' && ` = "${field.showIf.value}"`}
                  {field.showIf.operator === 'notEquals' && ` ≠ "${field.showIf.value}"`}
                  {field.showIf.operator === 'isNotEmpty' && ' is filled in'}
                  {field.showIf.operator === 'isEmpty' && ' is empty'}
                  {field.showIf.operator === 'contains' && ` contains "${field.showIf.value}"`}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Form Templates</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Create custom forms for jobs</p>
        </div>
        <Button className="gap-2" onClick={() => setShowPicker(true)}>
          <i className="fas fa-plus"></i>New Form
        </Button>
      </div>

      {/* Template Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Create New Form</h3>
              <p className="text-muted-foreground text-sm mb-6">Start from a template or build your own from scratch.</p>

              {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">{error}</div>}

              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-muted-foreground">Starter Templates</p>
                {STARTER_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={seeding !== null}
                    className="w-full flex items-center gap-4 p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className={`fas ${template.icon} text-primary text-lg`}></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <span className="text-xs text-primary">{template.work_type}</span>
                    </div>
                    {seeding === template.id ? (
                      <i className="fas fa-spinner fa-spin text-primary"></i>
                    ) : (
                      <i className="fas fa-chevron-right text-muted-foreground"></i>
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={openBuilder}
                  className="w-full flex items-center gap-4 p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-plus text-muted-foreground text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Start from Scratch</h4>
                    <p className="text-sm text-muted-foreground">Build a custom form with your own fields</p>
                  </div>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </button>
              </div>

              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setShowPicker(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardContent className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingTemplate ? 'Edit Form Template' : 'Create Form Template'}
              </h3>

              <form
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                  // Prevent Enter from submitting when in textareas or field editors
                  if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'TEXTAREA') {
                    e.stopPropagation();
                  }
                }}
                className="space-y-6"
              >
                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

                {/* Form Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Form Name *</label>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Solar Inspection Checklist"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link to Work Type</label>
                    <select
                      value={formWorkType}
                      onChange={(e) => setFormWorkType(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Any work type</option>
                      {WORK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Form description..."
                  />
                </div>

                {/* Sections */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Sections</label>
                    <button
                      type="button"
                      onClick={addSection}
                      className="text-sm text-primary hover:underline"
                    >
                      <i className="fas fa-plus mr-1"></i>Add Section
                    </button>
                  </div>
                  {sections.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {sections.map(section => (
                        <div key={section.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${editingSection === section.id ? 'ring-2 ring-primary' : ''}`}>
                          {editingSection === section.id ? (
                            <input
                              value={section.title}
                              onChange={(e) => updateSection(section.id, e.target.value)}
                              className="w-32 text-sm bg-transparent border-0 focus:outline-none"
                              autoFocus
                              onBlur={() => setEditingSection(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingSection(null)}
                            />
                          ) : (
                            <span className="text-sm font-medium">{section.title}</span>
                          )}
                          <button type="button" onClick={() => setEditingSection(section.id)} className="text-muted-foreground hover:text-foreground">
                            <i className="fas fa-edit text-xs"></i>
                          </button>
                          <button type="button" onClick={() => removeSection(section.id)} className="text-muted-foreground hover:text-destructive">
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Sections help organize fields into groups. Fields can be assigned to sections below.</p>
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

                {/* Field List - Grouped by Section */}
                {fields.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Form Fields ({fields.length})</label>
                    <div className="space-y-4">
                      {/* Unsectioned fields */}
                      {getFieldsForSection(null).length > 0 && (
                        <div className="border rounded-lg p-3 bg-muted/30">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">General Fields</p>
                          <div className="space-y-2">
                            {getFieldsForSection(null).map((field, index) => renderFieldEditor(field, index))}
                          </div>
                        </div>
                      )}

                      {/* Sectioned fields */}
                      {sections.map(section => {
                        const sectionFields = getFieldsForSection(section.id);
                        return (
                          <div key={section.id} className="border rounded-lg p-3 bg-muted/30">
                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                              <i className="fas fa-folder-open mr-1"></i>
                              {section.title}
                            </p>
                            {sectionFields.length > 0 ? (
                              <div className="space-y-2">
                                {sectionFields.map((field, index) => renderFieldEditor(field, index))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic py-2">No fields in this section. Assign fields using the dropdown.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={closeBuilder} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={loading || fields.length === 0 || !formName} className="flex-1">
                    {loading ? (editingTemplate ? 'Saving...' : 'Creating...') : (editingTemplate ? 'Save Changes' : 'Create Form')}
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
            <Button onClick={() => setShowPicker(true)}><i className="fas fa-plus mr-2"></i>Create First Form</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {formTemplates.map((form) => (
            <Card
              key={form.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => openEditForm(form)}
            >
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
                      {form.schema?.sections && form.schema.sections.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {form.schema.sections.length} sections
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleClone(form.id, e)}
                      disabled={cloning === form.id}
                      className="text-muted-foreground hover:text-primary"
                      title="Clone template"
                    >
                      <i className={`fas ${cloning === form.id ? 'fa-spinner fa-spin' : 'fa-copy'} text-xs`}></i>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(form.id); }}
                      disabled={deleting === form.id}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete template"
                    >
                      <i className={`fas ${deleting === form.id ? 'fa-spinner fa-spin' : 'fa-trash'} text-xs`}></i>
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
