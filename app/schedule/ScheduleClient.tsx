'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkLogForm } from '@/components/WorkLogForm';
import { updateWorkLogStatus, deleteWorkLog, updateWorkLog } from './actions';
import { ImageUpload, type UploadedImage } from '@/components/ImageUpload';

interface PhotoMeta {
  url: string;
  type: 'before' | 'after' | 'general';
  capturedAt: string;
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
  status: string;
  work_performed: string;
  additional_notes: string | null;
  image_urls: string[] | null;
  photo_metadata: PhotoMeta[] | null;
  form_submissions?: FormSubmission[];
}

type FormTemplate = {
  id: string;
  name: string;
  work_type: string | null;
  schema: { fields: any[] };
};

interface ScheduleClientProps {
  scheduledJobs: WorkLog[] | null;
  formTemplates: FormTemplate[];
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

export function ScheduleClient({ scheduledJobs, formTemplates }: ScheduleClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<WorkLog | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editError, setEditError] = useState('');

  // Edit form state
  const [editImages, setEditImages] = useState<UploadedImage[]>([]);

  const router = useRouter();

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
    if (selectedJob) {
      // Initialize edit images from current photos
      const currentImages: UploadedImage[] = (selectedJob.photo_metadata || []).map(p => ({
        url: p.url,
        type: p.type,
        capturedAt: p.capturedAt,
      }));
      setEditImages(currentImages);
      setIsEditing(true);
      setEditError('');
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedJob) return;

    setUpdating(selectedJob.id);
    setEditError('');

    const formData = new FormData(e.currentTarget);
    formData.set('images', JSON.stringify(editImages));

    const result = await updateWorkLog(selectedJob.id, formData);

    if (result?.error) {
      setEditError(result.error);
      setUpdating(null);
    } else {
      setIsEditing(false);
      setSelectedJob(null);
      router.refresh();
      setUpdating(null);
    }
  };

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
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i>
          New Job
        </Button>
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
                /* Edit Mode */
                <form onSubmit={handleEditSubmit}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Edit Job</h3>
                    <button type="button" onClick={() => { setSelectedJob(null); setIsEditing(false); }} className="text-muted-foreground hover:text-foreground p-2">
                      <i className="fas fa-times text-lg"></i>
                    </button>
                  </div>

                  {editError && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
                      {editError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Customer Name *</label>
                        <input
                          name="customerName"
                          defaultValue={selectedJob.customer_name}
                          required
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Work Type *</label>
                        <select
                          name="workType"
                          defaultValue={selectedJob.work_type}
                          required
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
                        defaultValue={selectedJob.location_name}
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">City *</label>
                        <input
                          name="city"
                          defaultValue={selectedJob.city}
                          required
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State *</label>
                        <input
                          name="state"
                          defaultValue={selectedJob.state}
                          required
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">ZIP *</label>
                        <input
                          name="zipCode"
                          defaultValue={selectedJob.zip_code}
                          required
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Service Date *</label>
                        <input
                          name="serviceDate"
                          type="date"
                          defaultValue={selectedJob.service_date}
                          required
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                          name="status"
                          defaultValue={selectedJob.status}
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
                        defaultValue={selectedJob.work_performed}
                        required
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Notes</label>
                      <textarea
                        name="notes"
                        defaultValue={selectedJob.additional_notes || ''}
                        rows={2}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* Photo Management */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium mb-3">
                        <i className="fas fa-camera text-primary mr-2"></i>
                        Photos (Before / After)
                      </label>
                      <ImageUpload images={editImages} onChange={setEditImages} maxImages={10} />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t mt-6">
                    <Button type="button" variant="outline" onClick={cancelEditing} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updating === selectedJob.id} className="flex-1">
                      {updating === selectedJob.id ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
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

                  {/* Location & Date */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
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
                  {(beforePhotos.length > 0 || afterPhotos.length > 0 || generalPhotos.length > 0) && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Photos</h4>

                      {beforePhotos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                            Before ({beforePhotos.length})
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {beforePhotos.map((photo, i) => (
                              <img
                                key={i}
                                src={photo.url}
                                alt="Before"
                                onClick={() => setLightboxImage(photo.url)}
                                className="w-full aspect-square object-cover rounded-lg border-2 border-orange-400 cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {afterPhotos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            After ({afterPhotos.length})
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {afterPhotos.map((photo, i) => (
                              <img
                                key={i}
                                src={photo.url}
                                alt="After"
                                onClick={() => setLightboxImage(photo.url)}
                                className="w-full aspect-square object-cover rounded-lg border-2 border-green-400 cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {generalPhotos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            Other Photos ({generalPhotos.length})
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {generalPhotos.map((photo, i) => (
                              <img
                                key={i}
                                src={photo.url}
                                alt="Photo"
                                onClick={() => setLightboxImage(photo.url)}
                                className="w-full aspect-square object-cover rounded-lg border-2 border-blue-400 cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Submissions */}
                  {selectedJob.form_submissions && selectedJob.form_submissions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Form Data</h4>
                      {selectedJob.form_submissions.map((submission) => (
                        <div key={submission.id} className="bg-muted/30 rounded-lg p-4">
                          <p className="font-medium text-sm mb-3">
                            {submission.form_templates?.name || 'Form Submission'}
                          </p>
                          <div className="space-y-2">
                            {submission.form_templates?.schema?.fields?.map((field) => {
                              const value = submission.responses[field.id];
                              if (value === undefined || value === null || value === '') return null;
                              return (
                                <div key={field.id} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{field.label}:</span>
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedJob(null)} className="flex-1">
                      Close
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
      ) : (
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
                      </p>
                      <p className="text-sm text-foreground mt-2 line-clamp-2">
                        {job.work_performed}
                      </p>
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
