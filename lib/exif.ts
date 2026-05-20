import piexif from 'piexifjs';

interface GPSData {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy?: number;
}

interface ExifOptions {
  gps?: GPSData;
  timestamp?: Date;
  make?: string;
  model?: string;
  software?: string;
}

/**
 * Convert decimal degrees to degrees, minutes, seconds format for EXIF
 */
function decimalToDMS(decimal: number): [[number, number], [number, number], [number, number]] {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60 * 100); // Multiply by 100 for precision

  return [
    [degrees, 1],
    [minutes, 1],
    [seconds, 100],
  ];
}

/**
 * Embed GPS coordinates and timestamp into a JPEG image
 * Returns a new Blob with EXIF data embedded
 */
export async function embedExifData(
  imageBlob: Blob,
  options: ExifOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;

        // Check if it's a JPEG
        if (!dataUrl.startsWith('data:image/jpeg')) {
          // For non-JPEG images, return as-is (EXIF only works with JPEG)
          resolve(imageBlob);
          return;
        }

        // Build EXIF data structure
        const exifObj: Record<string, Record<string, unknown>> = {
          '0th': {},
          'Exif': {},
          'GPS': {},
          '1st': {},
        };

        // Add timestamp
        const timestamp = options.timestamp || new Date();
        const dateTimeStr = formatExifDateTime(timestamp);
        exifObj['0th'][piexif.ImageIFD.DateTime] = dateTimeStr;
        exifObj['Exif'][piexif.ExifIFD.DateTimeOriginal] = dateTimeStr;
        exifObj['Exif'][piexif.ExifIFD.DateTimeDigitized] = dateTimeStr;

        // Add software/device info
        if (options.software) {
          exifObj['0th'][piexif.ImageIFD.Software] = options.software;
        } else {
          exifObj['0th'][piexif.ImageIFD.Software] = 'FieldService GPS Camera';
        }

        if (options.make) {
          exifObj['0th'][piexif.ImageIFD.Make] = options.make;
        }

        if (options.model) {
          exifObj['0th'][piexif.ImageIFD.Model] = options.model;
        }

        // Add GPS data
        if (options.gps) {
          const { lat, lng, altitude } = options.gps;

          // GPS Version
          exifObj['GPS'][piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0];

          // Latitude
          exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S';
          exifObj['GPS'][piexif.GPSIFD.GPSLatitude] = decimalToDMS(lat);

          // Longitude
          exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W';
          exifObj['GPS'][piexif.GPSIFD.GPSLongitude] = decimalToDMS(lng);

          // Altitude (if available)
          if (altitude !== undefined) {
            exifObj['GPS'][piexif.GPSIFD.GPSAltitudeRef] = altitude >= 0 ? 0 : 1;
            exifObj['GPS'][piexif.GPSIFD.GPSAltitude] = [Math.abs(Math.round(altitude * 100)), 100];
          }

          // GPS timestamp
          const gpsDate = formatGPSDate(timestamp);
          const gpsTime = formatGPSTime(timestamp);
          exifObj['GPS'][piexif.GPSIFD.GPSDateStamp] = gpsDate;
          exifObj['GPS'][piexif.GPSIFD.GPSTimeStamp] = gpsTime;

          // Map datum
          exifObj['GPS'][piexif.GPSIFD.GPSMapDatum] = 'WGS-84';
        }

        // Convert to binary string
        const exifBytes = piexif.dump(exifObj);

        // Insert EXIF into image
        const newDataUrl = piexif.insert(exifBytes, dataUrl);

        // Convert back to Blob
        const newBlob = dataURLtoBlob(newDataUrl);
        resolve(newBlob);
      } catch (error) {
        console.error('Error embedding EXIF data:', error);
        // Return original blob if EXIF embedding fails
        resolve(imageBlob);
      }
    };

    reader.onerror = () => {
      console.error('Error reading image for EXIF embedding');
      resolve(imageBlob);
    };

    reader.readAsDataURL(imageBlob);
  });
}

/**
 * Format date for EXIF DateTime fields (YYYY:MM:DD HH:MM:SS)
 */
function formatExifDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}:${pad(date.getMonth() + 1)}:${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Format date for GPS DateStamp (YYYY:MM:DD)
 */
function formatGPSDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}:${pad(date.getMonth() + 1)}:${pad(date.getDate())}`;
}

/**
 * Format time for GPS TimeStamp as rational array
 */
function formatGPSTime(date: Date): [[number, number], [number, number], [number, number]] {
  return [
    [date.getUTCHours(), 1],
    [date.getUTCMinutes(), 1],
    [date.getUTCSeconds(), 1],
  ];
}

/**
 * Convert data URL to Blob
 */
function dataURLtoBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Extract GPS data from an image's EXIF (for verification)
 */
export function extractExifGPS(dataUrl: string): GPSData | null {
  try {
    const exifObj = piexif.load(dataUrl);

    if (!exifObj['GPS'] || Object.keys(exifObj['GPS']).length === 0) {
      return null;
    }

    const gps = exifObj['GPS'];

    // Extract latitude
    const latRef = gps[piexif.GPSIFD.GPSLatitudeRef] as string | undefined;
    const latDMS = gps[piexif.GPSIFD.GPSLatitude] as [[number, number], [number, number], [number, number]] | undefined;
    if (!latRef || !latDMS) return null;

    const lat = dmsToDecimal(latDMS, latRef === 'S');

    // Extract longitude
    const lngRef = gps[piexif.GPSIFD.GPSLongitudeRef] as string | undefined;
    const lngDMS = gps[piexif.GPSIFD.GPSLongitude] as [[number, number], [number, number], [number, number]] | undefined;
    if (!lngRef || !lngDMS) return null;

    const lng = dmsToDecimal(lngDMS, lngRef === 'W');

    // Extract altitude (optional)
    let altitude: number | undefined;
    const altRef = gps[piexif.GPSIFD.GPSAltitudeRef] as number | undefined;
    const altValue = gps[piexif.GPSIFD.GPSAltitude] as [number, number] | undefined;
    if (altValue) {
      altitude = altValue[0] / altValue[1];
      if (altRef === 1) altitude = -altitude;
    }

    return { lat, lng, altitude };
  } catch (error) {
    console.error('Error extracting EXIF GPS:', error);
    return null;
  }
}

/**
 * Convert DMS array to decimal degrees
 */
function dmsToDecimal(
  dms: [[number, number], [number, number], [number, number]],
  negative: boolean
): number {
  const degrees = dms[0][0] / dms[0][1];
  const minutes = dms[1][0] / dms[1][1];
  const seconds = dms[2][0] / dms[2][1];

  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (negative) decimal = -decimal;

  return decimal;
}

/**
 * Calculate distance between two GPS points in meters (Haversine formula)
 */
export function calculateDistance(
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
