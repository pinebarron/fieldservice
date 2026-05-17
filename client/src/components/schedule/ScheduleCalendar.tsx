import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkLog } from "@shared/schema";

interface ScheduleCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  jobs: (WorkLog & { technician: { firstName: string | null; lastName: string | null } })[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getStatusColor(status: string): string {
  switch (status) {
    case "scheduled": return "bg-orange-500";
    case "in-progress": return "bg-blue-500";
    case "completed": return "bg-green-500";
    case "cancelled": return "bg-gray-400";
    default: return "bg-gray-400";
  }
}

export function ScheduleCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onDateSelect,
  jobs,
}: ScheduleCalendarProps) {
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Add days from next month to complete the grid (6 rows)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  const jobsByDate = useMemo(() => {
    const map = new Map<string, typeof jobs>();
    jobs.forEach(job => {
      const dateKey = job.serviceDate;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(job);
    });
    return map;
  }, [jobs]);

  const handlePrevMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
    onDateSelect(today);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const dateKey = formatDateKey(date);
          const dayJobs = jobsByDate.get(dateKey) || [];
          const jobCount = dayJobs.length;

          // Group jobs by status
          const statusCounts = dayJobs.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return (
            <button
              key={idx}
              onClick={() => onDateSelect(date)}
              className={cn(
                "relative aspect-square p-1 flex flex-col items-center justify-start rounded-lg transition-colors",
                "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                !isCurrentMonth && "text-muted-foreground/50",
                isCurrentMonth && "text-foreground",
                isToday(date) && "bg-accent",
                isSelected(date) && "ring-2 ring-primary bg-primary/10"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                isToday(date) && "text-accent-foreground"
              )}>
                {date.getDate()}
              </span>

              {/* Job indicators */}
              {jobCount > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div
                      key={status}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        getStatusColor(status)
                      )}
                      title={`${count} ${status}`}
                    />
                  ))}
                </div>
              )}

              {/* Job count badge for many jobs */}
              {jobCount > 3 && (
                <span className="absolute bottom-0.5 right-0.5 text-[10px] font-bold text-muted-foreground">
                  {jobCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
          <span className="text-xs text-muted-foreground">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-xs text-muted-foreground">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          <span className="text-xs text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
          <span className="text-xs text-muted-foreground">Cancelled</span>
        </div>
      </div>
    </div>
  );
}
