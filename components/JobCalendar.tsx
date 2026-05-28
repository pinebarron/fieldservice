'use client';

import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';

// Base fields required for calendar rendering
interface CalendarWorkLog {
  id: string;
  customer_name: string;
  work_type: string;
  location_name: string;
  city: string;
  state: string;
  service_date: string;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  status: string;
}

interface JobCalendarProps<T extends CalendarWorkLog> {
  jobs: T[] | null;
  onJobClick: (job: T) => void;
  onDateClick?: (date: Date) => void;
}

// Get color based on job status
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#22c55e'; // green
    case 'in-progress':
      return '#3b82f6'; // blue
    case 'scheduled':
      return '#f59e0b'; // amber
    case 'cancelled':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

// Get lighter background color for status
function getStatusBgColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#dcfce7'; // green-100
    case 'in-progress':
      return '#dbeafe'; // blue-100
    case 'scheduled':
      return '#fef3c7'; // amber-100
    case 'cancelled':
      return '#fee2e2'; // red-100
    default:
      return '#f3f4f6'; // gray-100
  }
}

export function JobCalendar<T extends CalendarWorkLog>({ jobs, onJobClick, onDateClick }: JobCalendarProps<T>) {
  const calendarRef = useRef<FullCalendar>(null);

  // Convert jobs to FullCalendar events
  const events = (jobs || []).map((job) => {
    // If we have scheduled times, use them; otherwise just use the date
    let start = job.service_date;
    let end = job.service_date;
    let allDay = true;

    if (job.scheduled_start_time) {
      start = `${job.service_date}T${job.scheduled_start_time}`;
      allDay = false;
    }
    if (job.scheduled_end_time) {
      end = `${job.service_date}T${job.scheduled_end_time}`;
    }

    return {
      id: job.id,
      title: `${job.customer_name} - ${job.work_type}`,
      start,
      end: allDay ? undefined : end,
      allDay,
      backgroundColor: getStatusBgColor(job.status),
      borderColor: getStatusColor(job.status),
      textColor: '#1f2937', // gray-800
      extendedProps: {
        job,
        status: job.status,
        location: `${job.city}, ${job.state}`,
      },
    };
  });

  const handleEventClick = (info: EventClickArg) => {
    const job = info.event.extendedProps.job as T;
    onJobClick(job);
  };

  const handleDateClick = (info: { date: Date }) => {
    if (onDateClick) {
      onDateClick(info.date);
    }
  };

  return (
    <div className="job-calendar">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        height="auto"
        eventDisplay="block"
        eventContent={(eventInfo) => {
          const status = eventInfo.event.extendedProps.status;
          const location = eventInfo.event.extendedProps.location;

          return (
            <div className="p-1 overflow-hidden cursor-pointer">
              <div className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <span className="text-xs font-medium truncate">
                  {eventInfo.event.title}
                </span>
              </div>
              {!eventInfo.event.allDay && (
                <div className="text-[10px] text-muted-foreground truncate pl-3">
                  {eventInfo.timeText}
                </div>
              )}
            </div>
          );
        }}
        moreLinkContent={(args) => (
          <span className="text-xs text-primary font-medium">
            +{args.num} more
          </span>
        )}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
        }}
      />

      {/* Custom styles for FullCalendar */}
      <style jsx global>{`
        .job-calendar .fc {
          font-family: inherit;
        }

        .job-calendar .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 600;
        }

        .job-calendar .fc-button {
          background-color: hsl(var(--background)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
          font-size: 0.875rem !important;
          padding: 0.375rem 0.75rem !important;
          font-weight: 500 !important;
        }

        .job-calendar .fc-button:hover {
          background-color: hsl(var(--muted)) !important;
        }

        .job-calendar .fc-button-active {
          background-color: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }

        .job-calendar .fc-today-button {
          background-color: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }

        .job-calendar .fc-today-button:disabled {
          opacity: 0.5;
        }

        .job-calendar .fc-day-today {
          background-color: hsl(var(--primary) / 0.1) !important;
        }

        .job-calendar .fc-daygrid-day-number,
        .job-calendar .fc-col-header-cell-cushion {
          color: hsl(var(--foreground));
          font-weight: 500;
        }

        .job-calendar .fc-event {
          border-radius: 4px !important;
          border-width: 2px !important;
          border-left-width: 3px !important;
          margin-bottom: 2px !important;
        }

        .job-calendar .fc-event:hover {
          opacity: 0.9;
        }

        .job-calendar .fc-daygrid-event {
          white-space: normal !important;
        }

        .job-calendar .fc-timegrid-slot {
          height: 3rem !important;
        }

        .job-calendar .fc-timegrid-slot-label {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
        }

        .job-calendar .fc-scrollgrid {
          border-color: hsl(var(--border)) !important;
        }

        .job-calendar .fc-scrollgrid td,
        .job-calendar .fc-scrollgrid th {
          border-color: hsl(var(--border)) !important;
        }

        .job-calendar .fc-more-link {
          color: hsl(var(--primary)) !important;
        }

        .job-calendar .fc-popover {
          background: hsl(var(--background)) !important;
          border-color: hsl(var(--border)) !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
        }

        .job-calendar .fc-popover-header {
          background: hsl(var(--muted)) !important;
        }
      `}</style>
    </div>
  );
}
