import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Annotation type for photo markup
export type PhotoAnnotation = {
  id: string;
  type: "arrow" | "circle" | "rectangle" | "text" | "freehand";
  coordinates: number[]; // [x1, y1, x2, y2] or path points for freehand
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
};

// Photo metadata type for GPS-tagged images
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

// Form photo value - stored in form responses for photo fields
export type FormPhotoValue = {
  url: string;
  jobPhotoId?: string;           // Reference to job_photos record
  lat?: number;
  lng?: number;
  accuracy?: number;
  altitude?: number;
  capturedAt: string;
  hasExif?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'mismatch';
  distanceFromJob?: number;
};

// Form field types for dynamic forms
export type FormFieldType =
  | "text" | "textarea" | "number" | "date" | "time"
  | "select" | "multiselect" | "checkbox" | "radio"
  | "photo" | "signature" | "gps";

// Photo field configuration for GPS-verified photos
export type PhotoFieldConfig = {
  gpsRequired?: boolean;           // Must capture with GPS
  verifyLocation?: boolean;        // Verify against job site
  verificationRadius?: number;     // Distance threshold in meters (default 100)
  minPhotos?: number;              // Minimum required (default 0)
  maxPhotos?: number;              // Maximum allowed (default 5)
  classification?: 'before' | 'after' | 'general';  // For reporting/comparison
};

// Form field definition
export type FormFieldDefinition = {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[]; // for select/radio/checkbox
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  photoConfig?: PhotoFieldConfig;  // Only applies when type === 'photo'
};

// Logic rule for conditional form behavior
export type FormLogicRule = {
  id: string;
  condition: {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty";
    value?: string | number | boolean;
  };
  action: {
    type: "show" | "hide" | "require" | "unrequire" | "create_task";
    target: string; // field id or task template name
    taskDetails?: {
      title: string;
      description?: string;
    };
  };
};

