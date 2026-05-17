import { useState, useRef } from "react";
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
import { type WorkLog, type PhotoMeta } from "@shared/schema";

interface Stats {
  totalJobs: number;
  weekJobs: number;
  thisMonthJobs: number;
  images: number;
  reports: number;
}

function calcDuration(checkIn: string, checkOut: string): string {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (ms <= 0) return "0 min";
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

interface LocationGroup {
  key: string;
  label: string;
  sublabel: string;
  jobs: WorkLog[];
  technicianIds: Set<string>;
  technicianNames: string[];
  workTypes: Record<string, number>;
  totalHoursMs: number;
  lastServiceDate: string;
  checkedInCount: number;
}

function buildLocationGroups(workLogs: WorkLog[]): LocationGroup[] {
  const map = new Map<string, LocationGroup>();

  for (const log of workLogs) {
    const key = `${log.city?.toLowerCase()},${log.state?.toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: log.locationName || `${log.city}, ${log.state}`,
        sublabel: log.locationName ? `${log.city}, ${log.state} ${log.zipCode}` : log.zipCode || "",
        jobs: [],
        technicianIds: new Set(),
        technicianNames: [],
        workTypes: {},
        totalHoursMs: 0,
        lastServiceDate: log.serviceDate,
        checkedInCount: 0,
      });
    }
    const grp = map.get(key)!;
    grp.jobs.push(log);

    const ids: string[] = (log as any).technicianUserIds ?? [];
    const allIds = ids.length ? ids : [log.technicianUserId];
    allIds.forEach(id => grp.technicianIds.add(id));

    const techObj = (log as any).technician;
    if (techObj) {
      const name = `${techObj.firstName ?? ""} ${techObj.lastName ?? ""}`.trim();
      if (name && !grp.technicianNames.includes(name)) grp.technicianNames.push(name);
    }

    grp.workTypes[log.workType] = (grp.workTypes[log.workType] || 0) + 1;

    const ci = (log as any).checkInTime;
    const co = (log as any).checkOutTime;
    if (ci && co) {
      grp.totalHoursMs += new Date(co).getTime() - new Date(ci).getTime();
    }
    if (ci && !co) grp.checkedInCount++;

    if (log.serviceDate > grp.lastServiceDate) grp.lastServiceDate = log.serviceDate;
  }

  return Array.from(map.values()).sort((a, b) => b.lastServiceDate.localeCompare(a.lastServiceDate));
}

function LocationsView({
  workLogs,
  onSelectJob,
}: {
  workLogs: WorkLog[];
  onSelectJob: (wl: WorkLog) => void;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const groups = buildLocationGroups(workLogs);

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-map-marker-alt text-2xl text-muted-foreground"></i>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No locations yet</h3>
          <p className="text-muted-foreground">Work logs with location data will appear here grouped by site.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((grp) => {
        const isExpanded = expandedKey === grp.key;
        const totalHrsLabel = grp.totalHoursMs > 0
          ? calcDuration(
              new Date(0).toISOString(),
              new Date(grp.totalHoursMs).toISOString()
            )
          : null;
        const topTypes = Object.entries(grp.workTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        return (
          <Card key={grp.key} className="overflow-hidden" data-testid={`location-group-${grp.key}`}>
            <CardContent className="p-0">
              {/* Location header */}
              <button
                className="w-full text-left p-5 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedKey(isExpanded ? null : grp.key)}
                data-testid={`location-group-toggle-${grp.key}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fas fa-map-marker-alt text-primary text-lg"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                        {grp.label}
                      </h3>
                      {grp.sublabel && (
                        <p className="text-xs text-muted-foreground mt-0.5">{grp.sublabel}</p>
                      )}

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <i className="fas fa-briefcase text-primary text-xs"></i>
                          {grp.jobs.length} job{grp.jobs.length !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <i className="fas fa-users text-xs"></i>
                          {grp.technicianIds.size} technician{grp.technicianIds.size !== 1 ? "s" : ""}
                        </span>
                        {totalHrsLabel && (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <i className="fas fa-clock text-xs"></i>
                            {totalHrsLabel} logged
                          </span>
                        )}
                        {grp.checkedInCount > 0 && (
                          <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                            {grp.checkedInCount} on site now
                          </span>
                        )}
                      </div>

                      {/* Technician names */}
                      {grp.technicianNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {grp.technicianNames.slice(0, 4).map((name) => (
                            <span key={name} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              <i className="fas fa-user mr-1 text-[10px]"></i>
                              {name}
                            </span>
                          ))}
                          {grp.technicianNames.length > 4 && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              +{grp.technicianNames.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Work type badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {topTypes.map(([type, count]) => (
                          <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {type} × {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      Last: {new Date(grp.lastServiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <i className={`fas fa-chevron-${isExpanded ? "up" : "down"} text-muted-foreground text-sm transition-transform`}></i>
                  </div>
                </div>
              </button>

              {/* Expanded job list */}
              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Jobs at this location
                  </p>
                  {grp.jobs.map((job) => {
                    const ci = (job as any).checkInTime;
                    const co = (job as any).checkOutTime;
                    const dur = ci && co ? calcDuration(ci, co) : null;
                    const onSite = ci && !co;
                    return (
                      <button
                        key={job.id}
                        className="w-full text-left bg-background rounded-lg border border-border p-3 hover:border-primary/40 hover:shadow-sm transition-all"
                        onClick={() => onSelectJob(job)}
                        data-testid={`location-job-${job.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{job.customerName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {job.workType} · {job.serviceDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {onSite && (
                              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                                On Site
                              </span>
                            )}
                            {dur && (
                              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                <i className="fas fa-clock mr-1"></i>{dur}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              job.status === 'completed'
                                ? 'bg-accent/10 text-accent'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [editWorkLog, setEditWorkLog] = useState<WorkLog | null>(null);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxMetadata, setLightboxMetadata] = useState<PhotoMeta[] | undefined>(undefined);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showMap, setShowMap] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "locations">("list");
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

  const uniqueLocationCount = new Set(workLogs.map(w => `${w.city},${w.state}`)).size;

  const handleOpenLightbox = (images: string[], index: number, metadata?: PhotoMeta[]) => {
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
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
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
              {workLogs.length} total job{workLogs.length !== 1 ? "s" : ""} across {uniqueLocationCount} location{uniqueLocationCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* View mode toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
                data-testid="view-mode-list"
              >
                <i className="fas fa-list text-xs"></i>
                <span className="hidden sm:inline">Jobs</span>
              </button>
              <button
                onClick={() => setViewMode("locations")}
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === "locations"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
                data-testid="view-mode-locations"
              >
                <i className="fas fa-map-marker-alt text-xs"></i>
                <span className="hidden sm:inline">By Location</span>
              </button>
            </div>

            {viewMode === "list" && (
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
            )}
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
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wide">Total Jobs</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1" data-testid="stat-total-jobs">
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
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wide">This Week</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1" data-testid="stat-week-jobs">
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
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wide">Photos</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1" data-testid="stat-images">
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
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wide">Reports</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1" data-testid="stat-reports">
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

        {/* By Location view */}
        {viewMode === "locations" && (
          <>
            {workLogs.length > 0 && (
              <div className="mb-5">
                <JobMap workLogs={filteredWorkLogs} className="h-48 sm:h-64 md:h-72" onPinClick={handleWorkLogSelect} />
              </div>
            )}
            <LocationsView workLogs={filteredWorkLogs} onSelectJob={handleWorkLogSelect} />
          </>
        )}

        {/* Jobs list view */}
        {viewMode === "list" && (
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
                    className="h-64 sm:h-80 lg:h-[480px]"
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
        )}
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
