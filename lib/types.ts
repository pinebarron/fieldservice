// Database types for Supabase tables

export type PhotoAnnotation = {
  id: string;
  type: "arrow" | "circle" | "rectangle" | "text" | "freehand";
  coordinates: number[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
};

export type PhotoMeta = {
  url: string;
  type: "before" | "after" | "general";
  lat?: number;
  lng?: number;
  address?: string;
  capturedAt: string;
  technicianName?: string;
  annotations?: PhotoAnnotation[];
};

export type User = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Business = {
  id: string;
  name: string;
  ownerId: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  overview: string | null;
  hoursOfOperation: Record<string, { open: string; close: string; closed: boolean }> | null;
  brandColor: string | null;
  logoUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BusinessMember = {
  id: string;
  businessId: string;
  userId: string;
  role: string;
  createdAt: string | null;
};

export type Property = {
  id: string;
  businessId: string;
  propertyName: string;
  customerName: string;
  locationName: string;
  city: string;
  state: string;
  zipCode: string;
  status: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type WorkLog = {
  id: string;
  businessId: string;
  propertyId: string | null;
  technicianUserId: string;
  customerName: string;
  workType: string;
  locationName: string;
  city: string;
  state: string;
  zipCode: string;
  serviceDate: string;
  startTime: string | null;
  endTime: string | null;
  workPerformed: string;
  additionalNotes: string | null;
  status: string;
  technicianUserIds: string[] | null;
  imageUrls: string[] | null;
  pdfUrls: string[] | null;
  photoMetadata: PhotoMeta[] | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLat: string | null;
  checkInLng: string | null;
  checkOutLat: string | null;
  checkOutLng: string | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  recurringScheduleId: string | null;
  isRecurrenceInstance: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Joined data
  technician?: User;
};

export type Estimate = {
  id: string;
  businessId: string;
  propertyId: string | null;
  title: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  description: string | null;
  status: string;
  validUntil: string | null;
  taxRate: string;
  discountAmount: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Vendor = {
  id: string;
  businessId: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  servicesProvided: string[] | null;
  regionsServed: string[] | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiry: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  notes: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PricingItem = {
  id: string;
  businessId: string;
  category: string;
  name: string;
  description: string | null;
  unit: string;
  unitPrice: string;
  isActive: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RecurringSchedule = {
  id: string;
  businessId: string;
  propertyId: string | null;
  customerName: string;
  workType: string;
  locationName: string;
  city: string;
  state: string;
  zipCode: string;
  workDescription: string;
  notes: string | null;
  technicianUserIds: string[] | null;
  scheduledTime: string;
  estimatedDurationMinutes: string | null;
  frequency: string;
  interval: string;
  daysOfWeek: number[] | null;
  dayOfMonth: string | null;
  startDate: string;
  endDate: string | null;
  maxOccurrences: string | null;
  isActive: string;
  lastGeneratedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Stats = {
  totalJobs: number;
  weekJobs: number;
  thisMonthJobs: number;
  images: number;
  reports: number;
};
