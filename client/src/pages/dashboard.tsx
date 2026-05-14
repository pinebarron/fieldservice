import { useState, useRef } from "react";
import { Link } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkLogCard } from "@/components/WorkLogCard";
import { NewEntryModal } from "@/components/NewEntryModal";
import { DetailJobModal } from "@/components/DetailJobModal";
import { ImageLightbox } from "@/components/ImageLightbox";
import { JobMap } from "@/components/JobMap";
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
  const [editWorkLog, setEditWorkLog] = useState<WorkLog | null>(null);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxMetadata, setLightboxMetadata] = useState<import("@shared/schema").PhotoMeta[] | undefined>(undefined);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showMap, setShowMap] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { user } = useAuth();

  const { data: workLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<WorkLog[]>({
    queryKey: ['/api/work-logs'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  const filters = [
    { key: "all", label: "All Jobs", icon: "fa-list" },
    { key: "mine", label: "My Jobs", icon: "fa-user" },
    { key: "solar", label: "Solar", icon: "fa-solar-panel" },
    { key: "maintenance", label: "Maintenance", icon: "fa-wrench" },
    { key: "inspection", label: "Inspection", icon: "fa-clipboard-check" },
    { key: "repair", label: "Repair", icon: "fa-tools" },
  ];

  const filteredWorkLogs = workLogs.filter(log => {
    if (activeFilter === "mine") {
      const ids: string[] = (log as any).technicianUserIds ?? [];
      return ids.includes(user?.id ?? "") || log.technicianUserId === user?.id;
    }
    if (activeFilter === "all") return true;
    return log.workType.toLowerCase().includes(activeFilter);
  });

  const handleOpenLightbox = (images: string[], index: number, metadata?: import("@shared/schema").PhotoMeta[]) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxMetadata(metadata);
    setIsLightboxOpen(true);
  };

  const handleWorkLogSelect = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog);
  };

  const handleEditWorkLog = (workLog: WorkLog) => {
    setEditWorkLog(workLog);
    setIsNewEntryModalOpen(true);
    setSelectedWorkLog(null);
  };

  const handleCloseNewEntryModal = () => {
    setIsNewEntryModalOpen(false);
    setEditWorkLog(null);
  };

  const handlePinClick = (wl: WorkLog) => {
    setHighlightedId(wl.id);
    const el = cardRefs.current[wl.id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setHighlightedId(null), 2500);
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
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Work History</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {workLogs.length} total job{workLogs.length !== 1 ? "s" : ""} across {new Set(workLogs.map(w => `${w.city},${w.state}`)).size} location{new Set(workLogs.map(w => `${w.city},${w.state}`)).size !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showMap ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setShowMap(v => !v)}
              data-testid="toggle-map-button"
            >
              <i className="fas fa-map-marked-alt"></i>
              <span className="hidden sm:inline">{showMap ? "Hide Map" : "Show Map"}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" data-testid="export-button">
              <i className="fas fa-download"></i>
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Total Jobs</p>
                  <p className="text-2xl font-bold text-foreground mt-1" data-testid="stat-total-jobs">
                    {stats?.totalJobs || 0}
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
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">This Week</p>
                  <p className="text-2xl font-bold text-foreground mt-1" data-testid="stat-week-jobs">
                    {stats?.weekJobs || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-week text-accent text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Photos</p>
                  <p className="text-2xl font-bold text-foreground mt-1" data-testid="stat-images">
                    {stats?.images || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-image text-secondary text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Reports</p>
                  <p className="text-2xl font-bold text-foreground mt-1" data-testid="stat-reports">
                    {stats?.reports || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-pdf text-destructive text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid={`filter-${filter.key}`}
            >
              <i className={`fas ${filter.icon} text-xs`}></i>
              {filter.label}
            </button>
          ))}
        </div>

        {/* Split layout: map + job list */}
        <div className={showMap && workLogs.length > 0 ? "flex flex-col lg:flex-row gap-5" : ""}>

          {/* Map panel */}
          {showMap && workLogs.length > 0 && (
            <div className="lg:w-[400px] xl:w-[460px] flex-shrink-0">
              <div className="lg:sticky lg:top-20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <i className="fas fa-map-marker-alt mr-1.5 text-primary"></i>
                    {filteredWorkLogs.length} location{filteredWorkLogs.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Tap a pin to highlight job</p>
                </div>
                <JobMap
                  workLogs={filteredWorkLogs}
                  height="480px"
                  onPinClick={handlePinClick}
                />
              </div>
            </div>
          )}

          {/* Job list */}
          <div className="flex-1 min-w-0">
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
                      : activeFilter === "mine"
                      ? "No jobs assigned to you yet."
                      : "No entries match the selected filter."}
                  </p>
                  <Button onClick={() => setIsNewEntryModalOpen(true)} data-testid="create-first-entry-button">
                    Create First Entry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredWorkLogs.map((workLog) => (
                  <div
                    key={workLog.id}
                    ref={el => { cardRefs.current[workLog.id] = el; }}
                    className={`transition-all duration-300 rounded-xl ${
                      highlightedId === workLog.id
                        ? "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.01]"
                        : ""
                    }`}
                  >
                    <WorkLogCard
                      workLog={workLog}
                      onSelect={handleWorkLogSelect}
                      onOpenLightbox={handleOpenLightbox}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
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
        onClose={handleCloseNewEntryModal}
        onSuccess={refetchLogs}
        editWorkLog={editWorkLog || undefined}
      />

      {selectedWorkLog && (
        <DetailJobModal
          workLog={selectedWorkLog}
          isOpen={!!selectedWorkLog}
          onClose={() => setSelectedWorkLog(null)}
          onOpenLightbox={handleOpenLightbox}
          onRefresh={refetchLogs}
          onEdit={handleEditWorkLog}
        />
      )}

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        metadata={lightboxMetadata}
      />
    </div>
  );
}
