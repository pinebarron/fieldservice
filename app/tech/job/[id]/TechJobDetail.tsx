'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormPhotoField } from '@/components/FormPhotoField';
import { FormDocumentField } from '@/components/FormDocumentField';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { checkIn, checkOut, updateJobNotes, saveFormSubmission, toggleCustomerConfirmation, sendScorecard } from '../../actions';
import { useOfflineForm } from '@/lib/offline/useOfflineForm';
import type { FormPhotoValue, PhotoFieldConfig, FormDocumentValue, DocumentFieldConfig } from '@/lib/form-types';

interface PhotoMeta {
  url: string;
  type: 'before' | 'after' | 'general';
  fieldLabel?: string;
  capturedAt: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
}

interface ShowIfCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'isNotEmpty' | 'isEmpty';
  value?: string | boolean;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  showIf?: ShowIfCondition;
  photoConfig?: PhotoFieldConfig;
  documentConfig?: DocumentFieldConfig;
}

// Evaluate whether a field should be shown based on its showIf condition
function evaluateShowIf(condition: ShowIfCondition | undefined, formResponses: Record<string, unknown>): boolean {
  if (!condition) return true;
  if (!condition.field) return true;

  const fieldValue = formResponses[condition.field];
  let conditionValue = condition.value;

  // Normalize boolean comparisons
  const normalizedFieldValue = fieldValue === 'true' ? true : fieldValue === 'false' ? false : fieldValue;
  const normalizedConditionValue = conditionValue === 'true' ? true : conditionValue === 'false' ? false : conditionValue;

  switch (condition.operator) {
    case 'equals':
      return normalizedFieldValue === normalizedConditionValue;
    case 'notEquals':
      return normalizedFieldValue !== normalizedConditionValue;
    case 'contains':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
      }
      return false;
    case 'isNotEmpty':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'isEmpty':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    default:
      return true;
  }
}

interface FormTemplateData {
  id: string;
  name: string;
  schema: { fields: FormField[] };
}

interface FormSubmission {
  id: string;
  template_id: string;
  responses: Record<string, unknown>;
  submitted_at: string;
  form_templates?: FormTemplateData | FormTemplateData[];
}

// Helper to get form template from submission (handles array or single object)
function getFormTemplate(submission: FormSubmission): FormTemplateData | null {
  if (!submission.form_templates) return null;
  if (Array.isArray(submission.form_templates)) {
    return submission.form_templates[0] || null;
  }
  return submission.form_templates;
}

interface AssignedTech {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface Property {
  id: string;
  property_type: string;
}

interface WorkLog {
  id: string;
  customer_name: string;
  work_type: string;
  location_name: string;
  city: string;
  state: string;
  zip_code: string;
  service_date: string;
  start_time: string | null;
  end_time: string | null;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  status: string;
  work_performed: string;
  additional_notes: string | null;
  image_urls: string[] | null;
  photo_metadata: PhotoMeta[] | null;
  form_submissions?: FormSubmission[];
  property_id?: string | null;
  property?: Property | Property[] | null;
  technician_user_id?: string | null;
  assigned_tech?: AssignedTech | AssignedTech[] | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  check_in_lat?: string | null;
  check_in_lng?: string | null;
  customer_confirmed?: string | null;
  confirmed_at?: string | null;
  feedback_token?: string | null;
  feedback_sent_at?: string | null;
  feedback_response?: {
    quality: number;
    professionalism: number;
    value: number;
    timeliness: number;
    comment?: string;
  } | null;
  feedback_submitted_at?: string | null;
}

interface FormTemplate {
  id: string;
  name: string;
  work_type: string | null;
  schema: { fields: FormField[] };
}

interface TechJobDetailProps {
  job: WorkLog;
  canEdit: boolean;
  isAssigned: boolean;
  currentUserId: string;
  formTemplates: FormTemplate[];
  businessId: string;
}

export function TechJobDetail({
  job,
  canEdit,
  isAssigned,
  currentUserId,
  formTemplates,
  businessId,
}: TechJobDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [workPerformed, setWorkPerformed] = useState(job.work_performed || '');
  const [notes, setNotes] = useState(job.additional_notes || '');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isEditingForm, setIsEditingForm] = useState<string | null>(null); // template ID being edited
  const [formResponses, setFormResponses] = useState<Record<string, unknown>>({});
  const [savedOffline, setSavedOffline] = useState(false);
  const [scorecardUrl, setScorecardUrl] = useState<string | null>(null);
  const [scorecardCopied, setScorecardCopied] = useState(false);

