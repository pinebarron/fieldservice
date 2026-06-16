'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WorkLog {
  id: string;
  customer_name: string;
  work_type: string;
  location_name: string;
  city: string;
  state: string;
  zip_code: string;
  service_date: string;
  status: string;
  technician_user_id: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  property_id?: string | null;
  created_at?: string | null;
}

interface Estimate {
  id: string;
  title: string;
  customer_name: string;
  status: string;
  created_at?: string | null;
  property_id?: string | null;
}

interface Property {
  id: string;
  property_name: string;
  property_type: string;
  city: string;
  state: string;
  zip_code: string;
}

interface FormSubmission {
  id: string;
  work_log_id: string;
  template_id: string;
  responses: Record<string, unknown>;
  submitted_at?: string | null;
  form_templates?: {
    id: string;
    name: string;
    schema: { fields: Array<{ id: string; type: string; required?: boolean }> };
  } | null;
}

interface FormTemplate {
  id: string;
  name: string;
  work_type?: string | null;
  schema: { fields: Array<{ id: string; type: string; required?: boolean }> };
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  users?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
}

interface ReportsClientProps {
  workLogs: WorkLog[];
  estimates: Estimate[];
  properties: Property[];
  formSubmissions: FormSubmission[];
  formTemplates: FormTemplate[];
  teamMembers: TeamMember[];
}

type ReportCategory = 'operations' | 'quality' | 'sales' | 'geographic';
type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';

