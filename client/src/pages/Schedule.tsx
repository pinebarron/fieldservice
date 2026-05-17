import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";
import { DayJobList } from "@/components/schedule/DayJobList";
import { ScheduleJobModal } from "@/components/schedule/ScheduleJobModal";
import { RecurringScheduleModal } from "@/components/schedule/RecurringScheduleModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkLog, RecurringSchedule } from "@shared/schema";

type JobWithTechnician = WorkLog & { technician: { firstName: string | null; lastName: string | null } };

export default function Schedule() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editJob, setEditJob] = useState<WorkLog | null>(null);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editRecurring, setEditRecurring] = useState<RecurringSchedule | null>(null);
  const [showRecurringList, setShowRecurringList] = useState(false);

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

  const { data: jobs = [], isLoading } = useQuery<JobWithTechnician[]>({
    queryKey: ["/api/schedule/jobs", monthKey],
    queryFn: async () => {
      const res = await fetch(`/api/schedule/jobs?month=${monthKey}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });

  const { data: recurringSchedules = [] } = useQuery<RecurringSchedule[]>({
    queryKey: ["/api/recurring-schedules"],
  });

  const { data: googleStatus } = useQuery<{
    configured: boolean;
    connected: boolean;
    calendarId: string | null;
  }>({
    queryKey: ["/api/google/status"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/recurring-schedules/generate-all");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Jobs Generated",
        description: `${data.generated} recurring jobs have been scheduled.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate recurring jobs.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recurring-schedules/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Recurring schedule removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-schedules"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete schedule.", variant: "destructive" });
    },
  });

  const syncToGoogleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/google/sync-all", { month: monthKey });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Synced to Google Calendar",
        description: `${data.synced} of ${data.total} jobs synced.`,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Could not sync jobs to Google Calendar.",
        variant: "destructive",
      });
    },
  });

  const handleNewJob = () => {
    setEditJob(null);
    setJobModalOpen(true);
  };

  const handleEditJob = (job: WorkLog) => {
    setEditJob(job);
    setJobModalOpen(true);
  };

  const handleNewRecurring = () => {
    setEditRecurring(null);
    setRecurringModalOpen(true);
  };

  const handleEditRecurring = (schedule: RecurringSchedule) => {
    setEditRecurring(schedule);
    setRecurringModalOpen(true);
    setShowRecurringList(false);
  };

  const formatFrequency = (schedule: RecurringSchedule) => {
    const interval = parseInt(schedule.interval) || 1;
    switch (schedule.frequency) {
      case "daily":
        return interval === 1 ? "Daily" : `Every ${interval} days`;
      case "weekly":
        const days = schedule.daysOfWeek?.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ");
        return interval === 1 ? `Weekly (${days})` : `Every ${interval} weeks (${days})`;
      case "monthly":
        const day = schedule.dayOfMonth === "last" ? "last day" : `day ${schedule.dayOfMonth}`;
        return interval === 1 ? `Monthly (${day})` : `Every ${interval} months (${day})`;
      default:
        return schedule.frequency;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Schedule</h2>
            <p className="text-muted-foreground mt-1">Manage scheduled and recurring jobs</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowRecurringList(true)}>
              <i className="fas fa-repeat mr-2"></i>
              Recurring ({recurringSchedules.length})
            </Button>
            <Button variant="outline" onClick={handleNewRecurring}>
              <i className="fas fa-plus mr-2"></i>
              New Recurring
            </Button>
            {recurringSchedules.length > 0 && (
              <Button
                variant="outline"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                <i className={`fas fa-sync-alt mr-2 ${generateMutation.isPending ? "fa-spin" : ""}`}></i>
                Generate Jobs
              </Button>
            )}
            {googleStatus?.connected && googleStatus?.calendarId && (
              <Button
                variant="outline"
                onClick={() => syncToGoogleMutation.mutate()}
                disabled={syncToGoogleMutation.isPending}
              >
                <i className={`fab fa-google mr-2 ${syncToGoogleMutation.isPending ? "fa-spin" : ""}`}></i>
                Sync to Calendar
              </Button>
            )}
          </div>
        </div>

        {/* Main content - Calendar + Day list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScheduleCalendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            jobs={jobs}
          />

          <DayJobList
            selectedDate={selectedDate}
            jobs={jobs}
            onEditJob={handleEditJob}
            onNewJob={handleNewJob}
          />
        </div>
      </main>

      {/* Job Modal */}
      <ScheduleJobModal
        isOpen={jobModalOpen}
        onClose={() => {
          setJobModalOpen(false);
          setEditJob(null);
        }}
        editJob={editJob}
        selectedDate={selectedDate}
      />

      {/* Recurring Schedule Modal */}
      <RecurringScheduleModal
        isOpen={recurringModalOpen}
        onClose={() => {
          setRecurringModalOpen(false);
          setEditRecurring(null);
        }}
        editSchedule={editRecurring}
      />

      {/* Recurring Schedules List Dialog */}
      <Dialog open={showRecurringList} onOpenChange={setShowRecurringList}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recurring Schedules</DialogTitle>
          </DialogHeader>

          {recurringSchedules.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-repeat text-2xl text-muted-foreground"></i>
              </div>
              <p className="text-muted-foreground mb-4">No recurring schedules yet</p>
              <Button onClick={handleNewRecurring}>
                <i className="fas fa-plus mr-2"></i>
                Create Recurring Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recurringSchedules.map(schedule => (
                <Card key={schedule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">{schedule.customerName}</h4>
                          <Badge variant={schedule.isActive === "true" ? "default" : "secondary"}>
                            {schedule.isActive === "true" ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{schedule.workType}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <i className="fas fa-clock mr-1"></i>
                          {schedule.scheduledTime} - {formatFrequency(schedule)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {schedule.locationName}, {schedule.city}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRecurring(schedule)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(schedule.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <i className="fas fa-trash text-destructive"></i>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
