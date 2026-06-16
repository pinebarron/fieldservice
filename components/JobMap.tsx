'use client';

import { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';

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
  // Pre-geocoded coordinates from server
  job_lat?: number | null;
  job_lng?: number | null;
}

interface MapPin {
  lat: number;
  lng: number;
  workLog: WorkLog;
}

interface JobMapProps {
  workLogs: WorkLog[];
  height?: string;
  className?: string;
  onPinClick?: (workLog: WorkLog) => void;
}

const WORK_TYPE_COLOR: Record<string, string> = {
  "solar": "#f59e0b",
  "maintenance": "#3b82f6",
  "inspection": "#8b5cf6",
  "repair": "#ef4444",
  "installation": "#16a34a",
  "default": "#1e40af",
};

function getColor(workType: string) {
  const lower = workType.toLowerCase();
  for (const [key, color] of Object.entries(WORK_TYPE_COLOR)) {
    if (lower.includes(key)) return color;
  }
  return WORK_TYPE_COLOR.default;
}

function makeSvgIcon(color: string, count?: number): string {
  const label = count && count > 1
    ? `<text x="12" y="15" text-anchor="middle" font-size="8" fill="white" font-weight="bold">${count}</text>`
    : "";
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" width="28" height="40">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
      ${label}
    </svg>`;
}

async function geocodeAddress(location: string, city: string, state: string, zip: string): Promise<{ lat: number; lng: number } | null> {
  // Try multiple query formats for better results
  const queries = [
    `${location}, ${city}, ${state} ${zip}, USA`,
    `${city}, ${state} ${zip}, USA`,
    `${zip}, USA`,
    `${city}, ${state}, USA`,
  ];

  for (const query of queries) {
    try {
      const q = encodeURIComponent(query);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "Crewatt App"
          }
        }
      );
      const data = await res.json();
      if (data?.[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      // Silently fail - Nominatim can fail due to rate limits or CORS
      // Server-side geocoding (job_lat/job_lng) is the primary source
    }
  }

  return null;
}

function JobMapInner({ workLogs, height = "300px", className, onPinClick }: JobMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "nodata" | "nogeo">("loading");
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    if (!mapContainerRef.current || workLogs.length === 0) {
      setStatus("nodata");
      return;
    }

    // Store address for display
    const wl = workLogs[0];
    setAddress(`${wl.location_name}, ${wl.city}, ${wl.state} ${wl.zip_code}`);

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        // Wait a bit for CSS to load
        await new Promise(r => setTimeout(r, 100));
      }

      if (cancelled || !mapContainerRef.current) return;

      // Destroy existing map if re-initializing
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [37.5, -96],
        zoom: 4,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Use stored coordinates first, fall back to geocoding
      const geocodeCache = new Map<string, { lat: number; lng: number } | null>();
      const pins: MapPin[] = [];

      for (const wl of workLogs) {
        // Prefer pre-geocoded coordinates from server
        if (wl.job_lat && wl.job_lng) {
          pins.push({ lat: wl.job_lat, lng: wl.job_lng, workLog: wl });
          continue;
        }

        // Fall back to client-side geocoding (may fail due to rate limits/CORS)
        const key = `${wl.location_name},${wl.city},${wl.state},${wl.zip_code}`;
        if (!geocodeCache.has(key)) {
          try {
            const coords = await geocodeAddress(wl.location_name, wl.city, wl.state, wl.zip_code);
            geocodeCache.set(key, coords);
          } catch (e) {
            // Silently fail - geocoding is best-effort on client
            geocodeCache.set(key, null);
          }
        }
        const coords = geocodeCache.get(key);
        if (coords) pins.push({ ...coords, workLog: wl });
      }

      if (cancelled) return;

      if (pins.length === 0) {
        setStatus("nogeo");
        return;
      }

      // Cluster pins at same location
      const grouped = new Map<string, MapPin[]>();
      for (const p of pins) {
        const k = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
        if (!grouped.has(k)) grouped.set(k, []);
        grouped.get(k)!.push(p);
      }

      const bounds: [number, number][] = [];

      for (const group of Array.from(grouped.values())) {
        const { lat, lng, workLog } = group[0];
        bounds.push([lat, lng]);
        const color = getColor(workLog.work_type);
        const svgStr = makeSvgIcon(color, group.length);
        const icon = L.divIcon({
          html: svgStr,
          iconSize: [28, 40],
          iconAnchor: [14, 40],
          popupAnchor: [0, -38],
          className: "",
        });

        const jobs = group.map((g: MapPin) => g.workLog);
        const popupHtml = `
          <div style="min-width:180px;font-family:system-ui,sans-serif">
            ${jobs.map((j: WorkLog) => `
              <div style="padding:4px 0;border-bottom:1px solid #e5e7eb">
                <div style="font-weight:600;font-size:13px">${j.customer_name}</div>
                <div style="font-size:11px;color:#6b7280">${j.work_type} · ${j.service_date}</div>
                <div style="font-size:11px;color:#6b7280">${j.location_name}</div>
              </div>
            `).join("")}
          </div>
        `;

        const marker = L.marker([lat, lng], { icon })
          .bindPopup(popupHtml, { maxWidth: 260 })
          .addTo(map);

        if (onPinClick) {
          marker.on("click", () => {
            if (jobs.length === 1) onPinClick(jobs[0]);
          });
        }
      }

      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds as any, { padding: [40, 40] });
      }

      setStatus("ready");
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [workLogs, onPinClick]);

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-border ${className || ''}`}
      style={{ height }}
    >
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-muted/80 gap-3">
          <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      )}
      {status === "nodata" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
          <i className="fas fa-map-marked-alt text-3xl text-muted-foreground"></i>
          <p className="text-sm text-muted-foreground">No location data available</p>
        </div>
      )}
      {status === "nogeo" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2 p-4">
          <i className="fas fa-map-marker-alt text-3xl text-muted-foreground"></i>
          <p className="text-sm text-muted-foreground text-center">Could not find location on map</p>
          <p className="text-xs text-muted-foreground text-center">{address}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mt-2"
          >
            <i className="fas fa-external-link-alt mr-1"></i>
            Try Google Maps
          </a>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

// Export with dynamic import to avoid SSR issues with Leaflet
export const JobMap = dynamic(() => Promise.resolve(JobMapInner), {
  ssr: false,
  loading: () => (
    <div className="relative rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center" style={{ height: '180px' }}>
      <div className="text-center">
        <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});