export function ReportsClient({
  workLogs,
  estimates,
  properties,
  formSubmissions,
  formTemplates,
  teamMembers,
}: ReportsClientProps) {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('operations');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Filter data by date range
  const filteredWorkLogs = useMemo(() => {
    if (dateRange === 'all') return workLogs;

    const now = new Date();
    const cutoff = new Date();

    switch (dateRange) {
      case '7d': cutoff.setDate(now.getDate() - 7); break;
      case '30d': cutoff.setDate(now.getDate() - 30); break;
      case '90d': cutoff.setDate(now.getDate() - 90); break;
      case '1y': cutoff.setFullYear(now.getFullYear() - 1); break;
    }

    return workLogs.filter(log => new Date(log.service_date) >= cutoff);
  }, [workLogs, dateRange]);

  const filteredEstimates = useMemo(() => {
    if (dateRange === 'all') return estimates;

    const now = new Date();
    const cutoff = new Date();

    switch (dateRange) {
      case '7d': cutoff.setDate(now.getDate() - 7); break;
      case '30d': cutoff.setDate(now.getDate() - 30); break;
      case '90d': cutoff.setDate(now.getDate() - 90); break;
      case '1y': cutoff.setFullYear(now.getFullYear() - 1); break;
    }

    return estimates.filter(est => est.created_at && new Date(est.created_at) >= cutoff);
  }, [estimates, dateRange]);

  const categories = [
    { id: 'operations' as const, label: 'Operations', icon: 'fa-cogs' },
    { id: 'quality' as const, label: 'Quality', icon: 'fa-clipboard-check' },
    { id: 'sales' as const, label: 'Sales', icon: 'fa-dollar-sign' },
    { id: 'geographic' as const, label: 'Geographic', icon: 'fa-map-marked-alt' },
  ];

  const dateRanges = [
    { id: '7d' as const, label: '7 Days' },
    { id: '30d' as const, label: '30 Days' },
    { id: '90d' as const, label: '90 Days' },
    { id: '1y' as const, label: '1 Year' },
    { id: 'all' as const, label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Business insights and performance metrics
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {dateRanges.map(range => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === range.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <i className={`fas ${cat.icon}`}></i>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {activeCategory === 'operations' && (
        <OperationsReports
          workLogs={filteredWorkLogs}
          teamMembers={teamMembers}
        />
      )}

      {activeCategory === 'quality' && (
        <QualityReports
          workLogs={filteredWorkLogs}
          formSubmissions={formSubmissions}
          formTemplates={formTemplates}
        />
      )}

      {activeCategory === 'sales' && (
        <SalesReports
          workLogs={filteredWorkLogs}
          estimates={filteredEstimates}
          properties={properties}
        />
      )}

      {activeCategory === 'geographic' && (
        <GeographicReports
          workLogs={filteredWorkLogs}
          properties={properties}
        />
      )}
    </div>
  );
}

// ==================== OPERATIONS REPORTS ====================

function OperationsReports({
  workLogs,
  teamMembers,
}: {
  workLogs: WorkLog[];
  teamMembers: TeamMember[];
}) {
  // Work Order Status Summary
  const jobStats = useMemo(() => {
    const total = workLogs.length;
    const completed = workLogs.filter(j => j.status === 'completed').length;
    const inProgress = workLogs.filter(j => j.status === 'in-progress').length;
    const finalReview = workLogs.filter(j => j.status === 'final-review').length;
    const quotePending = workLogs.filter(j => j.status === 'quote-pending').length;
    const scheduled = workLogs.filter(j => j.status === 'scheduled').length;
    const readyForScheduling = workLogs.filter(j => j.status === 'ready-for-scheduling').length;
    const cannotComplete = workLogs.filter(j => j.status === 'cannot-complete').length;

    return { total, completed, inProgress, finalReview, quotePending, scheduled, readyForScheduling, cannotComplete };
  }, [workLogs]);

  // Technician Productivity
  const techStats = useMemo(() => {
    const techMap = new Map<string, {
      name: string;
      totalJobs: number;
      completedJobs: number;
      totalMinutes: number;
      jobsWithTime: number;
    }>();

    // Initialize with team members
    teamMembers.forEach(member => {
      if (member.users) {
        const name = member.users.first_name
          ? `${member.users.first_name} ${member.users.last_name || ''}`
          : member.users.email || 'Unknown';
        techMap.set(member.user_id, {
          name,
          totalJobs: 0,
          completedJobs: 0,
          totalMinutes: 0,
          jobsWithTime: 0,
        });
      }
    });

    workLogs.forEach(job => {
      const tech = techMap.get(job.technician_user_id);
      if (tech) {
        tech.totalJobs++;
        if (job.status === 'completed') {
          tech.completedJobs++;
        }

        // Calculate duration if check-in/out available
        if (job.check_in_time && job.check_out_time) {
          const checkIn = new Date(job.check_in_time);
          const checkOut = new Date(job.check_out_time);
          const minutes = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60);
          if (minutes > 0 && minutes < 720) { // Sanity check: less than 12 hours
            tech.totalMinutes += minutes;
            tech.jobsWithTime++;
          }
        }
      }
    });

    return Array.from(techMap.values())
      .filter(t => t.totalJobs > 0)
      .sort((a, b) => b.completedJobs - a.completedJobs);
  }, [workLogs, teamMembers]);

  // Average Time to Complete by Work Type
  const timeByWorkType = useMemo(() => {
    const typeMap = new Map<string, { totalMinutes: number; count: number }>();

    workLogs.forEach(job => {
      if (job.status === 'completed' && job.check_in_time && job.check_out_time) {
        const checkIn = new Date(job.check_in_time);
        const checkOut = new Date(job.check_out_time);
        const minutes = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60);

        if (minutes > 0 && minutes < 720) {
          const existing = typeMap.get(job.work_type) || { totalMinutes: 0, count: 0 };
          existing.totalMinutes += minutes;
          existing.count++;
          typeMap.set(job.work_type, existing);
        }
      }
    });

    return Array.from(typeMap.entries())
      .map(([type, data]) => ({
        type,
        avgMinutes: Math.round(data.totalMinutes / data.count),
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [workLogs]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Job Status Dashboard */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-tasks text-primary"></i>
            Work Order Status
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{jobStats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{jobStats.completed}</p>
              <p className="text-sm text-green-700">Completed</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{jobStats.inProgress}</p>
              <p className="text-sm text-blue-700">In Progress</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-cyan-600">{jobStats.scheduled}</p>
              <p className="text-sm text-cyan-700">Scheduled</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-600">{jobStats.readyForScheduling}</p>
              <p className="text-xs text-gray-600">Ready for Scheduling</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-orange-600">{jobStats.quotePending}</p>
              <p className="text-xs text-orange-600">Quote Pending</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-purple-600">{jobStats.finalReview}</p>
              <p className="text-xs text-purple-600">Final Review</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-red-600">{jobStats.cannotComplete}</p>
              <p className="text-xs text-red-600">Cannot Complete</p>
            </div>
          </div>

          {jobStats.total > 0 && (
            <div className="mt-4">
              <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="bg-green-500 h-full"
                  style={{ width: `${(jobStats.completed / jobStats.total) * 100}%` }}
                />
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${(jobStats.inProgress / jobStats.total) * 100}%` }}
                />
                <div
                  className="bg-purple-500 h-full"
                  style={{ width: `${(jobStats.finalReview / jobStats.total) * 100}%` }}
                />
                <div
                  className="bg-orange-500 h-full"
                  style={{ width: `${(jobStats.quotePending / jobStats.total) * 100}%` }}
                />
                <div
                  className="bg-cyan-500 h-full"
                  style={{ width: `${(jobStats.scheduled / jobStats.total) * 100}%` }}
                />
                <div
                  className="bg-gray-400 h-full"
                  style={{ width: `${(jobStats.readyForScheduling / jobStats.total) * 100}%` }}
                />
                <div
                  className="bg-red-500 h-full"
                  style={{ width: `${(jobStats.cannotComplete / jobStats.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {jobStats.total > 0 ? Math.round((jobStats.completed / jobStats.total) * 100) : 0}% completion rate
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technician Productivity */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-user-hard-hat text-primary"></i>
            Technician Productivity
          </h3>

          {techStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">No technician data available for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-sm">Technician</th>
                    <th className="pb-3 font-medium text-sm text-center">Total</th>
                    <th className="pb-3 font-medium text-sm text-center">Completed</th>
                    <th className="pb-3 font-medium text-sm text-center">Completion Rate</th>
                    <th className="pb-3 font-medium text-sm text-center">Avg Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {techStats.map((tech, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 font-medium">{tech.name}</td>
                      <td className="py-3 text-center">{tech.totalJobs}</td>
                      <td className="py-3 text-center text-green-600">{tech.completedJobs}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tech.totalJobs > 0 && (tech.completedJobs / tech.totalJobs) >= 0.9
                            ? 'bg-green-100 text-green-700'
                            : tech.totalJobs > 0 && (tech.completedJobs / tech.totalJobs) >= 0.7
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tech.totalJobs > 0 ? Math.round((tech.completedJobs / tech.totalJobs) * 100) : 0}%
                        </span>
                      </td>
                      <td className="py-3 text-center text-muted-foreground">
                        {tech.jobsWithTime > 0
                          ? formatDuration(tech.totalMinutes / tech.jobsWithTime)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Average Time to Complete */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-clock text-primary"></i>
            Average Time to Complete by Work Type
          </h3>

          {timeByWorkType.length === 0 ? (
            <p className="text-muted-foreground text-sm">No completed work orders with time tracking data.</p>
          ) : (
            <div className="space-y-3">
              {timeByWorkType.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 truncate font-medium text-sm">{item.type}</div>
                  <div className="flex-1">
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.min((item.avgMinutes / Math.max(...timeByWorkType.map(t => t.avgMinutes))) * 100, 100)}%`,
                          minWidth: '60px',
                        }}
                      >
                        <span className="text-xs font-medium text-primary-foreground">
                          {formatDuration(item.avgMinutes)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-muted-foreground">
                    {item.count} work orders
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== QUALITY REPORTS ====================

function QualityReports({
  workLogs,
  formSubmissions,
  formTemplates,
}: {
  workLogs: WorkLog[];
  formSubmissions: FormSubmission[];
  formTemplates: FormTemplate[];
}) {
  // Form Completion Rate
  const formStats = useMemo(() => {
    const completedJobs = workLogs.filter(j => j.status === 'completed');
    const jobsWithForms = new Set(formSubmissions.map(s => s.work_log_id));
    const jobsWithFormsCount = completedJobs.filter(j => jobsWithForms.has(j.id)).length;

    // Per-template stats
    const templateStats = formTemplates.map(template => {
      const submissions = formSubmissions.filter(s => s.template_id === template.id);
      const requiredFields = template.schema?.fields?.filter(f => f.required) || [];

      let fullyCompleted = 0;
      let partiallyCompleted = 0;

      submissions.forEach(sub => {
        const responses = sub.responses || {};
        const filledRequired = requiredFields.filter(f => {
          const val = responses[f.id];
          return val !== undefined && val !== null && val !== '';
        }).length;

        if (filledRequired === requiredFields.length) {
          fullyCompleted++;
        } else if (filledRequired > 0) {
          partiallyCompleted++;
        }
      });

      return {
        name: template.name,
        total: submissions.length,
        fullyCompleted,
        partiallyCompleted,
        requiredFields: requiredFields.length,
      };
    }).filter(t => t.total > 0);

    return {
      totalCompletedJobs: completedJobs.length,
      jobsWithForms: jobsWithFormsCount,
      formCompletionRate: completedJobs.length > 0
        ? Math.round((jobsWithFormsCount / completedJobs.length) * 100)
        : 0,
      templateStats,
    };
  }, [workLogs, formSubmissions, formTemplates]);

  return (
    <div className="space-y-6">
      {/* Form Completion Overview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-clipboard-check text-primary"></i>
            Form Completion Rate
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{formStats.totalCompletedJobs}</p>
              <p className="text-sm text-muted-foreground">Completed Work Orders</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{formStats.jobsWithForms}</p>
              <p className="text-sm text-green-700">With Form Data</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-primary">{formStats.formCompletionRate}%</p>
              <p className="text-sm text-primary/80">Completion Rate</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${formStats.formCompletionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-Template Stats */}
      {formStats.templateStats.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-file-alt text-primary"></i>
              Completion by Form Type
            </h3>

            <div className="space-y-4">
              {formStats.templateStats.map((template, i) => {
                const completionRate = template.total > 0
                  ? Math.round((template.fullyCompleted / template.total) * 100)
                  : 0;

                return (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {template.total} submissions
                      </span>
                    </div>

                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <div className="h-full flex">
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${(template.fullyCompleted / template.total) * 100}%` }}
                        />
                        <div
                          className="bg-yellow-500 h-full"
                          style={{ width: `${(template.partiallyCompleted / template.total) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs">
                      <span className="text-green-600">
                        <i className="fas fa-check-circle mr-1"></i>
                        {template.fullyCompleted} complete
                      </span>
                      <span className="text-yellow-600">
                        <i className="fas fa-exclamation-circle mr-1"></i>
                        {template.partiallyCompleted} partial
                      </span>
                      <span className="text-muted-foreground ml-auto">
                        {template.requiredFields} required fields
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== SALES REPORTS ====================

function SalesReports({
  workLogs,
  estimates,
  properties,
}: {
  workLogs: WorkLog[];
  estimates: Estimate[];
  properties: Property[];
}) {
  // Estimate to Job Conversion
  const conversionStats = useMemo(() => {
    const total = estimates.length;
    const accepted = estimates.filter(e => e.status === 'accepted').length;
    const rejected = estimates.filter(e => e.status === 'rejected').length;
    const pending = estimates.filter(e => e.status === 'sent' || e.status === 'draft').length;

    // Check which accepted estimates have corresponding jobs
    const acceptedEstimates = estimates.filter(e => e.status === 'accepted');
    const estimatePropertyIds = new Set(acceptedEstimates.map(e => e.property_id).filter(Boolean));
    const jobPropertyIds = new Set(workLogs.map(j => j.property_id).filter(Boolean));

    // Rough conversion: how many accepted estimates have jobs for the same property
    let convertedToJobs = 0;
    acceptedEstimates.forEach(est => {
      if (est.property_id && jobPropertyIds.has(est.property_id)) {
        convertedToJobs++;
      }
    });

    return {
      total,
      accepted,
      rejected,
      pending,
      convertedToJobs,
      acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      conversionRate: accepted > 0 ? Math.round((convertedToJobs / accepted) * 100) : 0,
    };
  }, [estimates, workLogs]);

  // Estimate status breakdown
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    estimates.forEach(est => {
      counts[est.status] = (counts[est.status] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [estimates]);

  return (
    <div className="space-y-6">
      {/* Estimate Pipeline */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-funnel-dollar text-primary"></i>
            Estimate-to-Job Conversion
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{conversionStats.total}</p>
              <p className="text-sm text-muted-foreground">Total Estimates</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{conversionStats.accepted}</p>
              <p className="text-sm text-green-700">Accepted</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{conversionStats.acceptanceRate}%</p>
              <p className="text-sm text-blue-700">Acceptance Rate</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{conversionStats.convertedToJobs}</p>
              <p className="text-sm text-purple-700">Converted to Work Orders</p>
            </div>
          </div>

          {/* Funnel visualization */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-right text-muted-foreground">Estimates</div>
              <div className="flex-1 h-8 bg-blue-100 rounded flex items-center justify-center">
                <span className="font-medium text-blue-700">{conversionStats.total}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-right text-muted-foreground">Accepted</div>
              <div
                className="h-8 bg-green-100 rounded flex items-center justify-center"
                style={{ width: `${conversionStats.total > 0 ? Math.max((conversionStats.accepted / conversionStats.total) * 100, 10) : 10}%` }}
              >
                <span className="font-medium text-green-700">{conversionStats.accepted}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-right text-muted-foreground">Work Orders</div>
              <div
                className="h-8 bg-purple-100 rounded flex items-center justify-center"
                style={{ width: `${conversionStats.total > 0 ? Math.max((conversionStats.convertedToJobs / conversionStats.total) * 100, 10) : 10}%` }}
              >
                <span className="font-medium text-purple-700">{conversionStats.convertedToJobs}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-chart-pie text-primary"></i>
            Estimate Status Breakdown
          </h3>

          {statusBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm">No estimates in this period.</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(([status, count]) => {
                const percentage = estimates.length > 0 ? (count / estimates.length) * 100 : 0;
                const colorMap: Record<string, string> = {
                  draft: 'bg-gray-400',
                  sent: 'bg-blue-400',
                  accepted: 'bg-green-400',
                  rejected: 'bg-red-400',
                  expired: 'bg-yellow-400',
                };

                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium capitalize">{status}</div>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorMap[status] || 'bg-primary'} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm">
                      {count} ({Math.round(percentage)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== GEOGRAPHIC REPORTS ====================

function GeographicReports({
  workLogs,
  properties,
}: {
  workLogs: WorkLog[];
  properties: Property[];
}) {
  // Jobs by location
  const locationStats = useMemo(() => {
    const cityMap = new Map<string, { count: number; completed: number; city: string; state: string }>();

    workLogs.forEach(job => {
      const key = `${job.city}, ${job.state}`;
      const existing = cityMap.get(key) || { count: 0, completed: 0, city: job.city, state: job.state };
      existing.count++;
      if (job.status === 'completed') existing.completed++;
      cityMap.set(key, existing);
    });

    return Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 locations
  }, [workLogs]);

  // Jobs by zip code
  const zipStats = useMemo(() => {
    const zipMap = new Map<string, number>();
    workLogs.forEach(job => {
      zipMap.set(job.zip_code, (zipMap.get(job.zip_code) || 0) + 1);
    });
    return Array.from(zipMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [workLogs]);

  // Property type distribution
  const propertyTypeStats = useMemo(() => {
    const residential = properties.filter(p => p.property_type === 'residential').length;
    const commercial = properties.filter(p => p.property_type === 'commercial').length;
    return { residential, commercial, total: properties.length };
  }, [properties]);

  const maxCount = locationStats.length > 0 ? Math.max(...locationStats.map(l => l.count)) : 1;

  return (
    <div className="space-y-6">
      {/* Geographic Heat Map */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-map-marked-alt text-primary"></i>
            Work Order Density by Location
          </h3>

          {locationStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">No work order location data available.</p>
          ) : (
            <div className="space-y-2">
              {locationStats.map((loc, i) => {
                const intensity = loc.count / maxCount;
                const hue = 200 - (intensity * 150); // Blue to red gradient

                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-40 text-sm font-medium truncate">{loc.city}, {loc.state}</div>
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all"
                        style={{
                          width: `${(loc.count / maxCount) * 100}%`,
                          backgroundColor: `hsl(${hue}, 70%, 50%)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-xs font-medium text-white drop-shadow">
                          {loc.count} jobs
                        </span>
                        <span className="text-xs text-white/80 drop-shadow">
                          {loc.completed} completed
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Color intensity indicates job volume (blue = low, red = high)
          </p>
        </CardContent>
      </Card>

      {/* Top Zip Codes */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-map-pin text-primary"></i>
            Top Service Zip Codes
          </h3>

          {zipStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">No zip code data available.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {zipStats.map(([zip, count], i) => (
                <div
                  key={zip}
                  className={`p-3 rounded-lg text-center ${
                    i === 0 ? 'bg-primary text-primary-foreground' :
                    i < 3 ? 'bg-primary/20 text-primary' :
                    'bg-muted'
                  }`}
                >
                  <p className="font-mono font-bold">{zip}</p>
                  <p className="text-xs opacity-80">{count} jobs</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Type Distribution */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-building text-primary"></i>
            Property Type Distribution
          </h3>

          <div className="flex gap-6">
            <div className="flex-1">
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                {propertyTypeStats.total > 0 && (
                  <>
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(propertyTypeStats.residential / propertyTypeStats.total) * 100}%` }}
                    />
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${(propertyTypeStats.commercial / propertyTypeStats.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm">Residential: {propertyTypeStats.residential}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm">Commercial: {propertyTypeStats.commercial}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
