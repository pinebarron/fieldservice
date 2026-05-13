import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type WorkLog, type PhotoMeta } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { pdf } from "@react-pdf/renderer";
import { WorkReportPDF } from "@/components/WorkReportPDF";

interface DetailJobModalProps {
  workLog: WorkLog;
  isOpen: boolean;
  onClose: () => void;
  onOpenLightbox: (images: string[], index: number, metadata?: PhotoMeta[]) => void;
  onRefresh: () => void;
  onEdit: (workLog: WorkLog) => void;
}

export function DetailJobModal({ workLog, isOpen, onClose, onOpenLightbox, onRefresh, onEdit }: DetailJobModalProps) {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { data: business } = useQuery<{ name: string }>({
    queryKey: ["/api/business"],
    enabled: isOpen,
  });

  const handleGenerateReport = async () => {
    setGeneratingPdf(true);
    try {
      const blob = await pdf(
        <WorkReportPDF workLog={workLog} businessName={business?.name} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = workLog.customerName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      link.download = `work_report_${safeName}_${workLog.serviceDate}.pdf`;
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
      toast({
        title: "Success",
        description: "Work log entry deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onRefresh();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete work log entry",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDuration = () => {
    if (workLog.startTime && workLog.endTime) {
      return `${workLog.startTime} - ${workLog.endTime}`;
    }
    return 'Not specified';
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteWorkLogMutation.mutate(workLog.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleDownloadPdf = (pdfUrl: string, index: number) => {
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `report_${index + 1}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-2">
            <span data-testid="detail-job-title">{workLog.customerName}</span>
            <div className="flex flex-wrap gap-3 text-sm font-normal">
              <span className="text-muted-foreground">
                <i className="fas fa-calendar mr-1"></i>
                {formatDate(workLog.serviceDate)}
              </span>
              <span className="text-muted-foreground">
                <i className="fas fa-user mr-1"></i>
                {(workLog as any).technician?.firstName} {(workLog as any).technician?.lastName}
              </span>
              <span className="status-badge px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                <i className="fas fa-check-circle mr-1"></i>
                {workLog.status === 'completed' ? 'Completed' : workLog.status}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Location</h4>
              <p className="text-foreground" data-testid="detail-job-location">
                {workLog.locationName}<br />
                {workLog.city}, {workLog.state} {workLog.zipCode}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Work Type</h4>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium" data-testid="detail-job-work-type">
                {workLog.workType}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Duration</h4>
              <p className="text-foreground" data-testid="detail-job-duration">{getDuration()}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status</h4>
              <p className="text-foreground" data-testid="detail-job-status">
                {workLog.status === 'completed' ? 'Work Completed Successfully' : workLog.status}
              </p>
            </div>
          </div>

          {/* Work Notes */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Work Performed</h4>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap" data-testid="detail-job-work-performed">
                {workLog.workPerformed}
              </p>
            </div>
          </div>

          {/* Images Gallery */}
          {workLog.imageUrls && workLog.imageUrls.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Images ({workLog.imageUrls.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {workLog.imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => onOpenLightbox(workLog.imageUrls!, index, workLog.photoMetadata ?? undefined)}
                    data-testid={`detail-job-image-${index}`}
                  >
                    <img
                      src={url}
                      alt={`Installation photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF Reports */}
          {workLog.pdfUrls && workLog.pdfUrls.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Reports & Documents ({workLog.pdfUrls.length})
              </h4>
              <div className="space-y-2">
                {workLog.pdfUrls.map((url, index) => (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPdf(url, index);
                      }}
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
          {workLog.additionalNotes && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Additional Notes</h4>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap" data-testid="detail-job-additional-notes">
                  {workLog.additionalNotes}
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-border pt-4">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span data-testid="detail-job-created-at">
                <i className="fas fa-clock mr-1"></i>
                Created: {formatTimestamp(workLog.createdAt)}
              </span>
              <span data-testid="detail-job-updated-at">
                <i className="fas fa-edit mr-1"></i>
                Last Updated: {formatTimestamp(workLog.updatedAt)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              className="flex-1" 
              onClick={() => onEdit(workLog)}
              data-testid="button-edit-entry"
            >
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
              {generatingPdf ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Generating…</>
              ) : (
                <><i className="fas fa-file-pdf mr-2"></i>Download Report</>
              )}
            </Button>
            <Button
              variant={showDeleteConfirm ? "destructive" : "outline"}
              onClick={handleDelete}
              disabled={deleteWorkLogMutation.isPending}
              className={showDeleteConfirm ? "" : "border-destructive text-destructive hover:bg-destructive/10"}
              data-testid="button-delete-entry"
            >
              {deleteWorkLogMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Deleting...
                </>
              ) : showDeleteConfirm ? (
                <>
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Confirm Delete
                </>
              ) : (
                <>
                  <i className="fas fa-trash mr-2"></i>
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