// Form schema structure
export type FormSchema = {
  fields: FormFieldDefinition[];
  sections?: { id: string; title: string; fieldIds: string[] }[];
};

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Google Calendar OAuth tokens
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiresAt: text("google_token_expires_at"),
  googleCalendarId: text("google_calendar_id"), // Selected calendar to sync with
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business table
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  overview: text("overview"),
  hoursOfOperation: json("hours_of_operation").$type<Record<string, { open: string; close: string; closed: boolean }>>(),
  brandColor: text("brand_color"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business members table (employees)
export const businessMembers = pgTable("business_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("technician"),
  title: varchar("title", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  inviteToken: varchar("invite_token", { length: 64 }),
  inviteSentAt: timestamp("invite_sent_at"),
  inviteAcceptedAt: timestamp("invite_accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  vendorKey: varchar("vendor_key", { length: 50 }), // Unique identifier/code
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  lat: text("lat"), // Latitude for route optimization
  lng: text("lng"), // Longitude for route optimization
  servicesProvided: json("services_provided").$type<string[]>().default([]),
  regionsServed: json("regions_served").$type<string[]>().default([]),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  insuranceExpiry: text("insurance_expiry"),
  licenseNumber: text("license_number"),
  licenseExpiry: text("license_expiry"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table (job sites / property containers)
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  propertyName: text("property_name").notNull(),
  customerName: text("customer_name").notNull(),
  propertyType: text("property_type").notNull().default("residential"), // residential, commercial
  locationName: text("location_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing items (business rate card / catalog)
export const pricingItems = pgTable("pricing_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  category: text("category").notNull().default("General"),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull().default("each"),
  unitPrice: text("unit_price").notNull().default("0"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Estimates table
export const estimates = pgTable("estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  propertyId: varchar("property_id").references(() => properties.id),
  title: text("title").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  validUntil: text("valid_until"),
  taxRate: text("tax_rate").notNull().default("0"),
  discountAmount: text("discount_amount").notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Estimate line items table
export const estimateLineItems = pgTable("estimate_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  estimateId: varchar("estimate_id").notNull().references(() => estimates.id),
  pricingItemId: varchar("pricing_item_id").references(() => pricingItems.id),
  description: text("description").notNull(),
  quantity: text("quantity").notNull().default("1"),
  unit: text("unit").notNull().default("each"),
  unitPrice: text("unit_price").notNull().default("0"),
  sortOrder: text("sort_order").notNull().default("0"),
});

// API clients table (developer access)
export const apiClients = pgTable("api_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  clientId: text("client_id").notNull().unique(),
  clientSecretHash: text("client_secret_hash").notNull(),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recurring schedules table (templates for generating recurring jobs)
export const recurringSchedules = pgTable("recurring_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  propertyId: varchar("property_id").references(() => properties.id),
  // Job details
  customerName: text("customer_name").notNull(),
  workType: text("work_type").notNull(),
  locationName: text("location_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  workDescription: text("work_description").notNull(),
  notes: text("notes"),
  // Assigned technicians
  technicianUserIds: json("technician_user_ids").$type<string[]>().default([]),
  // Schedule time (HH:mm format)
  scheduledTime: text("scheduled_time").notNull(),
  estimatedDurationMinutes: text("estimated_duration_minutes").default("60"),
  // Recurrence pattern
  frequency: text("frequency").notNull(), // daily, weekly, monthly
  interval: text("interval").notNull().default("1"), // every N days/weeks/months
  daysOfWeek: json("days_of_week").$type<number[]>().default([]), // 0=Sunday, 6=Saturday (for weekly)
  dayOfMonth: text("day_of_month"), // 1-31 or "last" (for monthly)
  // Date range
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date"), // YYYY-MM-DD (optional)
  maxOccurrences: text("max_occurrences"), // optional limit
  // State
  isActive: text("is_active").notNull().default("true"),
  lastGeneratedDate: text("last_generated_date"), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Work logs table
export const workLogs = pgTable("work_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  propertyId: varchar("property_id").references(() => properties.id),
  technicianUserId: varchar("technician_user_id").notNull().references(() => users.id),
  customerName: text("customer_name").notNull(),
  workType: text("work_type").notNull(),
  locationName: text("location_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  serviceDate: text("service_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  workPerformed: text("work_performed").notNull(),
  additionalNotes: text("additional_notes"),
  status: text("status").notNull().default("completed"), // scheduled, in-progress, completed, cancelled
  technicianUserIds: json("technician_user_ids").$type<string[]>().default([]),
  imageUrls: json("image_urls").$type<string[]>().default([]),
  pdfUrls: json("pdf_urls").$type<string[]>().default([]),
  photoMetadata: json("photo_metadata").$type<PhotoMeta[]>().default([]),
  checkInTime: text("check_in_time"),
  checkOutTime: text("check_out_time"),
  checkInLat: text("check_in_lat"),
  checkInLng: text("check_in_lng"),
  checkOutLat: text("check_out_lat"),
  checkOutLng: text("check_out_lng"),
  // Scheduling fields
  scheduledStartTime: text("scheduled_start_time"), // ISO datetime for scheduled start
  scheduledEndTime: text("scheduled_end_time"), // ISO datetime for scheduled end
  recurringScheduleId: varchar("recurring_schedule_id").references(() => recurringSchedules.id),
  isRecurrenceInstance: text("is_recurrence_instance").default("false"), // flag for auto-generated jobs
  // Google Calendar integration
  googleCalendarEventId: text("google_calendar_event_id"),
  googleCalendarSyncedAt: text("google_calendar_synced_at"),
  // Customer confirmation
  customerConfirmed: text("customer_confirmed").notNull().default("false"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Form templates table (dynamic conditional forms)
export const formTemplates = pgTable("form_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  description: text("description"),
  workType: text("work_type"), // linked to specific work type or null for all
  schema: json("schema").$type<FormSchema>().notNull(),
  logicRules: json("logic_rules").$type<FormLogicRule[]>().default([]),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Form submissions (linked to work logs)
export const formSubmissions = pgTable("form_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workLogId: varchar("work_log_id").notNull().references(() => workLogs.id),
  templateId: varchar("template_id").notNull().references(() => formTemplates.id),
  responses: json("responses").$type<Record<string, unknown>>().notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Work log tasks (sub-tasks created from forms or manually)
export const workLogTasks = pgTable("work_log_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workLogId: varchar("work_log_id").notNull().references(() => workLogs.id),
  parentTaskId: varchar("parent_task_id").references((): any => workLogTasks.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  priority: text("priority").default("normal"), // low, normal, high, urgent
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  dueDate: text("due_date"),
  createdFromForm: varchar("created_from_form").references(() => formSubmissions.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Zod schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateBusinessSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  overview: z.string().optional(),
  hoursOfOperation: z.record(z.object({ open: z.string(), close: z.string(), closed: z.boolean() })).optional(),
  brandColor: z.string().optional(),
  logoUrl: z.string().optional(),
});
export const insertBusinessMemberSchema = createInsertSchema(businessMembers).omit({
  id: true,
  createdAt: true,
});
export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateVendorSchema = insertVendorSchema.partial();
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updatePropertySchema = insertPropertySchema.partial();

export const insertPricingItemSchema = createInsertSchema(pricingItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updatePricingItemSchema = insertPricingItemSchema.partial();

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateEstimateSchema = insertEstimateSchema.partial();

export const insertEstimateLineItemSchema = createInsertSchema(estimateLineItems).omit({
  id: true,
});
export const updateEstimateLineItemSchema = insertEstimateLineItemSchema.partial();

export const insertWorkLogSchema = createInsertSchema(workLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateWorkLogSchema = insertWorkLogSchema.partial();

export const insertRecurringScheduleSchema = createInsertSchema(recurringSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateRecurringScheduleSchema = insertRecurringScheduleSchema.partial();

export const insertFormTemplateSchema = createInsertSchema(formTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateFormTemplateSchema = insertFormTemplateSchema.partial();

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertWorkLogTaskSchema = createInsertSchema(workLogTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export const updateWorkLogTaskSchema = insertWorkLogTaskSchema.partial();

// Work log status enum for type safety
export const workLogStatusSchema = z.enum(["scheduled", "in-progress", "completed", "cancelled"]);
export type WorkLogStatus = z.infer<typeof workLogStatusSchema>;

// Recurrence frequency enum
export const recurrenceFrequencySchema = z.enum(["daily", "weekly", "monthly"]);
export type RecurrenceFrequency = z.infer<typeof recurrenceFrequencySchema>;

// TypeScript types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type UpdateBusiness = z.infer<typeof updateBusinessSchema>;
export type BusinessMember = typeof businessMembers.$inferSelect;
export type InsertBusinessMember = z.infer<typeof insertBusinessMemberSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type UpdateVendor = z.infer<typeof updateVendorSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type UpdateProperty = z.infer<typeof updatePropertySchema>;
export type PricingItem = typeof pricingItems.$inferSelect;
export type InsertPricingItem = z.infer<typeof insertPricingItemSchema>;
export type UpdatePricingItem = z.infer<typeof updatePricingItemSchema>;
export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type UpdateEstimate = z.infer<typeof updateEstimateSchema>;
export type EstimateLineItem = typeof estimateLineItems.$inferSelect;
export type InsertEstimateLineItem = z.infer<typeof insertEstimateLineItemSchema>;
export type UpdateEstimateLineItem = z.infer<typeof updateEstimateLineItemSchema>;
export type ApiClient = typeof apiClients.$inferSelect;
export type WorkLog = typeof workLogs.$inferSelect;
export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type UpdateWorkLog = z.infer<typeof updateWorkLogSchema>;
export type RecurringSchedule = typeof recurringSchedules.$inferSelect;
export type InsertRecurringSchedule = z.infer<typeof insertRecurringScheduleSchema>;
export type UpdateRecurringSchedule = z.infer<typeof updateRecurringScheduleSchema>;
export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;
export type UpdateFormTemplate = z.infer<typeof updateFormTemplateSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type WorkLogTask = typeof workLogTasks.$inferSelect;
export type InsertWorkLogTask = z.infer<typeof insertWorkLogTaskSchema>;
export type UpdateWorkLogTask = z.infer<typeof updateWorkLogTaskSchema>;

// Task status enum
export const taskStatusSchema = z.enum(["pending", "in_progress", "completed", "cancelled"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;
