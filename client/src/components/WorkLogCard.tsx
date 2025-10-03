import { Card, CardContent } from "@/components/ui/card";
import { type WorkLog } from "@shared/schema";

interface WorkLogCardProps {
  workLog: WorkLog;
  onSelect: (workLog: WorkLog) => void;
  onOpenLightbox: (images: string[], index: number) => void;
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
      year: 'numeric' 
    });
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={() => onSelect(workLog)}
      data-testid={`work-log-card-${workLog.id}`}
    >
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 ${getWorkTypeColor(workLog.workType)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <i className={`fas ${getWorkTypeIcon(workLog.workType)} text-xl`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground" data-testid={`work-log-title-${workLog.id}`}>
                  {workLog.customerName}
                </h3>
                <p className="text-sm text-muted-foreground mt-1" data-testid={`work-log-location-${workLog.id}`}>
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  {workLog.location}
                </p>
                <div className="flex flex-wrap gap-3 mt-3 text-sm">
                  <span className="text-muted-foreground" data-testid={`work-log-technician-${workLog.id}`}>
                    <i className="fas fa-user mr-1"></i>
                    {workLog.technicianName}
                  </span>
                  <span className="text-muted-foreground" data-testid={`work-log-date-${workLog.id}`}>
                    <i className="fas fa-calendar mr-1"></i>
                    {formatDate(workLog.serviceDate)}
                  </span>
                  {workLog.startTime && workLog.endTime && (
                    <span className="text-muted-foreground" data-testid={`work-log-duration-${workLog.id}`}>
                      <i className="fas fa-clock mr-1"></i>
                      {workLog.startTime} - {workLog.endTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 line-clamp-2" data-testid={`work-log-notes-${workLog.id}`}>
              {workLog.workPerformed}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="status-badge px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                <i className="fas fa-check-circle mr-1"></i>
                {workLog.status === 'completed' ? 'Completed' : workLog.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkTypeColor(workLog.workType)}`}>
                {workLog.workType}
              </span>
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 sm:items-end">
            {workLog.imageUrls && workLog.imageUrls.length > 0 && (
              <div className="flex gap-1">
                {workLog.imageUrls.slice(0, 2).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Work site photo ${index + 1}`}
                    className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLightbox(workLog.imageUrls!, index);
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
            )}
            {workLog.pdfUrls && workLog.pdfUrls.length > 0 && (
              <div className="flex gap-2 mt-2">
                <i className="fas fa-paperclip text-muted-foreground"></i>
                <span className="text-xs text-muted-foreground" data-testid={`work-log-pdfs-${workLog.id}`}>
                  {workLog.pdfUrls.length} PDF{workLog.pdfUrls.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
