import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Photo metadata type for GPS-tagged images
export type PhotoMeta = {
  url: string;
  type: "before" | "after" | "general";
  lat?: number;
  lng?: number;
  address?: string;
  capturedAt: string;
  technicianName?: string;
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
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
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
  status: text("status").notNull().default("completed"),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export type WorkLog = typeof workLogs.$inferSelect;
export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type UpdateWorkLog = z.infer<typeof updateWorkLogSchema>;