  // Offline form support
  const { isOnline, saveSubmission, cacheTemplates } = useOfflineForm({ businessId });

  // Cache form templates for offline use when online
  useEffect(() => {
    if (isOnline && formTemplates.length > 0) {
      cacheTemplates(formTemplates.map(t => ({
        id: t.id,
        business_id: businessId,
        name: t.name,
        description: null,
        work_type: t.work_type,
        schema: t.schema,
        logic_rules: null,
        is_active: 'true',
        created_at: null,
      })));
    }
  }, [isOnline, formTemplates, businessId, cacheTemplates]);

  // Handle Supabase returning array or single object
  const assignedTech = Array.isArray(job.assigned_tech) ? job.assigned_tech[0] : job.assigned_tech;
  const property = Array.isArray(job.property) ? job.property[0] : job.property;
  const propertyType = property?.property_type || 'residential';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'scheduled':
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setError('');

    // Try to get location, but don't fail if we can't
    let lat: number | null = null;
    let lng: number | null = null;

    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }
    } catch (err) {
      // Geolocation failed - continue without it
      console.log('Geolocation unavailable, checking in without location');
    }

    const result = await checkIn(job.id, lat, lng);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError('');

    // Try to get location, but don't fail if we can't
    let lat: number | null = null;
    let lng: number | null = null;

    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }
    } catch (err) {
      // Geolocation failed - continue without it
      console.log('Geolocation unavailable, checking out without location');
    }

    const result = await checkOut(job.id, lat, lng);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setLoading(false);
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    setError('');

    const result = await updateJobNotes(job.id, workPerformed, notes);

    if (result.error) {
      setError(result.error);
    } else {
      setIsEditingNotes(false);
      router.refresh();
    }

    setLoading(false);
  };

  const handleStartEditForm = (templateId: string, existingResponses?: Record<string, unknown>) => {
    setIsEditingForm(templateId);
    setFormResponses(existingResponses || {});
  };

  const handleSaveForm = async (templateId?: string) => {
    const formTemplateId = templateId || isEditingForm;
    if (!formTemplateId) return;

    setLoading(true);
    setError('');
    setSavedOffline(false);

    // Find existing submission for this template
    const existingSubmission = job.form_submissions?.find(
      s => s.template_id === formTemplateId
    );

    // Use offline-aware submission
    const result = await saveSubmission(
      job.id,
      formTemplateId,
      formResponses,
      existingSubmission?.id
    );

    if (result.error) {
      setError(result.error);
    } else {
      setIsEditingForm(null);
      setFormResponses({});

      // Check if saved offline
      if (result.offlineId) {
        setSavedOffline(true);
      } else {
        router.refresh();
      }
    }

    setLoading(false);
  };

  const handleFormFieldChange = (fieldId: string, value: unknown) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleToggleConfirmation = async () => {
    setLoading(true);
    setError('');

    const result = await toggleCustomerConfirmation(job.id);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setLoading(false);
  };

  const handleSendScorecard = async () => {
    setLoading(true);
    setError('');

    const result = await sendScorecard(job.id);

    if (result.error) {
      setError(result.error);
    } else if (result.feedbackUrl) {
      const fullUrl = `${window.location.origin}${result.feedbackUrl}`;
      setScorecardUrl(fullUrl);
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(fullUrl);
        setScorecardCopied(true);
        setTimeout(() => setScorecardCopied(false), 3000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      router.refresh();
    }

    setLoading(false);
  };

  const copyFeedbackUrl = async () => {
    const url = scorecardUrl || (job.feedback_token ? `${window.location.origin}/feedback/${job.feedback_token}` : null);
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setScorecardCopied(true);
        setTimeout(() => setScorecardCopied(false), 3000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const renderFormField = (field: FormField) => {
    const value = formResponses[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={String(value)}
            onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={String(value)}
            onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={String(value)}
            onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          />
        );
      case 'time':
        return (
          <input
            type="time"
            value={String(value)}
            onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          />
        );
      case 'select':
        return (
          <select
            value={String(value)}
            onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFormFieldChange(field.id, e.target.checked)}
              className="rounded border-input"
              disabled={loading}
            />
            <span className="text-sm">{field.label}</span>
          </label>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                  className="border-input"
                  disabled={loading}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case 'photo':
        const photoValue = (value as FormPhotoValue[] | undefined) || [];
        return (
          <FormPhotoField
            field={field as any}
            value={photoValue}
            onChange={(photos) => handleFormFieldChange(field.id, photos)}
            jobLocation={undefined}
            disabled={loading}
          />
        );
      case 'document':
        const documentValue = (value as FormDocumentValue[] | undefined) || [];
        return (
          <FormDocumentField
            field={field as any}
            value={documentValue}
            onChange={(documents) => handleFormFieldChange(field.id, documents)}
            disabled={loading}
          />
        );
      case 'signature':
        return (
          <SignatureCanvas
            value={formResponses[field.id] as string | undefined}
            onChange={(sig) => handleFormFieldChange(field.id, sig)}
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
                  onClick={() => handleFormFieldChange(field.id, null)}
                  disabled={loading}
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
                        handleFormFieldChange(field.id, {
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
                disabled={loading}
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
            value={String(value)}
            onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          />
        );
    }
  };

  // Group photos by fieldLabel
  const photosByLabel = (job.photo_metadata || []).reduce((acc, photo) => {
    const label = photo.fieldLabel || (photo.type === 'before' ? 'Before' : photo.type === 'after' ? 'After' : 'Other Photos');
    if (!acc[label]) {
      acc[label] = { photos: [], type: photo.type };
    }
    acc[label].photos.push(photo);
    return acc;
  }, {} as Record<string, { photos: PhotoMeta[]; type: string }>);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/tech" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
        <i className="fas fa-arrow-left"></i>
        Back to Work Orders
      </Link>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="p-3 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm flex items-center gap-2">
          <i className="fas fa-wifi-slash"></i>
          <span>You're offline. Changes will sync when you're back online.</span>
        </div>
      )}

      {/* Saved offline notification */}
      {savedOffline && (
        <div className="p-3 rounded-md bg-blue-100 border border-blue-300 text-blue-800 text-sm flex items-center gap-2">
          <i className="fas fa-cloud-upload-alt"></i>
          <span>Form saved offline. It will sync automatically when you're back online.</span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Job Header Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-foreground">{job.customer_name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  propertyType === 'commercial'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {propertyType === 'commercial' ? 'Commercial' : 'Residential'}
                </span>
              </div>
              <p className="text-muted-foreground">{job.work_type}</p>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-medium border ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
          </div>

          {/* Assignment badge */}
          {isAssigned ? (
            <div className="flex items-center gap-2 mb-4 p-2 bg-primary/10 rounded-lg">
              <i className="fas fa-user-check text-primary"></i>
              <span className="text-sm text-primary font-medium">This work order is assigned to you</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-4 p-2 bg-yellow-100 rounded-lg">
              <i className="fas fa-info-circle text-yellow-600"></i>
              <span className="text-sm text-yellow-700">
                Assigned to: {assignedTech?.first_name || assignedTech?.email || 'Unknown'}
                {!canEdit && ' (view only)'}
              </span>
            </div>
          )}

          {/* Action buttons */}
          {canEdit && (
            <div className="flex gap-3">
              {job.status === 'scheduled' && (
                <Button
                  onClick={handleCheckIn}
                  disabled={loading}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {loading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-play"></i>
                  )}
                  Check In
                </Button>
              )}

              {job.status === 'in-progress' && (
                <>
                  <Button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    {loading ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-check-circle"></i>
                    )}
                    Complete Work Order
                  </Button>
                </>
              )}

              {job.status === 'completed' && (
                <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <i className="fas fa-check-circle text-green-600 mr-2"></i>
                  <span className="text-green-700 font-medium">Work Order Completed</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Confirmation Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {job.customer_confirmed === 'true' ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <i className="fas fa-check-circle text-green-600 text-lg"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-green-700">Customer Confirmed</p>
                    {job.confirmed_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.confirmed_at).toLocaleDateString()} at {new Date(job.confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <i className="fas fa-clock text-amber-600 text-lg"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-700">Awaiting Confirmation</p>
                    <p className="text-xs text-muted-foreground">Customer has not confirmed this appointment</p>
                  </div>
                </>
              )}
            </div>
            {canEdit && (
              <Button
                variant={job.customer_confirmed === 'true' ? 'outline' : 'default'}
                size="sm"
                onClick={handleToggleConfirmation}
                disabled={loading}
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : job.customer_confirmed === 'true' ? (
                  <>
                    <i className="fas fa-times mr-1"></i>
                    Unconfirm
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-1"></i>
                    Mark Confirmed
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Scorecard Card */}
      {job.status === 'completed' && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {job.feedback_submitted_at ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <i className="fas fa-star text-green-600 text-lg"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Feedback Received</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(job.feedback_submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                ) : job.feedback_sent_at ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <i className="fas fa-paper-plane text-blue-600 text-lg"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">Scorecard Sent</p>
                      <p className="text-xs text-muted-foreground">
                        Sent {new Date(job.feedback_sent_at).toLocaleDateString()} - awaiting response
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <i className="fas fa-clipboard-list text-muted-foreground text-lg"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Customer Scorecard</p>
                      <p className="text-xs text-muted-foreground">Send feedback request to customer</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {job.feedback_token && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyFeedbackUrl}
                  >
                    {scorecardCopied ? (
                      <>
                        <i className="fas fa-check mr-1 text-green-600"></i>
                        Copied!
                      </>
                    ) : (
                      <>
                        <i className="fas fa-copy mr-1"></i>
                        Copy Link
                      </>
                    )}
                  </Button>
                )}
                {!job.feedback_token && canEdit && (
                  <Button
                    size="sm"
                    onClick={handleSendScorecard}
                    disabled={loading}
                  >
                    {loading ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-1"></i>
                        Generate Link
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Show feedback results if submitted */}
            {job.feedback_response && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'quality', label: 'Quality' },
                    { key: 'professionalism', label: 'Professionalism' },
                    { key: 'value', label: 'Value' },
                    { key: 'timeliness', label: 'Timeliness' },
                  ].map(({ key, label }) => {
                    const rating = (job.feedback_response as any)?.[key] || 0;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <i
                              key={star}
                              className={`fas fa-star text-sm ${
                                star <= rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            ></i>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {job.feedback_response.comment && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Customer Comment</p>
                    <p className="text-sm">{job.feedback_response.comment}</p>
                  </div>
                )}
              </div>
            )}

            {/* Show copied URL */}
            {scorecardUrl && !job.feedback_submitted_at && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <i className="fas fa-check-circle mr-2"></i>
                  Link copied to clipboard! Share it with your customer.
                </p>
                <p className="text-xs text-green-600 mt-1 font-mono break-all">{scorecardUrl}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location Card */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <i className="fas fa-map-marker-alt text-primary"></i>
            Location
          </h3>
          <p className="font-medium">{job.location_name}</p>
          <p className="text-muted-foreground">{job.city}, {job.state} {job.zip_code}</p>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.location_name}, ${job.city}, ${job.state} ${job.zip_code}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-primary hover:underline"
          >
            <i className="fas fa-directions"></i>
            Get Directions
          </a>
        </CardContent>
      </Card>

      {/* Schedule Card */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <i className="fas fa-calendar text-primary"></i>
            Schedule
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Service Date</p>
              <p className="font-medium">{job.service_date}</p>
            </div>
            {job.check_in_time && (
              <div>
                <p className="text-xs text-muted-foreground">Checked In</p>
                <p className="font-medium">
                  {new Date(job.check_in_time).toLocaleTimeString()}
                </p>
              </div>
            )}
            {job.check_out_time && (
              <div>
                <p className="text-xs text-muted-foreground">Checked Out</p>
                <p className="font-medium">
                  {new Date(job.check_out_time).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Notes Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <i className="fas fa-clipboard text-primary"></i>
              Work Notes
            </h3>
            {canEdit && !isEditingNotes && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(true)}>
                <i className="fas fa-edit mr-1"></i>
                Edit
              </Button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Work Performed</label>
                <textarea
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Describe the work performed..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsEditingNotes(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveNotes} disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {job.work_performed ? (
                <p className="text-foreground whitespace-pre-wrap">{job.work_performed}</p>
              ) : (
                <p className="text-muted-foreground italic">No work notes yet</p>
              )}
              {job.additional_notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                  <p className="text-foreground whitespace-pre-wrap">{job.additional_notes}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Photos Card */}
      {Object.keys(photosByLabel).length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <i className="fas fa-camera text-primary"></i>
              Photos
            </h3>

            {Object.entries(photosByLabel).map(([label, { photos, type }]) => {
              const colorClass = type === 'before'
                ? { text: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-400' }
                : type === 'after'
                ? { text: 'text-green-600', bg: 'bg-green-500', border: 'border-green-400' }
                : { text: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-400' };

              return (
                <div key={label} className="mb-4">
                  <p className={`text-sm font-medium ${colorClass.text} mb-2 flex items-center gap-2`}>
                    <span className={`w-3 h-3 rounded-full ${colorClass.bg}`}></span>
                    {label} ({photos.length})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo.url}
                        alt={label}
                        onClick={() => setLightboxImage(photo.url)}
                        className={`w-full aspect-square object-cover rounded-lg border-2 ${colorClass.border} cursor-pointer hover:opacity-80 transition-opacity`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Form Submissions */}
      {job.form_submissions && job.form_submissions.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <i className="fas fa-file-alt text-primary"></i>
              Form Data
            </h3>
            {job.form_submissions.map((submission) => {
              const formTemplate = getFormTemplate(submission);
              const fields = formTemplate?.schema?.fields || [];
              const displayFields = fields.filter(f => f.type !== 'photo'); // Keep signatures visible in display
              const isEditing = isEditingForm === submission.template_id;

              return (
                <div key={submission.id} className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-sm">
                      {formTemplate?.name || 'Form Submission'}
                    </p>
                    {canEdit && !isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEditForm(submission.template_id, submission.responses as Record<string, unknown>)}
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      {fields.map((field) => {
                        // Check conditional display
                        if (!evaluateShowIf(field.showIf, formResponses)) {
                          return null;
                        }
                        return (
                          <div key={field.id}>
                            {field.type !== 'checkbox' && (
                              <label className="block text-sm font-medium mb-1">
                                {field.label} {field.required && <span className="text-destructive">*</span>}
                              </label>
                            )}
                            {renderFormField(field)}
                          </div>
                        );
                      })}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingForm(null);
                            setFormResponses({});
                          }}
                          className="flex-1"
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveForm()}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayFields.map((field) => {
                        const value = submission.responses[field.id];
                        if (value === undefined || value === null || value === '') return null;

                        // Handle signature fields specially
                        if (field.type === 'signature') {
                          return (
                            <div key={field.id}>
                              <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                              <img
                                src={value as string}
                                alt={field.label}
                                className="h-16 object-contain border rounded bg-white"
                              />
                            </div>
                          );
                        }

                        // Handle document fields
                        if (field.type === 'document') {
                          const docs = value as FormDocumentValue[];
                          if (!Array.isArray(docs) || docs.length === 0) return null;
                          return (
                            <div key={field.id}>
                              <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                              <div className="space-y-1">
                                {docs.map((doc, i) => (
                                  <a
                                    key={i}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                  >
                                    <i className="fas fa-file"></i>
                                    {doc.fileName}
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        const displayValue = field.type === 'checkbox'
                          ? (value === true || value === 'true' ? 'Yes' : 'No')
                          : String(value);

                        return (
                          <div key={field.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{field.label}:</span>
                            <span className="font-medium">{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Fill Out Form - only show if no form submission exists and there's an exact work type match */}
      {(() => {
        // If there's already a form submission, don't show "Fill Out Form" section
        if (job.form_submissions && job.form_submissions.length > 0) return null;

        // Only show forms that EXACTLY match the job's work type
        const exactMatchTemplates = formTemplates.filter(t =>
          t.work_type && t.work_type === job.work_type
        );

        // If no exact matches, fall back to forms with no work_type specified
        const availableTemplates = exactMatchTemplates.length > 0
          ? exactMatchTemplates
          : formTemplates.filter(t => !t.work_type);

        if (!canEdit || availableTemplates.length === 0) return null;

        return (
          <Card>
            <CardContent className="p-5">
              {(() => {
                // Auto-select if there's exactly one matching template
                const activeTemplateId = isEditingForm || (availableTemplates.length === 1 ? availableTemplates[0].id : null);
                const template = activeTemplateId ? formTemplates.find(t => t.id === activeTemplateId) : null;

                if (template) {
                  // Show form fields directly
                  const fields = template.schema?.fields || [];
                  const editableFields = fields; // Include all field types

                  return (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <i className="fas fa-clipboard-list text-primary"></i>
                        {template.name}
                      </h3>
                      {editableFields.map((field) => {
                        // Check conditional display
                        if (!evaluateShowIf(field.showIf, formResponses)) {
                          return null;
                        }
                        return (
                          <div key={field.id}>
                            {field.type !== 'checkbox' && (
                              <label className="block text-sm font-medium mb-1">
                                {field.label} {field.required && <span className="text-destructive">*</span>}
                              </label>
                            )}
                            {renderFormField(field)}
                          </div>
                        );
                      })}
                      <Button
                        onClick={() => handleSaveForm(template.id)}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Saving...' : 'Save Form'}
                      </Button>
                    </div>
                  );
                }

                // Multiple templates available - show selection
                return (
                  <>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <i className="fas fa-clipboard-list text-primary"></i>
                      Select Form
                    </h3>
                    <div className="space-y-2">
                      {availableTemplates.map(t => (
                        <Button
                          key={t.id}
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => handleStartEditForm(t.id)}
                        >
                          <i className="fas fa-file-alt"></i>
                          {t.name}
                        </Button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        );
      })()}

      {/* Lightbox for full-size photos */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <i className="fas fa-times text-2xl"></i>
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
