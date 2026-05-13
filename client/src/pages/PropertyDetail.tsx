import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { type Property, type WorkLog } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkLogCard } from "@/components/WorkLogCard";
import { NewEntryModal } from "@/components/NewEntryModal";
import { DetailJobModal } from "@/components/DetailJobModal";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getStatusColor(status: string) {
  if (status === "active") return "bg-green-100 text-green-700";
  if (status === "on-hold") return "bg-yellow-100 text-yellow-700";
  if (status === "completed") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [editWorkLog, setEditWorkLog] = useState<WorkLog | null>(null);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { data: property, isLoading: propLoading } = useQuery<Property>({
    queryKey: ["/api/properties", id],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Property not found");
      return res.json();
    },
  });

  const { data: workLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<WorkLog[]>({
    queryKey: ["/api/work-logs", { propertyId: id }],
    queryFn: async () => {
      const res = await fetch(`/api/work-logs?propertyId=${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load work logs");
      return res.json();
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/properties/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
    },
  });

  const handleOpenLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleEditWorkLog = (workLog: WorkLog) => {
    setEditWorkLog(workLog);
    setIsNewEntryModalOpen(true);
    setSelectedWorkLog(null);
  };

  const handleCloseNewEntry = () => {
    setIsNewEntryModalOpen(false);
    setEditWorkLog(null);
  };

  if (propLoading || logsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Property not found.</p>
          <Link href="/properties">
            <Button className="mt-4">Back to Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  const workTypeGroups = workLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.workType] = (acc[log.workType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center cursor-pointer">
                  <i className="fas fa-clipboard-list text-primary-foreground text-xl"></i>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">FieldCapture</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Property Detail</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <i className="fas fa-table-list mr-2"></i>
                  <span className="hidden sm:inline">Work Logs</span>
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="ghost" size="sm">
                  <i className="fas fa-building mr-2"></i>
                  <span className="hidden sm:inline">Properties</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/api/logout"}>
                <i className="fas fa-sign-out-alt mr-2"></i>
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <div className="flex items-center gap-2">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back breadcrumb */}
        <Link href="/properties">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors" data-testid="back-to-properties">
            <i className="fas fa-arrow-left"></i>
            All Properties
          </button>
        </Link>

        {/* Property Header Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-building text-primary text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground" data-testid="property-detail-name">
                    {property.propertyName}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    <i className="fas fa-user mr-2"></i>
                    {property.customerName}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    {property.locationName}, {property.city}, {property.state} {property.zipCode}
                  </p>
                  {property.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">{property.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3">
                <Select value={property.status} onValueChange={(v) => updateStatusMutation.mutate(v)}>
                  <SelectTrigger className="w-40" data-testid="select-property-status-detail">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => { setEditWorkLog(null); setIsNewEntryModalOpen(true); }} data-testid="button-add-work-log">
                  <i className="fas fa-plus mr-2"></i>
                  Add Work Log
                </Button>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{workLogs.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Logs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {workLogs.reduce((sum, l) => sum + (l.imageUrls?.length || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Photos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {workLogs.reduce((sum, l) => sum + (l.pdfUrls?.length || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Reports</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{Object.keys(workTypeGroups).length}</p>
                <p className="text-xs text-muted-foreground mt-1">Work Types</p>
              </div>
            </div>

            {/* Work type breakdown */}
            {Object.keys(workTypeGroups).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {Object.entries(workTypeGroups).map(([type, count]) => (
                  <span key={type} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {type} ({count})
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Logs */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Work History</h3>
          <span className="text-sm text-muted-foreground">{workLogs.length} entries</span>
        </div>

        {workLogs.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-clipboard-list text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No work logs yet</h3>
              <p className="text-muted-foreground mb-4">
                Add the first work log to start tracking work history for this property.
              </p>
              <Button onClick={() => setIsNewEntryModalOpen(true)} data-testid="button-add-first-work-log">
                <i className="fas fa-plus mr-2"></i>
                Add First Work Log
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {workLogs.map((workLog) => (
              <WorkLogCard
                key={workLog.id}
                workLog={workLog}
                onSelect={setSelectedWorkLog}
                onOpenLightbox={handleOpenLightbox}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <Button
        onClick={() => { setEditWorkLog(null); setIsNewEntryModalOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all lg:w-auto lg:px-6 lg:py-3 lg:bottom-8 lg:right-8"
        data-testid="new-entry-fab"
      >
        <i className="fas fa-plus lg:mr-2"></i>
        <span className="hidden lg:inline">New Entry</span>
      </Button>

      <NewEntryModal
        isOpen={isNewEntryModalOpen}
        onClose={handleCloseNewEntry}
        onSuccess={refetchLogs}
        editWorkLog={editWorkLog || undefined}
        prefillProperty={property}
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
      />
    </div>
  );
}
