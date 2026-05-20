'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createFormTemplate, updateFormTemplate, deleteFormTemplate, createStarterTemplate, type FormField, type FormFieldType, type FormSection } from './actions';

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

export function FormsClient({ formTemplates }: FormsClientProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWorkType, setFormWorkType] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const router = useRouter();

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

              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(form.id); }}
                    disabled={deleting === form.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <i className={`fas ${deleting === form.id ? 'fa-spinner fa-spin' : 'fa-trash'} text-xs`}></i>
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
