import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { WorkLog } from "@shared/schema";

interface ScheduledJobCardProps {
  job: WorkLog & { technician: { firstName: string | null; lastName: string | null } };
  onEdit: () => void;
}

function getStatusConfig(status: string) {
  switch (status) {
    case "scheduled":
      return {
        color: "bg-orange-100 text-orange-700 border-orange-200",
        icon: "fa-clock",
        label: "Scheduled",
      };
    case "in-progress":
      return {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: "fa-spinner",
        label: "In Progress",
      };
    case "completed":
      return {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: "fa-check-circle",
        label: "Completed",
      };
    case "cancelled":
      return {
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: "fa-times-circle",
        label: "Cancelled",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: "fa-question-circle",
        label: status,
      };
  }
}

export function ScheduledJobCard({ job, onEdit }: ScheduledJobCardProps) {
  const { toast } = useToast();
  const statusConfig = getStatusConfig(job.status);

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/work-logs/${job.id}/start`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Job Started", description: "The job is now in progress." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to start job.", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/work-logs/${job.id}/complete`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Job Completed", description: "The job has been marked as completed." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to complete job.", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/work-logs/${job.id}/status`, { status: "cancelled" });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Job Cancelled", description: "The job has been cancelled." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to cancel job.", variant: "destructive" });
    },
  });

  const formatTime = (isoTime: string | null) => {
    if (!isoTime) return null;
    try {
      const date = new Date(isoTime);
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return isoTime;
    }
  };

  const technicianName = [job.technician.firstName, job.technician.lastName].filter(Boolean).join(" ") || "Unassigned";
  const scheduledTime = formatTime(job.scheduledStartTime);
  const scheduledEndTime = formatTime(job.scheduledEndTime);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                <i className={`fas ${statusConfig.icon} mr-1`}></i>
                {statusConfig.label}
              </Badge>
              {job.isRecurrenceInstance === "true" && (
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                  <i className="fas fa-repeat mr-1"></i>
                  Recurring
                </Badge>
              )}
            </div>

            <h4 className="font-semibold text-foreground truncate">{job.customerName}</h4>
            <p className="text-sm text-muted-foreground truncate">{job.workType}</p>

            <div className="mt-2 space-y-1">
              {scheduledTime && (
                <p className="text-sm text-muted-foreground">
                  <i className="fas fa-clock mr-2 w-4 text-center"></i>
                  {scheduledTime}{scheduledEndTime ? ` - ${scheduledEndTime}` : ""}
                </p>
              )}
              <p className="text-sm text-muted-foreground truncate">
                <i className="fas fa-map-marker-alt mr-2 w-4 text-center"></i>
                {job.locationName}, {job.city}
              </p>
              <p className="text-sm text-muted-foreground">
                <i className="fas fa-user mr-2 w-4 text-center"></i>
                {technicianName}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
          {job.status === "scheduled" && (
            <>
              <Button
                size="sm"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                <i className="fas fa-play mr-1"></i>
                Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                <i className="fas fa-times mr-1"></i>
                Cancel
              </Button>
            </>
          )}
          {job.status === "in-progress" && (
            <Button
              size="sm"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <i className="fas fa-check mr-1"></i>
              Complete
            </Button>
          )}
          {job.status === "cancelled" && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await apiRequest("PATCH", `/api/work-logs/${job.id}/status`, { status: "scheduled" });
                if (res.ok) {
                  toast({ title: "Job Rescheduled", description: "The job has been rescheduled." });
                  queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
                }
              }}
            >
              <i className="fas fa-redo mr-1"></i>
              Reschedule
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <i className="fas fa-edit mr-1"></i>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
