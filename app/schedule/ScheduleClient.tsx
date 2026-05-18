'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkLogForm } from '@/components/WorkLogForm';
import { updateWorkLogStatus, deleteWorkLog } from './actions';

interface PhotoMeta {
  url: string;
  type: 'before' | 'after' | 'general';
  capturedAt: string;
}

interface WorkLog {
  id: string;
  customer_name: string;
  work_type: string;
  location_name: string;
  city: string;
  state: string;
  service_date: string;
  start_time: string | null;
  status: string;
  work_performed: string;
  image_urls: string[] | null;
  photo_metadata: PhotoMeta[] | null;
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

export function ScheduleClient({ scheduledJobs, formTemplates }: ScheduleClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(id);
    await updateWorkLogStatus(id, status);
    router.refresh();
    setUpdating(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work log?')) return;
    setUpdating(id);
    await deleteWorkLog(id);
    router.refresh();
    setUpdating(null);
  };

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
            <Card key={job.id}>
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
                      {/* Photos */}
                      {job.photo_metadata && job.photo_metadata.length > 0 && (
                        <div className="mt-3 flex gap-4">
                          {/* Before photos */}
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
                          {/* After photos */}
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
                  <div className="flex flex-col items-end gap-2 ml-4">
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
                      onClick={() => handleDelete(job.id)}
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
