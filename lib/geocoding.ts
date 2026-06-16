/**
 * Geocoding service for converting addresses to coordinates
 * Uses OpenStreetMap Nominatim (free, no API key required)
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName?: string;
  source: 'nominatim' | 'cache' | 'manual';
}

export interface AddressInput {
  locationName?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

// Simple in-memory cache for geocoding results (server-side)
const geocodeCache = new Map<string, GeocodingResult>();

/**
 * Generate a cache key from address components
 */
function getCacheKey(address: AddressInput): string {
  return `${address.city}-${address.state}-${address.zipCode}`.toLowerCase();
}

/**
 * Geocode an address using OpenStreetMap Nominatim
 * Rate limit: 1 request per second (enforced by caller)
 */
export async function geocodeAddress(address: AddressInput): Promise<GeocodingResult | null> {
  const cacheKey = getCacheKey(address);

  // Check cache first
  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  const { locationName, city, state, zipCode, country = 'USA' } = address;

  // Try multiple query formats for better results
  const queries = [
    locationName ? `${locationName}, ${city}, ${state} ${zipCode}, ${country}` : null,
    `${city}, ${state} ${zipCode}, ${country}`,
    `${zipCode}, ${country}`,
    `${city}, ${state}, ${country}`,
  ].filter(Boolean) as string[];

  for (const query of queries) {
    try {
      const encoded = encodeURIComponent(query);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=us`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'Crewatt/1.0 (job-site-geocoding)',
          },
        }
      );

      if (!response.ok) {
        console.error(`Geocoding request failed: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result: GeocodingResult = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          source: 'nominatim',
        };

        // Cache the result
        geocodeCache.set(cacheKey, result);

        return result;
      }
    } catch (error) {
      console.error(`Geocoding error for query "${query}":`, error);
    }
  }

  return null;
}

/**
 * Batch geocode multiple addresses with rate limiting
 * Nominatim requires max 1 request/second
 */
export async function batchGeocodeAddresses(
  addresses: Array<{ id: string; address: AddressInput }>,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>();

  for (let i = 0; i < addresses.length; i++) {
    const { id, address } = addresses[i];

    // Rate limit: wait 1 second between requests
    if (i > 0) {
      await sleep(1000);
    }

    const result = await geocodeAddress(address);
    results.set(id, result);

    if (onProgress) {
      onProgress(i + 1, addresses.length);
    }
  }

  return results;
}

/**
 * Calculate distance between two coordinates in meters
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if coordinates are within a radius of a target location
 */
export function isWithinRadius(
  photoLat: number,
  photoLng: number,
  jobLat: number,
  jobLng: number,
  radiusMeters: number = 100
): boolean {
  const distance = calculateDistanceMeters(photoLat, photoLng, jobLat, jobLng);
  return distance <= radiusMeters;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
