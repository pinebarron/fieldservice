import { useEffect, useRef, useState } from "react";
import type { WorkLog } from "@shared/schema";

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
  singleJob?: boolean;
}

const WORK_TYPE_COLOR: Record<string, string> = {
  "solar installation": "#f59e0b",
  "maintenance":        "#3b82f6",
  "inspection":         "#8b5cf6",
  "repair":             "#ef4444",
  "default":            "#1e40af",
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

async function geocodeAddress(city: string, state: string, zip: string): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${city}, ${state} ${zip}, USA`);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

export function JobMap({ workLogs, height, className, onPinClick, singleJob = false }: JobMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "nodata">("loading");

  useEffect(() => {
    if (!mapContainerRef.current || workLogs.length === 0) {
      setStatus("nodata");
      return;
    }

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

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
        scrollWheelZoom: !singleJob,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Geocode all unique city+state+zip combos
      const geocodeCache = new Map<string, { lat: number; lng: number } | null>();
      const pins: MapPin[] = [];

      for (const wl of workLogs) {
        const key = `${wl.city},${wl.state},${wl.zipCode}`;
        if (!geocodeCache.has(key)) {
          geocodeCache.set(key, await geocodeAddress(wl.city, wl.state, wl.zipCode));
        }
        const coords = geocodeCache.get(key);
        if (coords) pins.push({ ...coords, workLog: wl });
      }

      if (cancelled) return;

      if (pins.length === 0) {
        setStatus("nodata");
        return;
      }

      // Cluster pins at same location
      const grouped = new Map<string, MapPin[]>();
      for (const p of pins) {
        const k = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
        if (!grouped.has(k)) grouped.set(k, []);
        grouped.get(k)!.push(p);
      }

      markersRef.current = [];
      const bounds: [number, number][] = [];

      for (const group of Array.from(grouped.values())) {
        const { lat, lng, workLog } = group[0];
        bounds.push([lat, lng]);
        const color = getColor(workLog.workType);
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
                <div style="font-weight:600;font-size:13px">${j.customerName}</div>
                <div style="font-size:11px;color:#6b7280">${j.workType} · ${j.serviceDate}</div>
                <div style="font-size:11px;color:#6b7280">${j.locationName}</div>
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

        markersRef.current.push(marker);
      }

      if (bounds.length === 1) {
        map.setView(bounds[0], 13);
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
  }, [workLogs, singleJob]);

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-border ${className || ''}`}
      style={height ? { height } : undefined}
    >
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-muted/80 gap-3">
          <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading map…</p>
        </div>
      )}
      {status === "nodata" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
          <i className="fas fa-map-marked-alt text-3xl text-muted-foreground"></i>
          <p className="text-sm text-muted-foreground">No location data available</p>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
