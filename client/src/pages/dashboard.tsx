import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkLogCard } from "@/components/WorkLogCard";
import { NewEntryModal } from "@/components/NewEntryModal";
import { DetailJobModal } from "@/components/DetailJobModal";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useAuth } from "@/hooks/useAuth";
import { type WorkLog } from "@shared/schema";

interface Stats {
  totalJobs: number;
  weekJobs: number;
  thisMonthJobs: number;
  images: number;
  reports: number;
}

export default function Dashboard() {
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const { user } = useAuth();

  const { data: workLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<WorkLog[]>({
    queryKey: ['/api/work-logs'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  const filters = [
    { key: "all", label: "All Jobs" },
    { key: "solar", label: "Solar Installation" },
    { key: "maintenance", label: "Maintenance" },
    { key: "inspection", label: "Inspection" },
    { key: "repair", label: "Repair" },
  ];

  const filteredWorkLogs = workLogs.filter(log => {
    if (activeFilter === "all") return true;
    return log.workType.toLowerCase().includes(activeFilter);
  });

  const handleOpenLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleWorkLogSelect = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog);
  };

  if (logsLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-clipboard-list text-primary-foreground text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">FieldCapture</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Service Work Logger</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/employees">
                <Button variant="ghost" size="sm" data-testid="employees-link">
                  <i className="fas fa-users mr-2"></i>
                  <span className="hidden sm:inline">Employees</span>
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = "/api/logout"}
                data-testid="logout-button"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <div className="flex items-center gap-2">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Work Log Dashboard</h2>
              <p className="text-muted-foreground mt-1">Track and manage field service entries</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2" data-testid="filter-button">
                <i className="fas fa-filter"></i>
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <Button variant="outline" className="flex items-center gap-2" data-testid="export-button">
                <i className="fas fa-download"></i>
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Jobs</p>
                    <p className="text-2xl font-bold text-foreground mt-1" data-testid="stat-total-jobs">
                      {stats?.totalJobs || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-briefcase text-primary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">This Week</p>
                    <p className="text-2xl font-bold text-foreground mt-1" data-testid="stat-week-jobs">
                      {stats?.weekJobs || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-week text-accent text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Images Uploaded</p>
                    <p className="text-2xl font-bold text-foreground mt-1" data-testid="stat-images">
                      {stats?.images || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-image text-secondary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Reports</p>
                    <p className="text-2xl font-bold text-foreground mt-1" data-testid="stat-reports">
                      {stats?.reports || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-file-pdf text-destructive text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-testid={`filter-${filter.key}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Work Log Entries */}
        <div className="space-y-4">
          {filteredWorkLogs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-clipboard-list text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No work logs found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeFilter === "all" 
                    ? "Start by creating your first work log entry."
                    : "No entries match the selected filter. Try a different filter or create a new entry."
                  }
                </p>
                <Button onClick={() => setIsNewEntryModalOpen(true)} data-testid="create-first-entry-button">
                  Create First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredWorkLogs.map((workLog) => (
              <WorkLogCard
                key={workLog.id}
                workLog={workLog}
                onSelect={handleWorkLogSelect}
                onOpenLightbox={handleOpenLightbox}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsNewEntryModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all lg:w-auto lg:px-6 lg:py-3 lg:bottom-8 lg:right-8"
        data-testid="new-entry-fab"
      >
        <i className="fas fa-plus lg:mr-2"></i>
        <span className="hidden lg:inline">New Entry</span>
      </Button>

      {/* Modals */}
      <NewEntryModal
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
        onSuccess={refetchLogs}
      />

      {selectedWorkLog && (
        <DetailJobModal
          workLog={selectedWorkLog}
          isOpen={!!selectedWorkLog}
          onClose={() => setSelectedWorkLog(null)}
          onOpenLightbox={handleOpenLightbox}
          onRefresh={refetchLogs}
        />
      )}

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
