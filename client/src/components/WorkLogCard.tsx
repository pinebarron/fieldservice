import { Card, CardContent } from "@/components/ui/card";
import { type WorkLog, type PhotoMeta } from "@shared/schema";

interface WorkLogCardProps {
  workLog: WorkLog;
  onSelect: (workLog: WorkLog) => void;
  onOpenLightbox: (images: string[], index: number, metadata?: PhotoMeta[]) => void;
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

export function WorkLogCard({ workLog, onSelect, onOpenLightbox }: WorkLogCardProps) {
  const getWorkTypeIcon = (workType: string) => {
    const type = workType.toLowerCase();
    if (type.includes('solar') || type.includes('installation')) return 'fa-solar-panel';
    if (type.includes('maintenance')) return 'fa-wrench';
    if (type.includes('inspection')) return 'fa-clipboard-check';
    if (type.includes('repair')) return 'fa-tools';
    return 'fa-clipboard-list';
  };

  const getWorkTypeColor = (workType: string) => {
    const type = workType.toLowerCase();
    if (type.includes('solar') || type.includes('installation')) return 'bg-primary/10 text-primary';
    if (type.includes('maintenance')) return 'bg-secondary/10 text-secondary';
    if (type.includes('inspection')) return 'bg-accent/10 text-accent';
    if (type.includes('repair')) return 'bg-destructive/10 text-destructive';
    return 'bg-muted/10 text-muted-foreground';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const cityStateZip = [workLog.city, workLog.state, workLog.zipCode].filter(Boolean).join(', ').replace(', ', ' ');
  const hasGps = (workLog.photoMetadata ?? []).some((p: PhotoMeta) => p.lat !== undefined);
  const gpsAddress = (workLog.photoMetadata ?? []).find((p: PhotoMeta) => p.address)?.address;

  const ids: string[] = (workLog as any).technicianUserIds ?? [];
  const extra = ids.length > 1 ? ids.length - 1 : 0;

  const isCheckedIn = !!(workLog as any).checkInTime && !(workLog as any).checkOutTime;
  const isCheckedOut = !!(workLog as any).checkInTime && !!(workLog as any).checkOutTime;
  const duration = isCheckedOut
    ? calcDuration((workLog as any).checkInTime, (workLog as any).checkOutTime)
    : null;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(workLog)}
      data-testid={`work-log-card-${workLog.id}`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">

            {/* Top row: icon + customer + date */}
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 ${getWorkTypeColor(workLog.workType)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <i className={`fas ${getWorkTypeIcon(workLog.workType)} text-lg`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground leading-tight" data-testid={`work-log-title-${workLog.id}`}>
                    {workLog.customerName}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5" data-testid={`work-log-date-${workLog.id}`}>
                    <i className="fas fa-calendar mr-1"></i>
                    {formatDate(workLog.serviceDate)}
                  </span>
                </div>

                {/* Location — prominent */}
                <div className="mt-1.5 flex items-start gap-1.5" data-testid={`work-log-location-${workLog.id}`}>
                  <i className="fas fa-map-marker-alt text-primary text-xs mt-0.5 flex-shrink-0"></i>
                  <div className="flex-1 min-w-0">
                    {workLog.locationName && (
                      <p className="text-sm font-medium text-foreground leading-tight truncate">
                        {workLog.locationName}
                      </p>
                    )}
                    <p className={`text-xs ${workLog.locationName ? "text-muted-foreground" : "text-sm text-foreground font-medium"}`}>
                      {gpsAddress || cityStateZip}
                    </p>
                  </div>
                  {hasGps && (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold">
                      <i className="fas fa-satellite-dish text-[8px]"></i>
                      GPS
                    </span>
                  )}
                </div>

                {/* Technician + time row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span data-testid={`work-log-technician-${workLog.id}`}>
                    <i className={`fas ${extra > 0 ? "fa-users" : "fa-user"} mr-1`}></i>
                    {(workLog as any).technician?.firstName} {(workLog as any).technician?.lastName}
                    {extra > 0 && (
                      <span className="ml-1 bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                        +{extra} more
                      </span>
                    )}
                  </span>
                  {workLog.startTime && workLog.endTime && (
                    <span data-testid={`work-log-duration-${workLog.id}`}>
                      <i className="fas fa-clock mr-1"></i>
                      {workLog.startTime} – {workLog.endTime}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Work performed */}
            {workLog.workPerformed && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2" data-testid={`work-log-notes-${workLog.id}`}>
                {workLog.workPerformed}
              </p>
            )}

            {/* Status + work type + check-in badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                <i className="fas fa-check-circle mr-1"></i>
                {workLog.status === 'completed' ? 'Completed' : workLog.status}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getWorkTypeColor(workLog.workType)}`}>
                {workLog.workType}
              </span>
              {isCheckedIn && (
                <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1" data-testid={`work-log-checkin-${workLog.id}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                  On Site
                </span>
              )}
              {isCheckedOut && duration && (
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-full text-xs font-medium" data-testid={`work-log-duration-badge-${workLog.id}`}>
                  <i className="fas fa-clock mr-1"></i>
                  {duration} on site
                </span>
              )}
            </div>
          </div>

          {/* Photo thumbnails */}
          {workLog.imageUrls && workLog.imageUrls.length > 0 && (
            <div className="flex sm:flex-col gap-2 sm:items-end flex-shrink-0">
              <div className="flex gap-1.5">
                {workLog.imageUrls.slice(0, 2).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Work site photo ${index + 1}`}
                    className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLightbox(workLog.imageUrls!, index, workLog.photoMetadata ?? undefined);
                    }}
                    data-testid={`work-log-image-${workLog.id}-${index}`}
                  />
                ))}
                {workLog.imageUrls.length > 2 && (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                    +{workLog.imageUrls.length - 2}
                  </div>
                )}
              </div>
              {workLog.pdfUrls && workLog.pdfUrls.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <i className="fas fa-paperclip text-muted-foreground text-xs"></i>
                  <span className="text-xs text-muted-foreground" data-testid={`work-log-pdfs-${workLog.id}`}>
                    {workLog.pdfUrls.length} PDF{workLog.pdfUrls.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
