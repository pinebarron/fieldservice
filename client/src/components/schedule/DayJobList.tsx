import { useMemo } from "react";
import { ScheduledJobCard } from "./ScheduledJobCard";
import type { WorkLog } from "@shared/schema";

interface DayJobListProps {
  selectedDate: Date;
  jobs: (WorkLog & { technician: { firstName: string | null; lastName: string | null } })[];
  onEditJob: (job: WorkLog) => void;
  onNewJob: () => void;
}

const STATUS_ORDER: Record<string, number> = {
  "in-progress": 0,
  "scheduled": 1,
  "completed": 2,
  "cancelled": 3,
};

export function DayJobList({ selectedDate, jobs, onEditJob, onNewJob }: DayJobListProps) {
  const dayJobs = useMemo(() => {
    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return jobs
      .filter(job => job.serviceDate === dateKey)
      .sort((a, b) => {
        // Sort by status first, then by scheduled time
        const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
        if (statusDiff !== 0) return statusDiff;

        // Sort by scheduled start time
        if (a.scheduledStartTime && b.scheduledStartTime) {
          return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
        }
        return 0;
      });
  }, [selectedDate, jobs]);

  const groupedJobs = useMemo(() => {
    const groups: Record<string, typeof dayJobs> = {
      "in-progress": [],
      "scheduled": [],
      "completed": [],
      "cancelled": [],
    };

    dayJobs.forEach(job => {
      if (groups[job.status]) {
        groups[job.status].push(job);
      }
    });

    return groups;
  }, [dayJobs]);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {isToday() ? "Today" : formatDate(selectedDate)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {dayJobs.length} job{dayJobs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onNewJob}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <i className="fas fa-plus"></i>
          New Job
        </button>
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {dayJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-calendar-day text-2xl text-muted-foreground"></i>
            </div>
            <h4 className="font-medium text-foreground mb-1">No jobs scheduled</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Click "New Job" to schedule work for this day.
            </p>
          </div>
        ) : (
          <>
            {/* In Progress */}
            {groupedJobs["in-progress"].length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  In Progress ({groupedJobs["in-progress"].length})
                </h4>
                <div className="space-y-2">
                  {groupedJobs["in-progress"].map(job => (
                    <ScheduledJobCard
                      key={job.id}
                      job={job}
                      onEdit={() => onEditJob(job)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled */}
            {groupedJobs["scheduled"].length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-2">
                  <i className="fas fa-clock"></i>
                  Scheduled ({groupedJobs["scheduled"].length})
                </h4>
                <div className="space-y-2">
                  {groupedJobs["scheduled"].map(job => (
                    <ScheduledJobCard
                      key={job.id}
                      job={job}
                      onEdit={() => onEditJob(job)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {groupedJobs["completed"].length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                  <i className="fas fa-check-circle"></i>
                  Completed ({groupedJobs["completed"].length})
                </h4>
                <div className="space-y-2">
                  {groupedJobs["completed"].map(job => (
                    <ScheduledJobCard
                      key={job.id}
                      job={job}
                      onEdit={() => onEditJob(job)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled */}
            {groupedJobs["cancelled"].length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <i className="fas fa-times-circle"></i>
                  Cancelled ({groupedJobs["cancelled"].length})
                </h4>
                <div className="space-y-2">
                  {groupedJobs["cancelled"].map(job => (
                    <ScheduledJobCard
                      key={job.id}
                      job={job}
                      onEdit={() => onEditJob(job)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
