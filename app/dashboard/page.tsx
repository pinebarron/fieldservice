import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Stats } from '@/lib/types';
import { DashboardMap } from './DashboardMap';

export default async function DashboardPage() {
  const { user, userProfile, business, userId } = await getUserAndBusiness();

  if (!user) {
    redirect('/login');
  }

  if (!business) {
    redirect('/onboarding');
  }

  const adminClient = createAdminClient();

  // Fetch work logs and in-progress jobs
  const [workLogsResult, inProgressResult] = await Promise.all([
    adminClient
      .from('work_logs')
      .select('*')
      .eq('business_id', business.id)
      .order('service_date', { ascending: false })
      .limit(10),
    adminClient
      .from('work_logs')
      .select('id, customer_name, work_type, location_name, city, state, zip_code, service_date, status')
      .eq('business_id', business.id)
      .eq('status', 'in-progress')
      .order('service_date', { ascending: false })
  ]);

  const workLogs = workLogsResult.data;
  const inProgressJobs = inProgressResult.data || [];

  // Calculate stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { count: totalJobs } = await adminClient
    .from('work_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id);

  const { count: weekJobs } = await adminClient
    .from('work_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('service_date', weekAgo.toISOString().split('T')[0]);

  const { count: monthJobs } = await adminClient
    .from('work_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('service_date', monthStart.toISOString().split('T')[0]);

  const stats: Stats = {
    totalJobs: totalJobs || 0,
    weekJobs: weekJobs || 0,
    thisMonthJobs: monthJobs || 0,
    images: 0,
    reports: 0,
  };

  // Count images
  if (workLogs) {
    stats.images = workLogs.reduce((acc, log) => {
      const urls = log.image_urls as string[] | null;
      return acc + (urls?.length || 0);
    }, 0);
  }

  const uniqueLocationCount = workLogs
    ? new Set(workLogs.map(w => `${w.city},${w.state}`)).size
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} userProfile={userProfile || undefined} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Work History</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {stats.totalJobs} total job{stats.totalJobs !== 1 ? "s" : ""} across {uniqueLocationCount} location{uniqueLocationCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2">
              <i className="fas fa-download"></i>
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Link href="/schedule">
              <Button size="sm" className="gap-2">
                <i className="fas fa-plus"></i>
                <span className="hidden sm:inline">New Entry</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wide">Total Jobs</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                    {stats.totalJobs}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-briefcase text-primary text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wide">This Week</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                    {stats.weekJobs}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-week text-green-500 text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wide">Photos</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                    {stats.images}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-image text-blue-500 text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wide">This Month</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                    {stats.thisMonthJobs}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-purple-500 text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* In Progress Jobs Map */}
        <DashboardMap inProgressJobs={inProgressJobs} />

        {/* Recent Work Logs */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Work Logs</h3>

            {!workLogs || workLogs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-clipboard-list text-2xl text-muted-foreground"></i>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">No work logs yet</h4>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first work log entry.
                </p>
                <Link href="/schedule">
                  <Button>
                    <i className="fas fa-plus mr-2"></i>
                    Create First Entry
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {workLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-briefcase text-primary"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{log.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.work_type} - {log.location_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.city}, {log.state} - {log.service_date}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      log.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : log.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Link href="/properties">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <i className="fas fa-building text-2xl text-primary mb-2"></i>
                <p className="font-medium">Properties</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/estimates">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <i className="fas fa-file-invoice-dollar text-2xl text-primary mb-2"></i>
                <p className="font-medium">Estimates</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/schedule">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <i className="fas fa-calendar-alt text-2xl text-primary mb-2"></i>
                <p className="font-medium">Schedule</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/settings">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <i className="fas fa-cog text-2xl text-primary mb-2"></i>
                <p className="font-medium">Settings</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
