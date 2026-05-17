import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type WorkLog, type PhotoMeta, type BusinessMember, type User, type FormSubmission, type FormTemplate, type FormSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { pdf } from "@react-pdf/renderer";
import { WorkReportPDF } from "@/components/WorkReportPDF";
import { JobMap } from "@/components/JobMap";

interface DetailJobModalProps {
  workLog: WorkLog;
  isOpen: boolean;
  onClose: () => void;
  onOpenLightbox: (images: string[], index: number, metadata?: PhotoMeta[]) => void;
  onRefresh: () => void;
  onEdit: (workLog: WorkLog) => void;
}

function calcDuration(checkIn: string, checkOut: string): string {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (ms <= 0) return "0 min";
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function formatCheckTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function DetailJobModal({ workLog, isOpen, onClose, onOpenLightbox, onRefresh, onEdit }: DetailJobModalProps) {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [localWorkLog, setLocalWorkLog] = useState<WorkLog>(workLog);

  const wl = localWorkLog;

  const { data: business } = useQuery<{ name: string }>({
    queryKey: ["/api/business"],
    enabled: isOpen,
  });

  const { data: members = [] } = useQuery<(BusinessMember & { user: User })[]>({
    queryKey: ["/api/business/members"],
    enabled: isOpen,
  });

  const { data: formSubmissions = [] } = useQuery<(FormSubmission & { template: FormTemplate })[]>({
    queryKey: [`/api/work-logs/${wl.id}/forms`],
    enabled: isOpen,
  });

  const allTechnicianIds: string[] = (wl as any).technicianUserIds?.length
    ? (wl as any).technicianUserIds
    : [wl.technicianUserId];

  const resolveTechName = (userId: string) => {
    if (userId === wl.technicianUserId) {
      const t = (wl as any).technician;
      if (t) return `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();
    }
    const m = members.find(m => m.userId === userId);
    return m ? `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() : userId;
  };

  const handleGenerateReport = async () => {
    setGeneratingPdf(true);
    try {
      const blob = await pdf(
        <WorkReportPDF workLog={wl} businessName={business?.name} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = wl.customerName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      link.download = `work_report_${safeName}_${wl.serviceDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Report downloaded", description: "Work summary PDF saved to your device." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate PDF report.", variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const deleteWorkLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/work-logs/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Work log entry deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onRefresh();
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete work log entry", variant: "destructive" });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      return new Promise<WorkLog>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const data = await apiRequest("POST", `/api/work-logs/${wl.id}/check-in`, {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            resolve(await data.json());
          },
          async () => {
            const data = await apiRequest("POST", `/api/work-logs/${wl.id}/check-in`, {});
            resolve(await data.json());
          },
          { timeout: 8000 }
        );
      });
    },
    onSuccess: (updated: WorkLog) => {
      setLocalWorkLog(updated);
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs'] });
      toast({ title: "Checked in!", description: "Your arrival has been recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to check in.", variant: "destructive" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      return new Promise<WorkLog>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const data = await apiRequest("POST", `/api/work-logs/${wl.id}/check-out`, {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            resolve(await data.json());
          },
          async () => {
            const data = await apiRequest("POST", `/api/work-logs/${wl.id}/check-out`, {});
            resolve(await data.json());
          },
          { timeout: 8000 }
        );
      });
    },
    onSuccess: (updated: WorkLog) => {
      setLocalWorkLog(updated);
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs'] });
      toast({ title: "Checked out!", description: "Your departure has been recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to check out.", variant: "destructive" });
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  };

  const getDuration = () => {
    if (wl.startTime && wl.endTime) return `${wl.startTime} - ${wl.endTime}`;
    return 'Not specified';
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteWorkLogMutation.mutate(wl.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleDownloadPdf = (pdfUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `report_${index + 1}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCheckedIn = !!(wl as any).checkInTime;
  const isCheckedOut = !!(wl as any).checkOutTime;
  const checkInTime: string | undefined = (wl as any).checkInTime;
  const checkOutTime: string | undefined = (wl as any).checkOutTime;
  const checkInLat: string | undefined = (wl as any).checkInLat;
  const checkInLng: string | undefined = (wl as any).checkInLng;
  const checkOutLat: string | undefined = (wl as any).checkOutLat;
  const checkOutLng: string | undefined = (wl as any).checkOutLng;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-2">
            <span data-testid="detail-job-title">{wl.customerName}</span>
            <div className="flex flex-wrap gap-3 text-sm font-normal">
              <span className="text-muted-foreground">
                <i className="fas fa-calendar mr-1"></i>
                {formatDate(wl.serviceDate)}
              </span>
              <span className="text-muted-foreground" data-testid="detail-technicians">
                <i className={`fas ${allTechnicianIds.length > 1 ? "fa-users" : "fa-user"} mr-1`}></i>
                {allTechnicianIds.length === 1
                  ? resolveTechName(allTechnicianIds[0])
                  : allTechnicianIds.map((id, i) => (
                      <span key={id}>
                        {resolveTechName(id)}
                        {i === 0 && <span className="ml-1 text-xs text-primary font-medium">(Lead)</span>}
                        {i < allTechnicianIds.length - 1 && <span className="mx-1 text-border">·</span>}
                      </span>
                    ))
                }
              </span>
              <span className="status-badge px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                <i className="fas fa-check-circle mr-1"></i>
                {wl.status === 'completed' ? 'Completed' : wl.status}
              </span>
              {isCheckedIn && !isCheckedOut && (
                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                  On Site
                </span>
              )}
              {isCheckedIn && isCheckedOut && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-full text-xs font-medium">
                  <i className="fas fa-clock mr-1"></i>
                  {calcDuration(checkInTime!, checkOutTime!)} on site
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Location</h4>
              <p className="text-foreground mb-3" data-testid="detail-job-location">
                {wl.locationName}<br />
                {wl.city}, {wl.state} {wl.zipCode}
              </p>
              <JobMap workLogs={[wl]} className="h-40 sm:h-48 md:h-52" singleJob />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Work Type</h4>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium" data-testid="detail-job-work-type">
                {wl.workType}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Duration</h4>
              <p className="text-foreground" data-testid="detail-job-duration">{getDuration()}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status</h4>
              <p className="text-foreground" data-testid="detail-job-status">
                {wl.status === 'completed' ? 'Work Completed Successfully' : wl.status}
              </p>
            </div>
          </div>

          {/* Check-in / Check-out */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              <i className="fas fa-map-pin mr-2"></i>
              Check-in / Check-out
            </h4>
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
              {!isCheckedIn ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Not checked in yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tap to record your arrival with GPS location</p>
                  </div>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 flex-shrink-0"
                    onClick={() => checkInMutation.mutate()}
                    disabled={checkInMutation.isPending}
                    data-testid="button-check-in"
                  >
                    {checkInMutation.isPending
                      ? <><i className="fas fa-spinner fa-spin"></i> Checking in…</>
                      : <><i className="fas fa-sign-in-alt"></i> Check In</>}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Check-in row */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fas fa-sign-in-alt text-green-600 text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Checked in</p>
                      <p className="text-xs text-muted-foreground">{formatCheckTime(checkInTime!)}</p>
                      {checkInLat && checkInLng && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <i className="fas fa-crosshairs mr-1"></i>
                          {Number(checkInLat).toFixed(5)}, {Number(checkInLng).toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isCheckedOut ? (
                    <>
                      {/* Live timer placeholder + check-out button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pl-12">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Currently on site</p>
                        </div>
                        <Button
                          variant="outline"
                          className="border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-2 flex-shrink-0"
                          onClick={() => checkOutMutation.mutate()}
                          disabled={checkOutMutation.isPending}
                          data-testid="button-check-out"
                        >
                          {checkOutMutation.isPending
                            ? <><i className="fas fa-spinner fa-spin"></i> Checking out…</>
                            : <><i className="fas fa-sign-out-alt"></i> Check Out</>}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Check-out row */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="fas fa-sign-out-alt text-blue-600 text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Checked out</p>
                          <p className="text-xs text-muted-foreground">{formatCheckTime(checkOutTime!)}</p>
                          {checkOutLat && checkOutLng && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <i className="fas fa-crosshairs mr-1"></i>
                              {Number(checkOutLat).toFixed(5)}, {Number(checkOutLng).toFixed(5)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Duration summary */}
                      <div className="ml-12 bg-background rounded-lg border border-border p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-clock text-primary text-sm"></i>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total time on site</p>
                          <p className="text-lg font-bold text-foreground">{calcDuration(checkInTime!, checkOutTime!)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Work Notes */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Work Performed</h4>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap" data-testid="detail-job-work-performed">
                {wl.workPerformed}
              </p>
            </div>
          </div>

          {/* Completed Checklists */}
          {formSubmissions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                <i className="fas fa-clipboard-check mr-2"></i>
                Completed Checklists ({formSubmissions.length})
              </h4>
              <div className="space-y-3">
                {formSubmissions.map((submission) => {
                  const schema = submission.template.schema as FormSchema;
                  const responses = submission.responses as Record<string, unknown>;

                  return (
                    <Card key={submission.id}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <i className="fas fa-file-alt text-primary"></i>
                          {submission.template.name}
                          <span className="text-xs font-normal text-muted-foreground ml-auto">
                            {submission.submittedAt && new Date(submission.submittedAt).toLocaleString()}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {schema.fields?.map((field) => {
                            const value = responses[field.id];
                            if (value === undefined || value === null || value === "") return null;

                            return (
                              <div key={field.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-1 border-b border-border last:border-0">
                                <span className="text-sm font-medium text-muted-foreground min-w-[140px]">
                                  {field.label}:
                                </span>
                                <span className="text-sm text-foreground">
                                  {typeof value === "boolean"
                                    ? (value ? "Yes" : "No")
                                    : Array.isArray(value)
                                    ? value.join(", ")
                                    : String(value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Images Gallery — grouped by Before / During / After */}
          {wl.imageUrls && wl.imageUrls.length > 0 && (() => {
            const meta: PhotoMeta[] = wl.photoMetadata || [];
            const allPhotos = wl.imageUrls.map((url, i) => ({
              url,
              type: meta[i]?.type ?? "general",
              originalIndex: i,
            }));

            const zones = [
              { type: "before",  label: "Before Work",    icon: "fa-hourglass-start", border: "border-amber-300",  bg: "bg-amber-50 dark:bg-amber-950/20",  header: "bg-amber-500",  text: "text-amber-700 dark:text-amber-300" },
              { type: "general", label: "During Work",    icon: "fa-camera",          border: "border-blue-300",   bg: "bg-blue-50 dark:bg-blue-950/20",    header: "bg-blue-500",   text: "text-blue-700 dark:text-blue-300" },
              { type: "after",   label: "After Complete", icon: "fa-check-circle",    border: "border-green-300",  bg: "bg-green-50 dark:bg-green-950/20",  header: "bg-green-500",  text: "text-green-700 dark:text-green-300" },
            ] as const;

            const hasCategories = meta.length > 0;

            return (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Photos ({wl.imageUrls.length})
                </h4>

                {hasCategories ? (
                  <div className="space-y-4">
                    {zones.map(({ type, label, icon, border, bg, header }) => {
                      const zonePhotos = allPhotos.filter(p => p.type === type);
                      if (zonePhotos.length === 0) return null;
                      return (
                        <div key={type} className={`rounded-lg border-2 ${border} overflow-hidden`}>
                          <div className={`${header} px-4 py-2 flex items-center justify-between`}>
                            <span className="text-white text-sm font-semibold flex items-center gap-2">
                              <i className={`fas ${icon}`}></i>
                              {label}
                            </span>
                            <span className="text-white/80 text-xs">{zonePhotos.length} photo{zonePhotos.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div className={`${bg} p-3`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {zonePhotos.map((p) => (
                                <div
                                  key={p.originalIndex}
                                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-sm"
                                  onClick={() => onOpenLightbox(wl.imageUrls!, p.originalIndex, wl.photoMetadata ?? undefined)}
                                  data-testid={`detail-job-image-${p.originalIndex}`}
                                >
                                  <img
                                    src={p.url}
                                    alt={`${label} photo`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {allPhotos.map((p) => (
                      <div
                        key={p.originalIndex}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => onOpenLightbox(wl.imageUrls!, p.originalIndex, wl.photoMetadata ?? undefined)}
                        data-testid={`detail-job-image-${p.originalIndex}`}
                      >
                        <img
                          src={p.url}
                          alt={`Photo ${p.originalIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* PDF Reports */}
          {wl.pdfUrls && wl.pdfUrls.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Reports & Documents ({wl.pdfUrls.length})
              </h4>
              <div className="space-y-2">
                {wl.pdfUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                    onClick={() => handleDownloadPdf(url, index)}
                    data-testid={`detail-job-pdf-${index}`}
                  >
                    <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-file-pdf text-destructive"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">Report_{index + 1}.pdf</p>
                      <p className="text-xs text-muted-foreground">PDF Document</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadPdf(url, index); }}
                      className="text-primary hover:text-primary/80 transition-colors"
                      data-testid={`download-pdf-${index}`}
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {wl.additionalNotes && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Additional Notes</h4>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap" data-testid="detail-job-additional-notes">
                  {wl.additionalNotes}
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-border pt-4">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span data-testid="detail-job-created-at">
                <i className="fas fa-clock mr-1"></i>
                Created: {formatTimestamp(wl.createdAt)}
              </span>
              <span data-testid="detail-job-updated-at">
                <i className="fas fa-edit mr-1"></i>
                Last Updated: {formatTimestamp(wl.updatedAt)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button className="flex-1" onClick={() => onEdit(wl)} data-testid="button-edit-entry">
              <i className="fas fa-edit mr-2"></i>
              Edit Entry
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-primary text-primary hover:bg-primary/10"
              onClick={handleGenerateReport}
              disabled={generatingPdf}
              data-testid="button-generate-report"
            >
              {generatingPdf
                ? <><i className="fas fa-spinner fa-spin mr-2"></i>Generating…</>
                : <><i className="fas fa-file-pdf mr-2"></i>Download Report</>}
            </Button>
            <Button
              variant={showDeleteConfirm ? "destructive" : "outline"}
              onClick={handleDelete}
              disabled={deleteWorkLogMutation.isPending}
              className={showDeleteConfirm ? "" : "border-destructive text-destructive hover:bg-destructive/10"}
              data-testid="button-delete-entry"
            >
              {deleteWorkLogMutation.isPending ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Deleting...</>
              ) : showDeleteConfirm ? (
                <><i className="fas fa-exclamation-triangle mr-2"></i>Confirm Delete</>
              ) : (
                <><i className="fas fa-trash mr-2"></i>Delete</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
