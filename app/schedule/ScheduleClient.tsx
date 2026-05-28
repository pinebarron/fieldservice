'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkLogForm } from '@/components/WorkLogForm';
import { updateWorkLogStatus, deleteWorkLog } from './actions';
import { generateWorkReportPDF, downloadPDF } from '@/components/WorkReportPDF';
import { JobMap } from '@/components/JobMap';
import { JobCalendar } from '@/components/JobCalendar';

type ViewMode = 'list' | 'calendar';

interface PhotoMeta {
  url: string;
  type: 'before' | 'after' | 'general';
  fieldLabel?: string;
  capturedAt: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
}

interface FormSubmission {
  id: string;
  template_id: string;
  responses: Record<string, unknown>;
  submitted_at: string;
  form_templates?: {
    name: string;
    schema: { fields: { id: string; label: string; type: string }[] };
  };
}

interface AssignedTech {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
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
  technician_user_id?: string | null;
  assigned_tech?: AssignedTech | null;
}

type FormTemplate = {
  id: string;
  name: string;
  work_type: string | null;
  schema: { fields: any[] };
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

type BusinessInfo = {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  logoUrl?: string;
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

interface ScheduleClientProps {
  scheduledJobs: WorkLog[] | null;
  formTemplates: FormTemplate[];
  properties?: Property[];
  teamMembers?: TeamMember[];
  business?: BusinessInfo;
  initialSelectedJobId?: string | null;
  openNewForm?: boolean;
}

export function ScheduleClient({ scheduledJobs, formTemplates, properties = [], teamMembers = [], business, initialSelectedJobId, openNewForm }: ScheduleClientProps) {
  const [showForm, setShowForm] = useState(openNewForm || false);
  const [selectedJob, setSelectedJob] = useState<WorkLog | null>(() => {
    // Auto-select job from URL parameter
    if (initialSelectedJobId && scheduledJobs) {
      return scheduledJobs.find(j => j.id === initialSelectedJobId) || null;
    }
    return null;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const router = useRouter();

  // Handle job click from calendar
  const handleJobClick = (job: WorkLog) => {
    setSelectedJob(job);
  };

  const handleStatusChange = async (id: string, status: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setUpdating(id);
    await updateWorkLogStatus(id, status);
    router.refresh();
    setUpdating(null);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this work log?')) return;
    setUpdating(id);
    await deleteWorkLog(id);
    setSelectedJob(null);
    router.refresh();
    setUpdating(null);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleExportPDF = async () => {
    if (!selectedJob) return;
    setGeneratingPDF(true);
    try {
      const blob = await generateWorkReportPDF(selectedJob, business);
      const filename = `WorkOrder-${selectedJob.customer_name.replace(/\s+/g, '_')}-${selectedJob.service_date}.pdf`;
      downloadPDF(blob, filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Group photos by fieldLabel (or fallback to type-based labels for legacy photos)
  const photosByLabel = (selectedJob?.photo_metadata || []).reduce((acc, photo) => {
    const label = photo.fieldLabel || (photo.type === 'before' ? 'Before' : photo.type === 'after' ? 'After' : 'Other Photos');
    if (!acc[label]) {
      acc[label] = { photos: [], type: photo.type };
    }
    acc[label].photos.push(photo);
    return acc;
  }, {} as Record<string, { photos: PhotoMeta[]; type: string }>);

  // Legacy grouping for backwards compatibility display
  const beforePhotos = selectedJob?.photo_metadata?.filter(p => p.type === 'before') || [];
  const afterPhotos = selectedJob?.photo_metadata?.filter(p => p.type === 'after') || [];
  const generalPhotos = selectedJob?.photo_metadata?.filter(p => p.type === 'general') || [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Schedule</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            View and manage jobs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-input overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <i className="fas fa-list mr-2"></i>
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              Calendar
            </button>
          </div>
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <i className="fas fa-plus"></i>
            New Job
          </Button>
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-8">
            <CardContent className="p-6 max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create New Job</h3>
              <WorkLogForm
                onClose={() => setShowForm(false)}
                onSuccess={() => router.refresh()}
                formTemplates={formTemplates}
                properties={properties}
                teamMembers={teamMembers}
                defaultCity={business?.city || ''}
                defaultState={business?.state || ''}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail/Edit View Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => { setSelectedJob(null); setIsEditing(false); }}>
          <Card className="w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6 max-h-[85vh] overflow-y-auto">
              {isEditing ? (
                /* Edit Mode - use full WorkLogForm */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Edit Job</h3>
                    <button type="button" onClick={() => { setSelectedJob(null); setIsEditing(false); }} className="text-muted-foreground hover:text-foreground p-2">
                      <i className="fas fa-times text-lg"></i>
                    </button>
                  </div>
                  <WorkLogForm
                    onClose={cancelEditing}
                    onSuccess={() => {
                      setIsEditing(false);
                      setSelectedJob(null);
                      router.refresh();
                    }}
                    formTemplates={formTemplates}
                    properties={properties}
                    teamMembers={teamMembers}
                    editJob={selectedJob}
                  />
                </>
              ) : (
                /* View Mode */
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">{selectedJob.customer_name}</h3>
                      <p className="text-muted-foreground">{selectedJob.work_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedJob.status}
                        onChange={(e) => handleStatusChange(selectedJob.id, e.target.value)}
                        disabled={updating === selectedJob.id}
                        className={`text-sm px-3 py-1.5 rounded-full font-medium border-0 cursor-pointer ${
                          selectedJob.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : selectedJob.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button onClick={() => setSelectedJob(null)} className="text-muted-foreground hover:text-foreground p-2">
                        <i className="fas fa-times text-lg"></i>
                      </button>
                    </div>
                  </div>

                  {/* Map */}
                  <div className="mb-6">
                    <JobMap
                      workLogs={[selectedJob]}
                      height="180px"
                    />
                  </div>

                  {/* Location & Date */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="font-medium">{selectedJob.location_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedJob.city}, {selectedJob.state} {selectedJob.zip_code}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Service Date</p>
                      <p className="font-medium">{selectedJob.service_date}</p>
                      {selectedJob.start_time && (
                        <p className="text-sm text-muted-foreground">
                          {selectedJob.start_time}{selectedJob.end_time && ` - ${selectedJob.end_time}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Get Directions Button */}
                  <div className="mb-6">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedJob.location_name}, ${selectedJob.city}, ${selectedJob.state} ${selectedJob.zip_code}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <i className="fas fa-directions"></i>
                      Get Directions
                    </a>
                  </div>

                  {/* Work Performed */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Work Performed</h4>
                    <p className="text-foreground bg-muted/30 rounded-lg p-3">{selectedJob.work_performed}</p>
                  </div>

                  {/* Additional Notes */}
                  {selectedJob.additional_notes && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Additional Notes</h4>
                      <p className="text-muted-foreground bg-muted/30 rounded-lg p-3">{selectedJob.additional_notes}</p>
                    </div>
                  )}

                  {/* Photos Section */}
                  {Object.keys(photosByLabel).length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Photos</h4>

                      {Object.entries(photosByLabel).map(([label, { photos, type }]) => {
                        // Color coding based on photo type
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
                    </div>
                  )}

                  {/* Form Submissions */}
                  {selectedJob.form_submissions && selectedJob.form_submissions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Form Data</h4>
                      {selectedJob.form_submissions.map((submission) => {
                        const signatureFields = submission.form_templates?.schema?.fields?.filter(f => f.type === 'signature') || [];
                        const otherFields = submission.form_templates?.schema?.fields?.filter(f => f.type !== 'signature' && f.type !== 'photo') || [];

                        return (
                          <div key={submission.id} className="bg-muted/30 rounded-lg p-4">
                            <p className="font-medium text-sm mb-3">
                              {submission.form_templates?.name || 'Form Submission'}
                            </p>
                            <div className="space-y-2">
                              {otherFields.map((field) => {
                                const value = submission.responses[field.id];
                                if (value === undefined || value === null || value === '') return null;

                                // Format checkbox values
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

                            {/* Signatures */}
                            {signatureFields.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                  <i className="fas fa-signature text-primary"></i>
                                  Signatures
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                  {signatureFields.map((field) => {
                                    const value = submission.responses[field.id] as string | undefined;
                                    return (
                                      <div key={field.id}>
                                        <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                                        {value ? (
                                          <img
                                            src={value}
                                            alt={field.label}
                                            className="w-full h-20 object-contain border rounded bg-white"
                                          />
                                        ) : (
                                          <div className="w-full h-20 border rounded bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
                                            Not signed
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedJob(null)}>
                      Close
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      disabled={generatingPDF}
                    >
                      <i className={`fas ${generatingPDF ? 'fa-spinner fa-spin' : 'fa-file-pdf'} mr-2`}></i>
                      {generatingPDF ? 'Generating...' : 'Export PDF'}
                    </Button>
                    <Button onClick={startEditing} className="flex-1">
                      <i className="fas fa-edit mr-2"></i>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={(e) => handleDelete(selectedJob.id, e)}
                      disabled={updating === selectedJob.id}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

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

      {!scheduledJobs || scheduledJobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-calendar-alt text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No jobs yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first job to get started.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <i className="fas fa-plus mr-2"></i>
              Create First Job
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <Card>
          <CardContent className="p-4">
            <JobCalendar
              jobs={scheduledJobs}
              onJobClick={handleJobClick}
              onDateClick={(date) => {
                // Could pre-fill the date when creating a new job
                setShowForm(true);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <div className="space-y-3">
          {scheduledJobs.map((job) => (
            <Card
              key={job.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedJob(job)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-calendar-check text-primary"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{job.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.work_type} - {job.location_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.city}, {job.state} - {job.service_date}
                        {job.assigned_tech && (
                          <>
                            <span className="mx-2">|</span>
                            <i className="fas fa-user mr-1"></i>
                            {job.assigned_tech.first_name || job.assigned_tech.email?.split('@')[0]} {job.assigned_tech.last_name || ''}
                          </>
                        )}
                      </p>
                      {job.work_performed && (
                        <p className="text-sm text-foreground mt-2 line-clamp-2">
                          {job.work_performed}
                        </p>
                      )}
                      {/* Photos thumbnail */}
                      {job.photo_metadata && job.photo_metadata.length > 0 && (
                        <div className="mt-3 flex gap-4">
                          {job.photo_metadata.filter(p => p.type === 'before').length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-orange-600 mb-1">Before</p>
                              <div className="flex gap-1">
                                {job.photo_metadata.filter(p => p.type === 'before').slice(0, 3).map((photo, i) => (
                                  <img
                                    key={i}
                                    src={photo.url}
                                    alt="Before"
                                    className="w-12 h-12 object-cover rounded border-2 border-orange-400"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {job.photo_metadata.filter(p => p.type === 'after').length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-green-600 mb-1">After</p>
                              <div className="flex gap-1">
                                {job.photo_metadata.filter(p => p.type === 'after').slice(0, 3).map((photo, i) => (
                                  <img
                                    key={i}
                                    src={photo.url}
                                    alt="After"
                                    className="w-12 h-12 object-cover rounded border-2 border-green-400"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4" onClick={e => e.stopPropagation()}>
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job.id, e.target.value)}
                      disabled={updating === job.id}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${
                        job.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : job.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={(e) => handleDelete(job.id, e)}
                      disabled={updating === job.id}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <i className="fas fa-trash"></i>
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
