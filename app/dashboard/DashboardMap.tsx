'use client';

import { JobMap } from '@/components/JobMap';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

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
}

interface DashboardMapProps {
  inProgressJobs: WorkLog[];
}

export function DashboardMap({ inProgressJobs }: DashboardMapProps) {
  if (inProgressJobs.length === 0) {
    return null;
  }

  return (
    <Card className="mb-5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <i className="fas fa-map-marker-alt text-blue-500"></i>
            In Progress Jobs ({inProgressJobs.length})
          </h3>
          <Link href="/schedule" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <JobMap
          workLogs={inProgressJobs}
          height="250px"
        />
        <div className="mt-3 space-y-2">
          {inProgressJobs.slice(0, 3).map((job) => (
            <div key={job.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
              <div>
                <span className="font-medium">{job.customer_name}</span>
                <span className="text-muted-foreground ml-2">{job.location_name}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                In Progress
              </span>
            </div>
          ))}
          {inProgressJobs.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{inProgressJobs.length - 3} more in progress
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
