'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  check_in_time?: string | null;
  check_out_time?: string | null;
}

type ViewFilter = 'today' | 'upcoming' | 'all' | 'mine';

interface TechDashboardProps {
  todaysJobs: WorkLog[];
  upcomingJobs: WorkLog[];
  allJobs: WorkLog[];
  currentUserId: string;
  userProfile?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  role: string;
}

export function TechDashboard({
  todaysJobs,
  upcomingJobs,
  allJobs,
  currentUserId,
  userProfile,
  role,
}: TechDashboardProps) {
  const [viewFilter, setViewFilter] = useState<ViewFilter>('today');

  const firstName = userProfile?.firstName || 'Technician';

  // Filter jobs based on selected view
  const getFilteredJobs = () => {
    switch (viewFilter) {
      case 'today':
        return todaysJobs;
      case 'upcoming':
        return upcomingJobs;
      case 'mine':
        return allJobs.filter(job => job.technician_user_id === currentUserId);
      case 'all':
      default:
        return allJobs;
    }
  };

  const filteredJobs = getFilteredJobs();

  // Count jobs assigned to current user
  const myJobsCount = allJobs.filter(job => job.technician_user_id === currentUserId).length;
  const myTodayJobs = todaysJobs.filter(job => job.technician_user_id === currentUserId).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'scheduled':
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'fa-check-circle';
      case 'in-progress':
        return 'fa-spinner';
      case 'scheduled':
      default:
        return 'fa-clock';
    }
  };

  const isAssignedToMe = (job: WorkLog) => job.technician_user_id === currentUserId;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Hello, {firstName}!
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-colors ${viewFilter === 'today' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setViewFilter('today')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-day text-primary"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{todaysJobs.length}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${viewFilter === 'mine' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setViewFilter('mine')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-check text-green-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{myJobsCount}</p>
                <p className="text-xs text-muted-foreground">Assigned to Me</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${viewFilter === 'upcoming' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setViewFilter('upcoming')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-week text-blue-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{upcomingJobs.length}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${viewFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setViewFilter('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-list text-gray-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{allJobs.length}</p>
                <p className="text-xs text-muted-foreground">All Work Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Label */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {viewFilter === 'today' && "Today's Work Orders"}
          {viewFilter === 'upcoming' && 'Upcoming Work Orders'}
          {viewFilter === 'mine' && 'My Assigned Work Orders'}
          {viewFilter === 'all' && 'All Work Orders'}
        </h3>
        <span className="text-sm text-muted-foreground">{filteredJobs.length} work orders</span>
      </div>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clipboard-list text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No work orders found</h3>
            <p className="text-muted-foreground">
              {viewFilter === 'today' && "You don't have any work orders scheduled for today."}
              {viewFilter === 'upcoming' && "No upcoming work orders this week."}
              {viewFilter === 'mine' && "No work orders are currently assigned to you."}
              {viewFilter === 'all' && "There are no work orders in the system."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const assignedToMe = isAssignedToMe(job);

            return (
              <Link key={job.id} href={`/tech/job/${job.id}`}>
                <Card className={`cursor-pointer hover:border-primary/50 transition-colors ${
                  assignedToMe ? 'border-l-4 border-l-primary' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          assignedToMe ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <i className={`fas fa-briefcase ${assignedToMe ? 'text-primary' : 'text-muted-foreground'}`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{job.customer_name}</p>
                            {assignedToMe && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Assigned to me
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {job.work_type} - {job.location_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {job.city}, {job.state}
                            <span className="mx-2">|</span>
                            <i className="fas fa-calendar mr-1"></i>
                            {job.service_date}
                          </p>
                          {job.assigned_tech && !assignedToMe && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <i className="fas fa-user mr-1"></i>
                              Assigned to: {job.assigned_tech.first_name} {job.assigned_tech.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusColor(job.status)}`}>
                          <i className={`fas ${getStatusIcon(job.status)} mr-1`}></i>
                          {job.status}
                        </span>
                        {assignedToMe && job.status === 'scheduled' && (
                          <Button size="sm" className="gap-1">
                            <i className="fas fa-play"></i>
                            Check In
                          </Button>
                        )}
                        {assignedToMe && job.status === 'in-progress' && (
                          <Button size="sm" variant="outline" className="gap-1">
                            <i className="fas fa-stop"></i>
                            Check Out
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
