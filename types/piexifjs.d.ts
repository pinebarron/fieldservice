declare module 'piexifjs' {
  interface ExifIFD {
    DateTimeOriginal: number;
    DateTimeDigitized: number;
    [key: string]: number;
  }

  interface ImageIFD {
    Make: number;
    Model: number;
    Software: number;
    DateTime: number;
    [key: string]: number;
  }

  interface GPSIFD {
    GPSVersionID: number;
    GPSLatitudeRef: number;
    GPSLatitude: number;
    GPSLongitudeRef: number;
    GPSLongitude: number;
    GPSAltitudeRef: number;
    GPSAltitude: number;
    GPSTimeStamp: number;
    GPSDateStamp: number;
    GPSMapDatum: number;
    [key: string]: number;
  }

  const ImageIFD: ImageIFD;
  const ExifIFD: ExifIFD;
  const GPSIFD: GPSIFD;

  function load(data: string): Record<string, Record<string, unknown>>;
  function dump(exifObj: Record<string, Record<string, unknown>>): string;
  function insert(exifBytes: string, dataUrl: string): string;
  function remove(dataUrl: string): string;
}
