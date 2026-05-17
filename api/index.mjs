var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  apiClients: () => apiClients,
  businessMembers: () => businessMembers,
  businesses: () => businesses,
  estimateLineItems: () => estimateLineItems,
  estimates: () => estimates,
  formSubmissions: () => formSubmissions,
  formTemplates: () => formTemplates,
  insertBusinessMemberSchema: () => insertBusinessMemberSchema,
  insertBusinessSchema: () => insertBusinessSchema,
  insertEstimateLineItemSchema: () => insertEstimateLineItemSchema,
  insertEstimateSchema: () => insertEstimateSchema,
  insertFormSubmissionSchema: () => insertFormSubmissionSchema,
  insertFormTemplateSchema: () => insertFormTemplateSchema,
  insertPricingItemSchema: () => insertPricingItemSchema,
  insertPropertySchema: () => insertPropertySchema,
  insertRecurringScheduleSchema: () => insertRecurringScheduleSchema,
  insertVendorSchema: () => insertVendorSchema,
  insertWorkLogSchema: () => insertWorkLogSchema,
  insertWorkLogTaskSchema: () => insertWorkLogTaskSchema,
  pricingItems: () => pricingItems,
  properties: () => properties,
  recurrenceFrequencySchema: () => recurrenceFrequencySchema,
  recurringSchedules: () => recurringSchedules,
  sessions: () => sessions,
  taskStatusSchema: () => taskStatusSchema,
  updateBusinessSchema: () => updateBusinessSchema,
  updateEstimateLineItemSchema: () => updateEstimateLineItemSchema,
  updateEstimateSchema: () => updateEstimateSchema,
  updateFormTemplateSchema: () => updateFormTemplateSchema,
  updatePricingItemSchema: () => updatePricingItemSchema,
  updatePropertySchema: () => updatePropertySchema,
  updateRecurringScheduleSchema: () => updateRecurringScheduleSchema,
  updateVendorSchema: () => updateVendorSchema,
  updateWorkLogSchema: () => updateWorkLogSchema,
  updateWorkLogTaskSchema: () => updateWorkLogTaskSchema,
  upsertUserSchema: () => upsertUserSchema,
  users: () => users,
  vendors: () => vendors,
  workLogStatusSchema: () => workLogStatusSchema,
  workLogTasks: () => workLogTasks,
  workLogs: () => workLogs
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions, users, businesses, businessMembers, vendors, properties, pricingItems, estimates, estimateLineItems, apiClients, recurringSchedules, workLogs, formTemplates, formSubmissions, workLogTasks, upsertUserSchema, insertBusinessSchema, updateBusinessSchema, insertBusinessMemberSchema, insertVendorSchema, updateVendorSchema, insertPropertySchema, updatePropertySchema, insertPricingItemSchema, updatePricingItemSchema, insertEstimateSchema, updateEstimateSchema, insertEstimateLineItemSchema, updateEstimateLineItemSchema, insertWorkLogSchema, updateWorkLogSchema, insertRecurringScheduleSchema, updateRecurringScheduleSchema, insertFormTemplateSchema, updateFormTemplateSchema, insertFormSubmissionSchema, insertWorkLogTaskSchema, updateWorkLogTaskSchema, workLogStatusSchema, recurrenceFrequencySchema, taskStatusSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: json("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique(),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      // Google Calendar OAuth tokens
      googleAccessToken: text("google_access_token"),
      googleRefreshToken: text("google_refresh_token"),
      googleTokenExpiresAt: text("google_token_expires_at"),
      googleCalendarId: text("google_calendar_id"),
      // Selected calendar to sync with
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    businesses = pgTable("businesses", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      ownerId: varchar("owner_id").notNull().references(() => users.id),
      address: text("address"),
      city: text("city"),
      state: text("state"),
      zipCode: text("zip_code"),
      phone: text("phone"),
      overview: text("overview"),
      hoursOfOperation: json("hours_of_operation").$type(),
      brandColor: text("brand_color"),
      logoUrl: text("logo_url"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    businessMembers = pgTable("business_members", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      businessId: varchar("business_id").notNull().references(() => businesses.id),
      userId: varchar("user_id").notNull().references(() => users.id),
      role: text("role").notNull().default("technician"),
      createdAt: timestamp("created_at").defaultNow()
    });
    vendors = pgTable("vendors", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      businessId: varchar("business_id").notNull().references(() => businesses.id),
      name: text("name").notNull(),
      contactName: text("contact_name"),
      contactEmail: text("contact_email"),
      contactPhone: text("contact_phone"),
      servicesProvided: json("services_provided").$type().default([]),
      regionsServed: json("regions_served").$type().default([]),
      insuranceProvider: text("insurance_provider"),
      insurancePolicyNumber: text("insurance_policy_number"),
      insuranceExpiry: text("insurance_expiry"),
      licenseNumber: text("license_number"),
      licenseExpiry: text("license_expiry"),
      notes: text("notes"),
      status: text("status").notNull().default("active"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    properties = pgTable("properties", {
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    pricingItems = pgTable("pricing_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      businessId: varchar("business_id").notNull().references(() => businesses.id),
      category: text("category").notNull().default("General"),
      name: text("name").notNull(),
      description: text("description"),
      unit: text("unit").notNull().default("each"),
      unitPrice: text("unit_price").notNull().default("0"),
      isActive: text("is_active").notNull().default("true"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    estimates = pgTable("estimates", {
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    estimateLineItems = pgTable("estimate_line_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      estimateId: varchar("estimate_id").notNull().references(() => estimates.id),
      pricingItemId: varchar("pricing_item_id").references(() => pricingItems.id),
      description: text("description").notNull(),
      quantity: text("quantity").notNull().default("1"),
      unit: text("unit").notNull().default("each"),
      unitPrice: text("unit_price").notNull().default("0"),
      sortOrder: text("sort_order").notNull().default("0")
    });
    apiClients = pgTable("api_clients", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      businessId: varchar("business_id").notNull().references(() => businesses.id),
      name: text("name").notNull(),
      clientId: text("client_id").notNull().unique(),
      clientSecretHash: text("client_secret_hash").notNull(),
      isActive: text("is_active").notNull().default("true"),
      createdAt: timestamp("created_at").defaultNow()
    });
    recurringSchedules = pgTable("recurring_schedules", {
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
      technicianUserIds: json("technician_user_ids").$type().default([]),
      // Schedule time (HH:mm format)
      scheduledTime: text("scheduled_time").notNull(),
      estimatedDurationMinutes: text("estimated_duration_minutes").default("60"),
      // Recurrence pattern
      frequency: text("frequency").notNull(),
      // daily, weekly, monthly
      interval: text("interval").notNull().default("1"),
      // every N days/weeks/months
      daysOfWeek: json("days_of_week").$type().default([]),
      // 0=Sunday, 6=Saturday (for weekly)
      dayOfMonth: text("day_of_month"),
      // 1-31 or "last" (for monthly)
      // Date range
      startDate: text("start_date").notNull(),
      // YYYY-MM-DD
      endDate: text("end_date"),
      // YYYY-MM-DD (optional)
      maxOccurrences: text("max_occurrences"),
      // optional limit
      // State
      isActive: text("is_active").notNull().default("true"),
      lastGeneratedDate: text("last_generated_date"),
      // YYYY-MM-DD
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    workLogs = pgTable("work_logs", {
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
      // scheduled, in-progress, completed, cancelled
      technicianUserIds: json("technician_user_ids").$type().default([]),
      imageUrls: json("image_urls").$type().default([]),
      pdfUrls: json("pdf_urls").$type().default([]),
      photoMetadata: json("photo_metadata").$type().default([]),
      checkInTime: text("check_in_time"),
      checkOutTime: text("check_out_time"),
      checkInLat: text("check_in_lat"),
      checkInLng: text("check_in_lng"),
      checkOutLat: text("check_out_lat"),
      checkOutLng: text("check_out_lng"),
      // Scheduling fields
      scheduledStartTime: text("scheduled_start_time"),
      // ISO datetime for scheduled start
      scheduledEndTime: text("scheduled_end_time"),
      // ISO datetime for scheduled end
      recurringScheduleId: varchar("recurring_schedule_id").references(() => recurringSchedules.id),
      isRecurrenceInstance: text("is_recurrence_instance").default("false"),
      // flag for auto-generated jobs
      // Google Calendar integration
      googleCalendarEventId: text("google_calendar_event_id"),
      googleCalendarSyncedAt: text("google_calendar_synced_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    formTemplates = pgTable("form_templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      businessId: varchar("business_id").notNull().references(() => businesses.id),
      name: text("name").notNull(),
      description: text("description"),
      workType: text("work_type"),
      // linked to specific work type or null for all
      schema: json("schema").$type().notNull(),
      logicRules: json("logic_rules").$type().default([]),
      isActive: text("is_active").notNull().default("true"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    formSubmissions = pgTable("form_submissions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      workLogId: varchar("work_log_id").notNull().references(() => workLogs.id),
      templateId: varchar("template_id").notNull().references(() => formTemplates.id),
      responses: json("responses").$type().notNull(),
      submittedAt: timestamp("submitted_at").defaultNow()
    });
    workLogTasks = pgTable("work_log_tasks", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      workLogId: varchar("work_log_id").notNull().references(() => workLogs.id),
      parentTaskId: varchar("parent_task_id").references(() => workLogTasks.id),
      title: text("title").notNull(),
      description: text("description"),
      status: text("status").notNull().default("pending"),
      // pending, in_progress, completed, cancelled
      priority: text("priority").default("normal"),
      // low, normal, high, urgent
      assignedUserId: varchar("assigned_user_id").references(() => users.id),
      dueDate: text("due_date"),
      createdFromForm: varchar("created_from_form").references(() => formSubmissions.id),
      createdAt: timestamp("created_at").defaultNow(),
      completedAt: timestamp("completed_at")
    });
    upsertUserSchema = createInsertSchema(users);
    insertBusinessSchema = createInsertSchema(businesses).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateBusinessSchema = z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      phone: z.string().optional(),
      overview: z.string().optional(),
      hoursOfOperation: z.record(z.object({ open: z.string(), close: z.string(), closed: z.boolean() })).optional(),
      brandColor: z.string().optional(),
      logoUrl: z.string().optional()
    });
    insertBusinessMemberSchema = createInsertSchema(businessMembers).omit({
      id: true,
      createdAt: true
    });
    insertVendorSchema = createInsertSchema(vendors).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateVendorSchema = insertVendorSchema.partial();
    insertPropertySchema = createInsertSchema(properties).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updatePropertySchema = insertPropertySchema.partial();
    insertPricingItemSchema = createInsertSchema(pricingItems).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updatePricingItemSchema = insertPricingItemSchema.partial();
    insertEstimateSchema = createInsertSchema(estimates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateEstimateSchema = insertEstimateSchema.partial();
    insertEstimateLineItemSchema = createInsertSchema(estimateLineItems).omit({
      id: true
    });
    updateEstimateLineItemSchema = insertEstimateLineItemSchema.partial();
    insertWorkLogSchema = createInsertSchema(workLogs).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateWorkLogSchema = insertWorkLogSchema.partial();
    insertRecurringScheduleSchema = createInsertSchema(recurringSchedules).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateRecurringScheduleSchema = insertRecurringScheduleSchema.partial();
    insertFormTemplateSchema = createInsertSchema(formTemplates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateFormTemplateSchema = insertFormTemplateSchema.partial();
    insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
      id: true,
      submittedAt: true
    });
    insertWorkLogTaskSchema = createInsertSchema(workLogTasks).omit({
      id: true,
      createdAt: true,
      completedAt: true
    });
    updateWorkLogTaskSchema = insertWorkLogTaskSchema.partial();
    workLogStatusSchema = z.enum(["scheduled", "in-progress", "completed", "cancelled"]);
    recurrenceFrequencySchema = z.enum(["daily", "weekly", "monthly"]);
    taskStatusSchema = z.enum(["pending", "in_progress", "completed", "cancelled"]);
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db
});
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
var client, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    client = postgres(process.env.DATABASE_URL, { prepare: false });
    db = drizzle(client, { schema: schema_exports });
  }
});

// server/storage.ts
import crypto2 from "crypto";
import { eq, and, desc, sql as sql2, ilike, or, isNull } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      // User operations
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      }
      async createUser(userData) {
        const [user] = await db.insert(users).values(userData).returning();
        return user;
      }
      async upsertUser(userData) {
        const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return user;
      }
      // Business operations
      async createBusiness(businessData) {
        const [business] = await db.insert(businesses).values(businessData).returning();
        return business;
      }
      async getBusiness(id) {
        const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
        return business;
      }
      async getBusinessByOwnerId(ownerId) {
        const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, ownerId));
        return business;
      }
      async getBusinessByUserId(userId) {
        const [owned] = await db.select().from(businesses).where(eq(businesses.ownerId, userId));
        if (owned) return owned;
        const [membership] = await db.select({ business: businesses }).from(businessMembers).innerJoin(businesses, eq(businessMembers.businessId, businesses.id)).where(eq(businessMembers.userId, userId));
        return membership?.business;
      }
      async updateBusiness(id, updates) {
        const [business] = await db.update(businesses).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(businesses.id, id)).returning();
        return business;
      }
      // Business member operations
      async addBusinessMember(memberData) {
        const [member] = await db.insert(businessMembers).values(memberData).returning();
        return member;
      }
      async getBusinessMembers(businessId) {
        const members = await db.select({
          id: businessMembers.id,
          businessId: businessMembers.businessId,
          userId: businessMembers.userId,
          role: businessMembers.role,
          createdAt: businessMembers.createdAt,
          user: users
        }).from(businessMembers).innerJoin(users, eq(businessMembers.userId, users.id)).where(eq(businessMembers.businessId, businessId));
        return members;
      }
      async updateBusinessMemberRole(id, role) {
        const [member] = await db.update(businessMembers).set({ role }).where(eq(businessMembers.id, id)).returning();
        return member;
      }
      async removeBusinessMember(id) {
        const result = await db.delete(businessMembers).where(eq(businessMembers.id, id));
        return result.rowCount ? result.rowCount > 0 : true;
      }
      // Vendor operations
      async createVendor(vendorData) {
        const [vendor] = await db.insert(vendors).values(vendorData).returning();
        return vendor;
      }
      async getVendors(businessId) {
        return db.select().from(vendors).where(eq(vendors.businessId, businessId)).orderBy(desc(vendors.createdAt));
      }
      async getVendor(id, businessId) {
        const [vendor] = await db.select().from(vendors).where(and(eq(vendors.id, id), eq(vendors.businessId, businessId)));
        return vendor;
      }
      async updateVendor(id, businessId, updates) {
        const [vendor] = await db.update(vendors).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(vendors.id, id), eq(vendors.businessId, businessId))).returning();
        return vendor;
      }
      async deleteVendor(id, businessId) {
        const result = await db.delete(vendors).where(and(eq(vendors.id, id), eq(vendors.businessId, businessId)));
        return result.rowCount ? result.rowCount > 0 : true;
      }
      // Pricing item operations
      async createPricingItem(itemData) {
        const [item] = await db.insert(pricingItems).values(itemData).returning();
        return item;
      }
      async getPricingItems(businessId) {
        return db.select().from(pricingItems).where(eq(pricingItems.businessId, businessId)).orderBy(pricingItems.category, pricingItems.name);
      }
      async updatePricingItem(id, businessId, updates) {
        const [item] = await db.update(pricingItems).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(pricingItems.id, id), eq(pricingItems.businessId, businessId))).returning();
        return item;
      }
      async deletePricingItem(id, businessId) {
        const result = await db.delete(pricingItems).where(and(eq(pricingItems.id, id), eq(pricingItems.businessId, businessId)));
        return result.rowCount ? result.rowCount > 0 : true;
      }
      // Estimate operations
      async createEstimate(estimateData) {
        const [estimate] = await db.insert(estimates).values(estimateData).returning();
        return estimate;
      }
      async getEstimates(businessId) {
        return db.select().from(estimates).where(eq(estimates.businessId, businessId)).orderBy(desc(estimates.createdAt));
      }
      async getEstimate(id, businessId) {
        const [estimate] = await db.select().from(estimates).where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)));
        return estimate;
      }
      async updateEstimate(id, businessId, updates) {
        const [estimate] = await db.update(estimates).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(estimates.id, id), eq(estimates.businessId, businessId))).returning();
        return estimate;
      }
      async deleteEstimate(id, businessId) {
        await db.delete(estimateLineItems).where(eq(estimateLineItems.estimateId, id));
        const result = await db.delete(estimates).where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)));
        return result.rowCount ? result.rowCount > 0 : true;
      }
      async getEstimateLineItems(estimateId) {
        return db.select().from(estimateLineItems).where(eq(estimateLineItems.estimateId, estimateId)).orderBy(estimateLineItems.sortOrder);
      }
      async addEstimateLineItem(item) {
        const [lineItem] = await db.insert(estimateLineItems).values(item).returning();
        return lineItem;
      }
      async updateEstimateLineItem(id, updates) {
        const [lineItem] = await db.update(estimateLineItems).set(updates).where(eq(estimateLineItems.id, id)).returning();
        return lineItem;
      }
      async deleteEstimateLineItem(id) {
        const result = await db.delete(estimateLineItems).where(eq(estimateLineItems.id, id));
        return result.rowCount ? result.rowCount > 0 : true;
      }
      async replaceEstimateLineItems(estimateId, items) {
        await db.delete(estimateLineItems).where(eq(estimateLineItems.estimateId, estimateId));
        if (items.length === 0) return [];
        const toInsert = items.map((item, i) => ({ ...item, estimateId, sortOrder: String(i) }));
        return db.insert(estimateLineItems).values(toInsert).returning();
      }
      // Property operations
      async createProperty(propertyData) {
        const [property] = await db.insert(properties).values(propertyData).returning();
        return property;
      }
      async getProperties(businessId) {
        const props = await db.select().from(properties).where(eq(properties.businessId, businessId)).orderBy(desc(properties.createdAt));
        const withCounts = await Promise.all(
          props.map(async (p) => {
            const [{ count }] = await db.select({ count: sql2`count(*)::int` }).from(workLogs).where(eq(workLogs.propertyId, p.id));
            return { ...p, workLogCount: count };
          })
        );
        return withCounts;
      }
      async getProperty(id, businessId) {
        const [property] = await db.select().from(properties).where(and(eq(properties.id, id), eq(properties.businessId, businessId)));
        return property;
      }
      async updateProperty(id, businessId, updates) {
        const [property] = await db.update(properties).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(properties.id, id), eq(properties.businessId, businessId))).returning();
        return property;
      }
      async deleteProperty(id, businessId) {
        await db.update(workLogs).set({ propertyId: null }).where(and(eq(workLogs.propertyId, id), eq(workLogs.businessId, businessId)));
        const result = await db.delete(properties).where(and(eq(properties.id, id), eq(properties.businessId, businessId)));
        return result.rowCount ? result.rowCount > 0 : true;
      }
      // Work log operations
      async getWorkLogs(businessId) {
        const logs = await db.select({
          id: workLogs.id,
          businessId: workLogs.businessId,
          propertyId: workLogs.propertyId,
          technicianUserId: workLogs.technicianUserId,
          customerName: workLogs.customerName,
          workType: workLogs.workType,
          locationName: workLogs.locationName,
          city: workLogs.city,
          state: workLogs.state,
          zipCode: workLogs.zipCode,
          serviceDate: workLogs.serviceDate,
          startTime: workLogs.startTime,
          endTime: workLogs.endTime,
          workPerformed: workLogs.workPerformed,
          additionalNotes: workLogs.additionalNotes,
          status: workLogs.status,
          imageUrls: workLogs.imageUrls,
          pdfUrls: workLogs.pdfUrls,
          photoMetadata: workLogs.photoMetadata,
          technicianUserIds: workLogs.technicianUserIds,
          checkInTime: workLogs.checkInTime,
          checkOutTime: workLogs.checkOutTime,
          checkInLat: workLogs.checkInLat,
          checkInLng: workLogs.checkInLng,
          checkOutLat: workLogs.checkOutLat,
          checkOutLng: workLogs.checkOutLng,
          scheduledStartTime: workLogs.scheduledStartTime,
          scheduledEndTime: workLogs.scheduledEndTime,
          recurringScheduleId: workLogs.recurringScheduleId,
          isRecurrenceInstance: workLogs.isRecurrenceInstance,
          googleCalendarEventId: workLogs.googleCalendarEventId,
          googleCalendarSyncedAt: workLogs.googleCalendarSyncedAt,
          createdAt: workLogs.createdAt,
          updatedAt: workLogs.updatedAt,
          technician: users
        }).from(workLogs).innerJoin(users, eq(workLogs.technicianUserId, users.id)).where(eq(workLogs.businessId, businessId)).orderBy(desc(workLogs.createdAt));
        return logs;
      }
      async getWorkLog(id, businessId) {
        const [log] = await db.select().from(workLogs).where(and(eq(workLogs.id, id), eq(workLogs.businessId, businessId)));
        return log;
      }
      async createApiClient(businessId, name) {
        const clientId = `fc_id_${crypto2.randomBytes(12).toString("hex")}`;
        const clientSecret = `fc_secret_${crypto2.randomBytes(24).toString("hex")}`;
        const clientSecretHash = crypto2.createHash("sha256").update(clientSecret).digest("hex");
        const [record] = await db.insert(apiClients).values({ businessId, name, clientId, clientSecretHash }).returning();
        return { clientId, clientSecret, record };
      }
      async getApiClients(businessId) {
        return db.select().from(apiClients).where(eq(apiClients.businessId, businessId)).orderBy(desc(apiClients.createdAt));
      }
      async getApiClientByClientId(clientId) {
        const [record] = await db.select().from(apiClients).where(eq(apiClients.clientId, clientId));
        return record;
      }
      async revokeApiClient(id, businessId) {
        const [updated] = await db.update(apiClients).set({ isActive: "false" }).where(and(eq(apiClients.id, id), eq(apiClients.businessId, businessId))).returning();
        return !!updated;
      }
      async verifyApiClient(clientId, clientSecret) {
        const record = await this.getApiClientByClientId(clientId);
        if (!record || record.isActive !== "true") return void 0;
        const hash = crypto2.createHash("sha256").update(clientSecret).digest("hex");
        if (hash !== record.clientSecretHash) return void 0;
        return record;
      }
      async createWorkLog(workLogData) {
        const [workLog] = await db.insert(workLogs).values(workLogData).returning();
        return workLog;
      }
      async updateWorkLog(id, businessId, updates) {
        const [workLog] = await db.update(workLogs).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(workLogs.id, id), eq(workLogs.businessId, businessId))).returning();
        return workLog;
      }
      async deleteWorkLog(id, businessId) {
        const result = await db.delete(workLogs).where(and(eq(workLogs.id, id), eq(workLogs.businessId, businessId)));
        return result.rowCount ? result.rowCount > 0 : true;
      }
      async getWorkLogsByFilter(businessId, filters) {
        const conditions = [eq(workLogs.businessId, businessId)];
        if (filters.workType) {
          conditions.push(ilike(workLogs.workType, `%${filters.workType}%`));
        }
        if (filters.customerName) {
          conditions.push(ilike(workLogs.customerName, `%${filters.customerName}%`));
        }
        if (filters.technicianUserId) {
          conditions.push(eq(workLogs.technicianUserId, filters.technicianUserId));
        }
        if (filters.dateFrom) {
          conditions.push(sql2`${workLogs.serviceDate} >= ${filters.dateFrom}`);
        }
        if (filters.dateTo) {
          conditions.push(sql2`${workLogs.serviceDate} <= ${filters.dateTo}`);
        }
        if (filters.propertyId) {
          conditions.push(eq(workLogs.propertyId, filters.propertyId));
        }
        const logs = await db.select({
          id: workLogs.id,
          businessId: workLogs.businessId,
          propertyId: workLogs.propertyId,
          technicianUserId: workLogs.technicianUserId,
          customerName: workLogs.customerName,
          workType: workLogs.workType,
          locationName: workLogs.locationName,
          city: workLogs.city,
          state: workLogs.state,
          zipCode: workLogs.zipCode,
          serviceDate: workLogs.serviceDate,
          startTime: workLogs.startTime,
          endTime: workLogs.endTime,
          workPerformed: workLogs.workPerformed,
          additionalNotes: workLogs.additionalNotes,
          status: workLogs.status,
          imageUrls: workLogs.imageUrls,
          pdfUrls: workLogs.pdfUrls,
          photoMetadata: workLogs.photoMetadata,
          technicianUserIds: workLogs.technicianUserIds,
          checkInTime: workLogs.checkInTime,
          checkOutTime: workLogs.checkOutTime,
          checkInLat: workLogs.checkInLat,
          checkInLng: workLogs.checkInLng,
          checkOutLat: workLogs.checkOutLat,
          checkOutLng: workLogs.checkOutLng,
          scheduledStartTime: workLogs.scheduledStartTime,
          scheduledEndTime: workLogs.scheduledEndTime,
          recurringScheduleId: workLogs.recurringScheduleId,
          isRecurrenceInstance: workLogs.isRecurrenceInstance,
          googleCalendarEventId: workLogs.googleCalendarEventId,
          googleCalendarSyncedAt: workLogs.googleCalendarSyncedAt,
          createdAt: workLogs.createdAt,
          updatedAt: workLogs.updatedAt,
          technician: users
        }).from(workLogs).innerJoin(users, eq(workLogs.technicianUserId, users.id)).where(and(...conditions)).orderBy(desc(workLogs.createdAt));
        return logs;
      }
      // Schedule operations
      async getScheduledJobs(businessId, month) {
        const [year, monthNum] = month.split("-").map(Number);
        const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(monthNum + 1 > 12 ? 1 : monthNum + 1).padStart(2, "0")}-01`;
        const endYear = monthNum + 1 > 12 ? year + 1 : year;
        const adjustedEndDate = `${endYear}-${String(monthNum + 1 > 12 ? 1 : monthNum + 1).padStart(2, "0")}-01`;
        const logs = await db.select({
          id: workLogs.id,
          businessId: workLogs.businessId,
          propertyId: workLogs.propertyId,
          technicianUserId: workLogs.technicianUserId,
          customerName: workLogs.customerName,
          workType: workLogs.workType,
          locationName: workLogs.locationName,
          city: workLogs.city,
          state: workLogs.state,
          zipCode: workLogs.zipCode,
          serviceDate: workLogs.serviceDate,
          startTime: workLogs.startTime,
          endTime: workLogs.endTime,
          workPerformed: workLogs.workPerformed,
          additionalNotes: workLogs.additionalNotes,
          status: workLogs.status,
          imageUrls: workLogs.imageUrls,
          pdfUrls: workLogs.pdfUrls,
          photoMetadata: workLogs.photoMetadata,
          technicianUserIds: workLogs.technicianUserIds,
          checkInTime: workLogs.checkInTime,
          checkOutTime: workLogs.checkOutTime,
          checkInLat: workLogs.checkInLat,
          checkInLng: workLogs.checkInLng,
          checkOutLat: workLogs.checkOutLat,
          checkOutLng: workLogs.checkOutLng,
          scheduledStartTime: workLogs.scheduledStartTime,
          scheduledEndTime: workLogs.scheduledEndTime,
          recurringScheduleId: workLogs.recurringScheduleId,
          isRecurrenceInstance: workLogs.isRecurrenceInstance,
          googleCalendarEventId: workLogs.googleCalendarEventId,
          googleCalendarSyncedAt: workLogs.googleCalendarSyncedAt,
          createdAt: workLogs.createdAt,
          updatedAt: workLogs.updatedAt,
          technician: users
        }).from(workLogs).innerJoin(users, eq(workLogs.technicianUserId, users.id)).where(
          and(
            eq(workLogs.businessId, businessId),
            sql2`${workLogs.serviceDate} >= ${startDate}`,
            sql2`${workLogs.serviceDate} < ${adjustedEndDate}`
          )
        ).orderBy(workLogs.serviceDate, workLogs.scheduledStartTime);
        return logs;
      }
      async updateWorkLogStatus(id, businessId, status) {
        const [workLog] = await db.update(workLogs).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(workLogs.id, id), eq(workLogs.businessId, businessId))).returning();
        return workLog;
      }
      // Recurring schedule operations
      async getRecurringSchedules(businessId) {
        return db.select().from(recurringSchedules).where(eq(recurringSchedules.businessId, businessId)).orderBy(desc(recurringSchedules.createdAt));
      }
      async getRecurringSchedule(id, businessId) {
        const [schedule] = await db.select().from(recurringSchedules).where(and(eq(recurringSchedules.id, id), eq(recurringSchedules.businessId, businessId)));
        return schedule;
      }
      async createRecurringSchedule(scheduleData) {
        const [schedule] = await db.insert(recurringSchedules).values(scheduleData).returning();
        return schedule;
      }
      async updateRecurringSchedule(id, businessId, updates) {
        const [schedule] = await db.update(recurringSchedules).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(recurringSchedules.id, id), eq(recurringSchedules.businessId, businessId))).returning();
        return schedule;
      }
      async deleteRecurringSchedule(id, businessId) {
        const result = await db.delete(recurringSchedules).where(and(eq(recurringSchedules.id, id), eq(recurringSchedules.businessId, businessId)));
        return result.rowCount ? result.rowCount > 0 : true;
      }
      async getActiveRecurringSchedules(businessId) {
        return db.select().from(recurringSchedules).where(
          and(
            eq(recurringSchedules.businessId, businessId),
            eq(recurringSchedules.isActive, "true")
          )
        );
      }
      // Form template operations
      async getFormTemplates(businessId) {
        return db.select().from(formTemplates).where(eq(formTemplates.businessId, businessId)).orderBy(desc(formTemplates.createdAt));
      }
      async getFormTemplate(id, businessId) {
        const [template] = await db.select().from(formTemplates).where(and(eq(formTemplates.id, id), eq(formTemplates.businessId, businessId)));
        return template;
      }
      async getFormTemplatesByWorkType(businessId, workType) {
        return db.select().from(formTemplates).where(
          and(
            eq(formTemplates.businessId, businessId),
            eq(formTemplates.isActive, "true"),
            or(eq(formTemplates.workType, workType), isNull(formTemplates.workType))
          )
        );
      }
      async createFormTemplate(templateData) {
        const [template] = await db.insert(formTemplates).values(templateData).returning();
        return template;
      }
      async updateFormTemplate(id, businessId, updates) {
        const [template] = await db.update(formTemplates).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(formTemplates.id, id), eq(formTemplates.businessId, businessId))).returning();
        return template;
      }
      async deleteFormTemplate(id, businessId) {
        const result = await db.delete(formTemplates).where(and(eq(formTemplates.id, id), eq(formTemplates.businessId, businessId)));
        return result.rowCount ? result.rowCount > 0 : true;
      }
      // Form submission operations
      async getFormSubmissions(workLogId) {
        return db.select({
          id: formSubmissions.id,
          workLogId: formSubmissions.workLogId,
          templateId: formSubmissions.templateId,
          responses: formSubmissions.responses,
          submittedAt: formSubmissions.submittedAt,
          template: formTemplates
        }).from(formSubmissions).innerJoin(formTemplates, eq(formSubmissions.templateId, formTemplates.id)).where(eq(formSubmissions.workLogId, workLogId));
      }
      async createFormSubmission(submissionData) {
        const [submission] = await db.insert(formSubmissions).values(submissionData).returning();
        return submission;
      }
      // Work log task operations
      async getWorkLogTasks(workLogId) {
        return db.select().from(workLogTasks).where(eq(workLogTasks.workLogId, workLogId)).orderBy(workLogTasks.createdAt);
      }
      async createWorkLogTask(taskData) {
        const [task] = await db.insert(workLogTasks).values(taskData).returning();
        return task;
      }
      async updateWorkLogTask(id, workLogId, updates) {
        const [task] = await db.update(workLogTasks).set(updates).where(and(eq(workLogTasks.id, id), eq(workLogTasks.workLogId, workLogId))).returning();
        return task;
      }
      async deleteWorkLogTask(id, workLogId) {
        const result = await db.delete(workLogTasks).where(and(eq(workLogTasks.id, id), eq(workLogTasks.workLogId, workLogId)));
        return result.rowCount ? result.rowCount > 0 : true;
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/recurringJobService.ts
var recurringJobService_exports = {};
__export(recurringJobService_exports, {
  generateJobsForSchedule: () => generateJobsForSchedule,
  generateRecurringJobs: () => generateRecurringJobs
});
function calculateOccurrences(schedule, fromDate, toDate) {
  const occurrences = [];
  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
  const interval = parseInt(schedule.interval) || 1;
  const maxOccurrences = schedule.maxOccurrences ? parseInt(schedule.maxOccurrences) : null;
  let currentDate = new Date(Math.max(startDate.getTime(), fromDate.getTime()));
  if (schedule.lastGeneratedDate) {
    const lastGenerated = new Date(schedule.lastGeneratedDate);
    lastGenerated.setDate(lastGenerated.getDate() + 1);
    if (lastGenerated > currentDate) {
      currentDate = lastGenerated;
    }
  }
  if (schedule.frequency === "weekly") {
    const dayOfWeek = currentDate.getDay();
    currentDate.setDate(currentDate.getDate() - dayOfWeek);
  } else if (schedule.frequency === "monthly") {
    currentDate.setDate(1);
  }
  let occurrenceCount = 0;
  const maxIterations = 400;
  let iterations = 0;
  while (currentDate <= toDate && iterations < maxIterations) {
    iterations++;
    if (endDate && currentDate > endDate) break;
    if (maxOccurrences && occurrenceCount >= maxOccurrences) break;
    let shouldInclude = false;
    switch (schedule.frequency) {
      case "daily":
        shouldInclude = currentDate >= startDate && currentDate >= fromDate;
        break;
      case "weekly":
        const daysOfWeek = schedule.daysOfWeek || [];
        if (daysOfWeek.length > 0) {
          shouldInclude = daysOfWeek.includes(currentDate.getDay()) && currentDate >= startDate && currentDate >= fromDate;
        }
        break;
      case "monthly":
        const dayOfMonth = schedule.dayOfMonth;
        if (dayOfMonth === "last") {
          const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          shouldInclude = currentDate.getDate() === lastDay && currentDate >= startDate && currentDate >= fromDate;
        } else if (dayOfMonth) {
          const targetDay = parseInt(dayOfMonth);
          const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          const effectiveDay = Math.min(targetDay, lastDay);
          shouldInclude = currentDate.getDate() === effectiveDay && currentDate >= startDate && currentDate >= fromDate;
        }
        break;
    }
    if (shouldInclude && currentDate <= toDate) {
      occurrences.push(new Date(currentDate));
      occurrenceCount++;
    }
    switch (schedule.frequency) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate.getDay() === 0 && iterations > 1) {
          currentDate.setDate(currentDate.getDate() + (interval - 1) * 7);
        }
        break;
      case "monthly":
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate.getDate() === 1) {
          currentDate.setMonth(currentDate.getMonth() + (interval - 1));
        }
        break;
    }
  }
  return occurrences;
}
async function generateRecurringJobs(businessId) {
  const schedules = await storage.getActiveRecurringSchedules(businessId);
  const generatedJobs = [];
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);
  for (const schedule of schedules) {
    const occurrences = calculateOccurrences(schedule, today, endDate);
    for (const occurrenceDate of occurrences) {
      const serviceDate = occurrenceDate.toISOString().split("T")[0];
      const [hours, minutes] = schedule.scheduledTime.split(":").map(Number);
      const scheduledStart = new Date(occurrenceDate);
      scheduledStart.setHours(hours, minutes, 0, 0);
      const durationMinutes = parseInt(schedule.estimatedDurationMinutes || "60");
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + durationMinutes);
      const technicianUserIds = schedule.technicianUserIds || [];
      const primaryTechnicianId = technicianUserIds[0];
      if (!primaryTechnicianId) {
        console.warn(`Skipping schedule ${schedule.id}: no technician assigned`);
        continue;
      }
      const workLogData = {
        businessId: schedule.businessId,
        propertyId: schedule.propertyId || null,
        technicianUserId: primaryTechnicianId,
        customerName: schedule.customerName,
        workType: schedule.workType,
        locationName: schedule.locationName,
        city: schedule.city,
        state: schedule.state,
        zipCode: schedule.zipCode,
        serviceDate,
        startTime: schedule.scheduledTime,
        endTime: null,
        workPerformed: schedule.workDescription,
        additionalNotes: schedule.notes || null,
        status: "scheduled",
        technicianUserIds,
        imageUrls: [],
        pdfUrls: [],
        photoMetadata: [],
        scheduledStartTime: scheduledStart.toISOString(),
        scheduledEndTime: scheduledEnd.toISOString(),
        recurringScheduleId: schedule.id,
        isRecurrenceInstance: "true"
      };
      try {
        const workLog = await storage.createWorkLog(workLogData);
        generatedJobs.push(workLog);
      } catch (error) {
        console.error(`Error creating work log for schedule ${schedule.id}:`, error);
      }
    }
    if (occurrences.length > 0) {
      const lastOccurrence = occurrences[occurrences.length - 1];
      await storage.updateRecurringSchedule(schedule.id, schedule.businessId, {
        lastGeneratedDate: lastOccurrence.toISOString().split("T")[0]
      });
    }
  }
  return generatedJobs;
}
async function generateJobsForSchedule(scheduleId, businessId, daysAhead = 30) {
  const schedule = await storage.getRecurringSchedule(scheduleId, businessId);
  if (!schedule || schedule.isActive !== "true") {
    return [];
  }
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);
  const occurrences = calculateOccurrences(schedule, today, endDate);
  const generatedJobs = [];
  const technicianUserIds = schedule.technicianUserIds || [];
  const primaryTechnicianId = technicianUserIds[0];
  if (!primaryTechnicianId) {
    console.warn(`Schedule ${schedule.id} has no technician assigned`);
    return [];
  }
  for (const occurrenceDate of occurrences) {
    const serviceDate = occurrenceDate.toISOString().split("T")[0];
    const [hours, minutes] = schedule.scheduledTime.split(":").map(Number);
    const scheduledStart = new Date(occurrenceDate);
    scheduledStart.setHours(hours, minutes, 0, 0);
    const durationMinutes = parseInt(schedule.estimatedDurationMinutes || "60");
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(scheduledEnd.getMinutes() + durationMinutes);
    const workLogData = {
      businessId: schedule.businessId,
      propertyId: schedule.propertyId || null,
      technicianUserId: primaryTechnicianId,
      customerName: schedule.customerName,
      workType: schedule.workType,
      locationName: schedule.locationName,
      city: schedule.city,
      state: schedule.state,
      zipCode: schedule.zipCode,
      serviceDate,
      startTime: schedule.scheduledTime,
      endTime: null,
      workPerformed: schedule.workDescription,
      additionalNotes: schedule.notes || null,
      status: "scheduled",
      technicianUserIds,
      imageUrls: [],
      pdfUrls: [],
      photoMetadata: [],
      scheduledStartTime: scheduledStart.toISOString(),
      scheduledEndTime: scheduledEnd.toISOString(),
      recurringScheduleId: schedule.id,
      isRecurrenceInstance: "true"
    };
    try {
      const workLog = await storage.createWorkLog(workLogData);
      generatedJobs.push(workLog);
    } catch (error) {
      console.error(`Error creating work log for schedule ${schedule.id}:`, error);
    }
  }
  if (occurrences.length > 0) {
    const lastOccurrence = occurrences[occurrences.length - 1];
    await storage.updateRecurringSchedule(schedule.id, schedule.businessId, {
      lastGeneratedDate: lastOccurrence.toISOString().split("T")[0]
    });
  }
  return generatedJobs;
}
var init_recurringJobService = __esm({
  "server/recurringJobService.ts"() {
    "use strict";
    init_storage();
  }
});

// server/googleCalendarService.ts
var googleCalendarService_exports = {};
__export(googleCalendarService_exports, {
  createCalendarEvent: () => createCalendarEvent,
  createOAuth2Client: () => createOAuth2Client,
  deleteCalendarEvent: () => deleteCalendarEvent,
  disconnectGoogleCalendar: () => disconnectGoogleCalendar,
  exchangeCodeForTokens: () => exchangeCodeForTokens,
  getAuthUrl: () => getAuthUrl,
  getAuthenticatedClient: () => getAuthenticatedClient,
  importCalendarEvents: () => importCalendarEvents,
  isGoogleCalendarConfigured: () => isGoogleCalendarConfigured,
  listCalendars: () => listCalendars,
  refreshAccessToken: () => refreshAccessToken,
  syncJobToCalendar: () => syncJobToCalendar,
  updateCalendarEvent: () => updateCalendarEvent
});
import { google } from "googleapis";
import { eq as eq2 } from "drizzle-orm";
function createOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}
function getAuthUrl(state) {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state
  });
}
async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}
async function refreshAccessToken(refreshToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}
async function getAuthenticatedClient(userId) {
  const [user] = await db.select().from(users).where(eq2(users.id, userId));
  if (!user || !user.googleAccessToken) {
    throw new Error("User not connected to Google Calendar");
  }
  const oauth2Client = createOAuth2Client();
  if (user.googleTokenExpiresAt) {
    const expiresAt = new Date(user.googleTokenExpiresAt).getTime();
    const now = Date.now();
    if (expiresAt <= now && user.googleRefreshToken) {
      const newTokens = await refreshAccessToken(user.googleRefreshToken);
      await db.update(users).set({
        googleAccessToken: newTokens.access_token,
        googleTokenExpiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(users.id, userId));
      oauth2Client.setCredentials({
        access_token: newTokens.access_token,
        refresh_token: user.googleRefreshToken
      });
    } else {
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken
      });
    }
  } else {
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });
  }
  return google.calendar({ version: "v3", auth: oauth2Client });
}
async function listCalendars(userId) {
  const calendar = await getAuthenticatedClient(userId);
  const response = await calendar.calendarList.list();
  return response.data.items || [];
}
async function createCalendarEvent(userId, workLog) {
  const [user] = await db.select().from(users).where(eq2(users.id, userId));
  if (!user?.googleCalendarId) {
    throw new Error("No calendar selected for sync");
  }
  const calendar = await getAuthenticatedClient(userId);
  const event = {
    summary: `${workLog.workType} - ${workLog.customerName}`,
    description: `${workLog.workPerformed}

${workLog.additionalNotes || ""}`.trim(),
    location: `${workLog.locationName}, ${workLog.city}, ${workLog.state} ${workLog.zipCode}`,
    start: {
      dateTime: workLog.scheduledStartTime || (/* @__PURE__ */ new Date()).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: workLog.scheduledEndTime || new Date(Date.now() + 60 * 60 * 1e3).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    colorId: getColorIdForStatus(workLog.status),
    extendedProperties: {
      private: {
        fieldServiceWorkLogId: workLog.id
      }
    }
  };
  const response = await calendar.events.insert({
    calendarId: user.googleCalendarId,
    requestBody: event
  });
  await db.update(workLogs).set({
    googleCalendarEventId: response.data.id,
    googleCalendarSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(workLogs.id, workLog.id));
  return response.data;
}
async function updateCalendarEvent(userId, eventId, workLog) {
  const [user] = await db.select().from(users).where(eq2(users.id, userId));
  if (!user?.googleCalendarId) {
    throw new Error("No calendar selected for sync");
  }
  const calendar = await getAuthenticatedClient(userId);
  const event = {
    summary: `${workLog.workType} - ${workLog.customerName}`,
    description: `${workLog.workPerformed}

${workLog.additionalNotes || ""}`.trim(),
    location: `${workLog.locationName}, ${workLog.city}, ${workLog.state} ${workLog.zipCode}`,
    start: {
      dateTime: workLog.scheduledStartTime || (/* @__PURE__ */ new Date()).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: workLog.scheduledEndTime || new Date(Date.now() + 60 * 60 * 1e3).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    colorId: getColorIdForStatus(workLog.status)
  };
  const response = await calendar.events.update({
    calendarId: user.googleCalendarId,
    eventId,
    requestBody: event
  });
  await db.update(workLogs).set({
    googleCalendarSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(workLogs.id, workLog.id));
  return response.data;
}
async function deleteCalendarEvent(userId, eventId, workLogId) {
  const [user] = await db.select().from(users).where(eq2(users.id, userId));
  if (!user?.googleCalendarId) {
    return;
  }
  try {
    const calendar = await getAuthenticatedClient(userId);
    await calendar.events.delete({
      calendarId: user.googleCalendarId,
      eventId
    });
  } catch (error) {
    if (error.code !== 404) {
      throw error;
    }
  }
  await db.update(workLogs).set({
    googleCalendarEventId: null,
    googleCalendarSyncedAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(workLogs.id, workLogId));
}
async function syncJobToCalendar(userId, workLog) {
  if (!workLog.scheduledStartTime) {
    return null;
  }
  if (workLog.googleCalendarEventId) {
    return updateCalendarEvent(userId, workLog.googleCalendarEventId, workLog);
  } else {
    return createCalendarEvent(userId, workLog);
  }
}
async function importCalendarEvents(userId, businessId, technicianUserId, timeMin, timeMax) {
  const [user] = await db.select().from(users).where(eq2(users.id, userId));
  if (!user?.googleCalendarId) {
    throw new Error("No calendar selected for import");
  }
  const calendar = await getAuthenticatedClient(userId);
  const response = await calendar.events.list({
    calendarId: user.googleCalendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime"
  });
  const events = response.data.items || [];
  const importedJobs = [];
  for (const event of events) {
    const existingWorkLogId = event.extendedProperties?.private?.fieldServiceWorkLogId;
    if (existingWorkLogId) {
      continue;
    }
    const startTime = event.start?.dateTime || event.start?.date;
    const endTime = event.end?.dateTime || event.end?.date;
    if (!startTime) continue;
    const startDate = new Date(startTime);
    const serviceDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
    const [workLog] = await db.insert(workLogs).values({
      businessId,
      technicianUserId,
      customerName: event.summary || "Imported Event",
      workType: "Imported from Calendar",
      locationName: event.location?.split(",")[0] || "No location",
      city: event.location?.split(",")[1]?.trim() || "Unknown",
      state: event.location?.split(",")[2]?.trim()?.split(" ")[0] || "Unknown",
      zipCode: event.location?.split(",")[2]?.trim()?.split(" ")[1] || "00000",
      serviceDate,
      startTime: startDate.toTimeString().slice(0, 5),
      workPerformed: event.description || "Imported from Google Calendar",
      status: "scheduled",
      scheduledStartTime: startTime,
      scheduledEndTime: endTime || null,
      googleCalendarEventId: event.id,
      googleCalendarSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
      technicianUserIds: [technicianUserId]
    }).returning();
    importedJobs.push(workLog);
  }
  return importedJobs;
}
function getColorIdForStatus(status) {
  switch (status) {
    case "scheduled":
      return "6";
    // Orange
    case "in-progress":
      return "7";
    // Turquoise/Blue
    case "completed":
      return "10";
    // Green
    case "cancelled":
      return "8";
    // Gray
    default:
      return "6";
  }
}
async function disconnectGoogleCalendar(userId) {
  await db.update(users).set({
    googleAccessToken: null,
    googleRefreshToken: null,
    googleTokenExpiresAt: null,
    googleCalendarId: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(users.id, userId));
}
function isGoogleCalendarConfigured() {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}
var GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, SCOPES;
var init_googleCalendarService = __esm({
  "server/googleCalendarService.ts"() {
    "use strict";
    init_db();
    init_schema();
    GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/google/callback";
    SCOPES = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ];
  }
});

// api/index.ts
import express from "express";
import cookieParser from "cookie-parser";

// server/routes.ts
init_storage();
init_schema();
import { createServer } from "http";

// server/supabaseStorage.ts
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var BUCKET_NAME = "field-uploads";
var ObjectNotFoundError = class extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
  }
};
var ObjectStorageService = class {
  /**
   * Get a signed upload URL for direct browser-to-storage uploads
   * Returns a URL that accepts PUT requests with the file content
   */
  async getObjectEntityUploadURL() {
    const objectId = randomUUID();
    const filePath = `uploads/${objectId}`;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUploadUrl(filePath);
    if (error) {
      console.error("Failed to create upload URL:", error);
      throw new Error(`Failed to create upload URL: ${error.message}`);
    }
    return data.signedUrl;
  }
  /**
   * Get file from storage by path
   */
  async getObjectEntityFile(objectPath) {
    const normalizedPath = objectPath.replace(/^\/objects\//, "").replace(/^objects\//, "");
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(normalizedPath);
    if (error) {
      console.error("Failed to download file:", error);
      return null;
    }
    return {
      data,
      contentType: data.type || "application/octet-stream"
    };
  }
  /**
   * Download file and stream to HTTP response
   */
  async downloadObject(objectPath, res) {
    const file = await this.getObjectEntityFile(objectPath);
    if (!file) {
      throw new ObjectNotFoundError();
    }
    const buffer = Buffer.from(await file.data.arrayBuffer());
    res.set({
      "Content-Type": file.contentType,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=3600"
    });
    res.send(buffer);
  }
  /**
   * Get public URL for an object (if bucket is public)
   */
  getPublicUrl(objectPath) {
    const normalizedPath = objectPath.replace(/^\/objects\//, "").replace(/^objects\//, "");
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(normalizedPath);
    return data.publicUrl;
  }
  /**
   * Normalize an object path from various formats to a consistent /objects/... format
   * Handles:
   * - Full Supabase storage URLs
   * - Signed URLs
   * - Already-normalized paths
   */
  normalizeObjectEntityPath(rawPath) {
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }
    const supabaseUrl = process.env.SUPABASE_URL;
    if (rawPath.includes(supabaseUrl) || rawPath.includes("supabase.co/storage")) {
      try {
        const url = new URL(rawPath);
        const pathParts = url.pathname.split("/storage/v1/object/");
        if (pathParts.length > 1) {
          const afterObject = pathParts[1];
          const parts = afterObject.split("/");
          if (parts.length >= 3) {
            const objectPath = parts.slice(2).join("/");
            return `/objects/${objectPath}`;
          }
        }
        const bucketIndex = url.pathname.indexOf(BUCKET_NAME);
        if (bucketIndex !== -1) {
          const pathAfterBucket = url.pathname.substring(bucketIndex + BUCKET_NAME.length + 1);
          return `/objects/${pathAfterBucket}`;
        }
      } catch {
      }
    }
    if (!rawPath.startsWith("/")) {
      return `/objects/${rawPath}`;
    }
    return rawPath;
  }
  /**
   * Delete an object from storage
   */
  async deleteObject(objectPath) {
    const normalizedPath = objectPath.replace(/^\/objects\//, "").replace(/^objects\//, "");
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([normalizedPath]);
    if (error) {
      console.error("Failed to delete object:", error);
      return false;
    }
    return true;
  }
};
var objectStorageService = new ObjectStorageService();

// server/supabaseAuth.ts
init_storage();
import { createClient as createClient2 } from "@supabase/supabase-js";
var supabase2 = createClient2(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.get("/api/login", (req, res) => {
    const redirectTo = `${req.protocol}://${req.get("host")}/api/auth/callback`;
    const supabaseUrl = process.env.SUPABASE_URL;
    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
    res.redirect(authUrl);
  });
  app2.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const { data, error } = await supabase2.auth.signInWithPassword({
      email,
      password
    });
    if (error || !data.session) {
      return res.status(401).json({ message: error?.message || "Login failed" });
    }
    await storage.upsertUser({
      id: data.session.user.id,
      email: data.session.user.email ?? null,
      firstName: data.session.user.user_metadata?.first_name ?? null,
      lastName: data.session.user.user_metadata?.last_name ?? null,
      profileImageUrl: data.session.user.user_metadata?.avatar_url ?? null
    });
    setAuthCookies(res, data.session.access_token, data.session.refresh_token);
    res.json({ user: data.session.user });
  });
  app2.post("/api/auth/signup", async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const { data, error } = await supabase2.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    if (data.session) {
      await storage.upsertUser({
        id: data.session.user.id,
        email: data.session.user.email ?? null,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        profileImageUrl: null
      });
      setAuthCookies(res, data.session.access_token, data.session.refresh_token);
      res.json({ user: data.session.user });
    } else {
      res.json({ message: "Check your email for confirmation link" });
    }
  });
  app2.get("/api/auth/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) {
      return res.redirect("/?error=no_code");
    }
    try {
      const { data, error } = await supabase2.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        console.error("Auth callback error:", error);
        return res.redirect("/?error=auth_failed");
      }
      const user = data.session.user;
      await storage.upsertUser({
        id: user.id,
        email: user.email ?? null,
        firstName: user.user_metadata?.full_name?.split(" ")[0] ?? user.user_metadata?.first_name ?? null,
        lastName: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ?? user.user_metadata?.last_name ?? null,
        profileImageUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null
      });
      setAuthCookies(res, data.session.access_token, data.session.refresh_token);
      res.redirect("/");
    } catch (err) {
      console.error("Auth callback exception:", err);
      res.redirect("/?error=auth_exception");
    }
  });
  app2.get("/api/logout", (req, res) => {
    res.clearCookie("sb-access-token");
    res.clearCookie("sb-refresh-token");
    res.redirect("/");
  });
  app2.post("/api/auth/logout", (req, res) => {
    res.clearCookie("sb-access-token");
    res.clearCookie("sb-refresh-token");
    res.json({ success: true });
  });
}
function setAuthCookies(res, accessToken, refreshToken) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1e3,
    // 1 week
    path: "/"
  };
  res.cookie("sb-access-token", accessToken, cookieOptions);
  res.cookie("sb-refresh-token", refreshToken, cookieOptions);
}
var isAuthenticated = async (req, res, next) => {
  const clientId = req.headers["x-client-id"];
  const clientSecret = req.headers["x-client-secret"];
  if (clientId && clientSecret) {
    try {
      const apiClient = await storage.verifyApiClient(clientId, clientSecret);
      if (apiClient) {
        const business = await storage.getBusiness(apiClient.businessId);
        if (business) {
          req.user = { claims: { sub: business.ownerId } };
          return next();
        }
      }
    } catch {
    }
    return res.status(401).json({ message: "Invalid API credentials" });
  }
  const accessToken = req.cookies?.["sb-access-token"];
  const refreshToken = req.cookies?.["sb-refresh-token"];
  if (!accessToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { data: { user }, error } = await supabase2.auth.getUser(accessToken);
    if (error || !user) {
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase2.auth.refreshSession({
          refresh_token: refreshToken
        });
        if (!refreshError && refreshData.session) {
          setAuthCookies(res, refreshData.session.access_token, refreshData.session.refresh_token);
          req.user = { claims: { sub: refreshData.session.user.id } };
          return next();
        }
      }
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = { claims: { sub: user.id } };
    return next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// server/routes.ts
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/business", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingBusiness = await storage.getBusinessByOwnerId(userId);
      if (existingBusiness) {
        return res.status(400).json({ error: "User already has a business" });
      }
      const validatedData = insertBusinessSchema.parse({
        ...req.body,
        ownerId: userId
      });
      const business = await storage.createBusiness(validatedData);
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      res.status(400).json({ error: "Invalid business data" });
    }
  });
  app2.get("/api/business", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      res.json(business || null);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/business/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      if (business.ownerId !== userId) return res.status(403).json({ error: "Only the owner can update settings" });
      const updates = updateBusinessSchema.parse(req.body);
      const updated = await storage.updateBusiness(business.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating business settings:", error);
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/business/members", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      const members = await storage.getBusinessMembers(business.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching business members:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/business/members", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      const { email, firstName, lastName, role = "technician" } = req.body;
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({
          id: crypto.randomUUID(),
          email,
          firstName,
          lastName,
          profileImageUrl: null
        });
      }
      const validatedData = insertBusinessMemberSchema.parse({
        userId: user.id,
        role,
        businessId: business.id
      });
      const member = await storage.addBusinessMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding business member:", error);
      res.status(400).json({ error: "Invalid member data" });
    }
  });
  app2.patch("/api/business/members/:id/role", isAuthenticated, async (req, res) => {
    try {
      const { role } = req.body;
      if (!role) return res.status(400).json({ error: "Role is required" });
      const member = await storage.updateBusinessMemberRole(req.params.id, role);
      if (!member) return res.status(404).json({ error: "Member not found" });
      res.json(member);
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/business/members/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.removeBusinessMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing business member:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/vendors", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const validatedData = insertVendorSchema.parse({ ...req.body, businessId: business.id });
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });
  app2.get("/api/vendors", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      const vendorList = await storage.getVendors(business.id);
      res.json(vendorList);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Vendor not found" });
      const vendor = await storage.getVendor(req.params.id, business.id);
      if (!vendor) return res.status(404).json({ error: "Vendor not found" });
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/vendors/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Vendor not found" });
      const validatedData = updateVendorSchema.parse(req.body);
      const vendor = await storage.updateVendor(req.params.id, business.id, validatedData);
      if (!vendor) return res.status(404).json({ error: "Vendor not found" });
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });
  app2.delete("/api/vendors/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Vendor not found" });
      const deleted = await storage.deleteVendor(req.params.id, business.id);
      if (!deleted) return res.status(404).json({ error: "Vendor not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const validatedData = insertPropertySchema.parse({ ...req.body, businessId: business.id });
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(400).json({ error: "Invalid property data" });
    }
  });
  app2.get("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      const props = await storage.getProperties(business.id);
      res.json(props);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/properties/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Property not found" });
      const property = await storage.getProperty(req.params.id, business.id);
      if (!property) return res.status(404).json({ error: "Property not found" });
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/properties/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Property not found" });
      const validatedData = updatePropertySchema.parse(req.body);
      const property = await storage.updateProperty(req.params.id, business.id, validatedData);
      if (!property) return res.status(404).json({ error: "Property not found" });
      res.json(property);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(400).json({ error: "Invalid property data" });
    }
  });
  app2.delete("/api/properties/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Property not found" });
      const deleted = await storage.deleteProperty(req.params.id, business.id);
      if (!deleted) return res.status(404).json({ error: "Property not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/pricing-items", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      res.json(await storage.getPricingItems(business.id));
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/pricing-items", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const data = insertPricingItemSchema.parse({ ...req.body, businessId: business.id });
      res.status(201).json(await storage.createPricingItem(data));
    } catch (e) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/pricing-items/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const data = updatePricingItemSchema.parse(req.body);
      const item = await storage.updatePricingItem(req.params.id, business.id, data);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.delete("/api/pricing-items/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const deleted = await storage.deletePricingItem(req.params.id, business.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/estimates", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const data = insertEstimateSchema.parse({ ...req.body, businessId: business.id });
      res.status(201).json(await storage.createEstimate(data));
    } catch (e) {
      console.error(e);
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/estimates", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      res.json(await storage.getEstimates(business.id));
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/estimates/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const estimate = await storage.getEstimate(req.params.id, business.id);
      if (!estimate) return res.status(404).json({ error: "Not found" });
      const lineItems = await storage.getEstimateLineItems(estimate.id);
      res.json({ ...estimate, lineItems });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/estimates/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const { lineItems, ...rest } = req.body;
      const data = (await Promise.resolve().then(() => (init_schema(), schema_exports))).updateEstimateSchema.parse(rest);
      const estimate = await storage.updateEstimate(req.params.id, business.id, data);
      if (!estimate) return res.status(404).json({ error: "Not found" });
      if (lineItems !== void 0) {
        await storage.replaceEstimateLineItems(req.params.id, lineItems);
      }
      const updatedLineItems = await storage.getEstimateLineItems(req.params.id);
      res.json({ ...estimate, lineItems: updatedLineItems });
    } catch (e) {
      console.error(e);
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.delete("/api/estimates/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const deleted = await storage.deleteEstimate(req.params.id, business.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/work-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.json([]);
      }
      const { workType, customerName, technicianUserId, dateFrom, dateTo, propertyId } = req.query;
      const filters = {
        workType,
        customerName,
        technicianUserId,
        dateFrom,
        dateTo,
        propertyId
      };
      const workLogs2 = await storage.getWorkLogsByFilter(business.id, filters);
      res.json(workLogs2);
    } catch (error) {
      console.error("Error fetching work logs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/work-logs/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.status(404).json({ error: "Work log not found" });
      }
      const workLog = await storage.getWorkLog(req.params.id, business.id);
      if (!workLog) {
        return res.status(404).json({ error: "Work log not found" });
      }
      res.json(workLog);
    } catch (error) {
      console.error("Error fetching work log:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/work-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.status(400).json({ error: "Business not found" });
      }
      const validatedData = insertWorkLogSchema.parse({
        ...req.body,
        businessId: business.id
      });
      const workLog = await storage.createWorkLog(validatedData);
      res.status(201).json(workLog);
    } catch (error) {
      console.error("Error creating work log:", error);
      res.status(400).json({ error: "Invalid work log data" });
    }
  });
  app2.put("/api/work-logs/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.status(404).json({ error: "Work log not found" });
      }
      const validatedData = updateWorkLogSchema.parse(req.body);
      const workLog = await storage.updateWorkLog(req.params.id, business.id, validatedData);
      if (!workLog) {
        return res.status(404).json({ error: "Work log not found" });
      }
      res.json(workLog);
    } catch (error) {
      console.error("Error updating work log:", error);
      res.status(400).json({ error: "Invalid work log data" });
    }
  });
  app2.patch("/api/work-logs/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.status(404).json({ error: "Work log not found" });
      }
      const validatedData = updateWorkLogSchema.parse(req.body);
      const workLog = await storage.updateWorkLog(req.params.id, business.id, validatedData);
      if (!workLog) {
        return res.status(404).json({ error: "Work log not found" });
      }
      res.json(workLog);
    } catch (error) {
      console.error("Error updating work log:", error);
      res.status(400).json({ error: "Invalid work log data" });
    }
  });
  app2.delete("/api/work-logs/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.status(404).json({ error: "Work log not found" });
      }
      const deleted = await storage.deleteWorkLog(req.params.id, business.id);
      if (!deleted) {
        return res.status(404).json({ error: "Work log not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting work log:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/developer/clients", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      if (business.ownerId !== userId) return res.status(403).json({ error: "Only the owner can manage API clients" });
      const clients = await storage.getApiClients(business.id);
      res.json(clients.map((c) => ({ ...c, clientSecretHash: void 0 })));
    } catch (error) {
      console.error("Error fetching API clients:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/developer/clients", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      if (business.ownerId !== userId) return res.status(403).json({ error: "Only the owner can create API clients" });
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Client name is required" });
      }
      const result = await storage.createApiClient(business.id, name.trim());
      res.status(201).json({
        ...result.record,
        clientSecretHash: void 0,
        clientSecret: result.clientSecret
      });
    } catch (error) {
      console.error("Error creating API client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/developer/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      if (business.ownerId !== userId) return res.status(403).json({ error: "Only the owner can revoke API clients" });
      const revoked = await storage.revokeApiClient(req.params.id, business.id);
      if (!revoked) return res.status(404).json({ error: "Client not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking API client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/work-logs/:id/check-in", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const { lat, lng } = req.body;
      const updates = { checkInTime: (/* @__PURE__ */ new Date()).toISOString() };
      if (lat != null) updates.checkInLat = String(lat);
      if (lng != null) updates.checkInLng = String(lng);
      const workLog = await storage.updateWorkLog(req.params.id, business.id, updates);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      res.json(workLog);
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/work-logs/:id/check-out", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const { lat, lng } = req.body;
      const updates = { checkOutTime: (/* @__PURE__ */ new Date()).toISOString() };
      if (lat != null) updates.checkOutLat = String(lat);
      if (lng != null) updates.checkOutLng = String(lng);
      const workLog = await storage.updateWorkLog(req.params.id, business.id, updates);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      res.json(workLog);
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      await objectStorageService.downloadObject(req.path, res);
    } catch (error) {
      console.error("Error downloading object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.post("/api/objects/upload", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  app2.put("/api/objects/finalize", async (req, res) => {
    if (!req.body.objectUrl) {
      return res.status(400).json({ error: "objectUrl is required" });
    }
    try {
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.objectUrl
      );
      res.status(200).json({
        objectPath
      });
    } catch (error) {
      console.error("Error finalizing object:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/schedule/jobs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      const month = req.query.month;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: "Invalid month format. Use YYYY-MM" });
      }
      const jobs = await storage.getScheduledJobs(business.id, month);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching scheduled jobs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/schedule/jobs", isAuthenticated, async (req, res) => {
    console.log("POST /api/schedule/jobs called with body:", JSON.stringify(req.body, null, 2));
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        console.log("No business found for user:", userId);
        return res.status(400).json({ error: "Business not found" });
      }
      console.log("Business found:", business.id);
      const validatedData = insertWorkLogSchema.parse({
        ...req.body,
        businessId: business.id,
        status: "scheduled"
      });
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      const workLog = await storage.createWorkLog(validatedData);
      console.log("Work log created:", JSON.stringify(workLog, null, 2));
      res.status(201).json(workLog);
    } catch (error) {
      console.error("Error creating scheduled job:", error);
      res.status(400).json({ error: "Invalid job data" });
    }
  });
  app2.post("/api/work-logs/:id/start", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const workLog = await storage.getWorkLog(req.params.id, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      if (workLog.status !== "scheduled") {
        return res.status(400).json({ error: "Can only start scheduled jobs" });
      }
      const updated = await storage.updateWorkLogStatus(req.params.id, business.id, "in-progress");
      res.json(updated);
    } catch (error) {
      console.error("Error starting job:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/work-logs/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const workLog = await storage.getWorkLog(req.params.id, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      if (workLog.status !== "in-progress") {
        return res.status(400).json({ error: "Can only complete in-progress jobs" });
      }
      const updated = await storage.updateWorkLogStatus(req.params.id, business.id, "completed");
      res.json(updated);
    } catch (error) {
      console.error("Error completing job:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/work-logs/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const { status } = req.body;
      const parsedStatus = workLogStatusSchema.safeParse(status);
      if (!parsedStatus.success) {
        return res.status(400).json({ error: "Invalid status. Must be: scheduled, in-progress, completed, or cancelled" });
      }
      const workLog = await storage.getWorkLog(req.params.id, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      const currentStatus = workLog.status;
      const newStatus = parsedStatus.data;
      const validTransitions = {
        "scheduled": ["in-progress", "cancelled"],
        "in-progress": ["completed", "cancelled"],
        "completed": [],
        // Cannot transition from completed
        "cancelled": ["scheduled"]
        // Can reschedule cancelled jobs
      };
      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return res.status(400).json({
          error: `Cannot transition from ${currentStatus} to ${newStatus}`
        });
      }
      const updated = await storage.updateWorkLogStatus(req.params.id, business.id, newStatus);
      res.json(updated);
    } catch (error) {
      console.error("Error updating job status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/recurring-schedules", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      const schedules = await storage.getRecurringSchedules(business.id);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching recurring schedules:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/recurring-schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const schedule = await storage.getRecurringSchedule(req.params.id, business.id);
      if (!schedule) return res.status(404).json({ error: "Not found" });
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching recurring schedule:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/recurring-schedules", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const validatedData = insertRecurringScheduleSchema.parse({
        ...req.body,
        businessId: business.id
      });
      const schedule = await storage.createRecurringSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating recurring schedule:", error);
      res.status(400).json({ error: "Invalid recurring schedule data" });
    }
  });
  app2.patch("/api/recurring-schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const validatedData = updateRecurringScheduleSchema.parse(req.body);
      const schedule = await storage.updateRecurringSchedule(req.params.id, business.id, validatedData);
      if (!schedule) return res.status(404).json({ error: "Not found" });
      res.json(schedule);
    } catch (error) {
      console.error("Error updating recurring schedule:", error);
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.delete("/api/recurring-schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const deleted = await storage.deleteRecurringSchedule(req.params.id, business.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting recurring schedule:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/recurring-schedules/generate-all", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const { generateRecurringJobs: generateRecurringJobs2 } = await Promise.resolve().then(() => (init_recurringJobService(), recurringJobService_exports));
      const generated = await generateRecurringJobs2(business.id);
      res.json({ generated: generated.length, jobs: generated });
    } catch (error) {
      console.error("Error generating recurring jobs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/google/status", isAuthenticated, async (req, res) => {
    try {
      const { isGoogleCalendarConfigured: isGoogleCalendarConfigured2 } = await Promise.resolve().then(() => (init_googleCalendarService(), googleCalendarService_exports));
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({
        configured: isGoogleCalendarConfigured2(),
        connected: !!user?.googleAccessToken,
        calendarId: user?.googleCalendarId || null
      });
    } catch (error) {
      console.error("Error checking Google status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/google/auth", isAuthenticated, async (req, res) => {
    try {
      const { isGoogleCalendarConfigured: isGoogleCalendarConfigured2, getAuthUrl: getAuthUrl2 } = await Promise.resolve().then(() => (init_googleCalendarService(), googleCalendarService_exports));
      if (!isGoogleCalendarConfigured2()) {
        return res.status(400).json({ error: "Google Calendar not configured" });
      }
      const userId = req.user.claims.sub;
      const authUrl = getAuthUrl2(userId);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      const userId = state;
      if (!code || !userId) {
        return res.redirect("/settings?google=error&message=missing_params");
      }
      const { exchangeCodeForTokens: exchangeCodeForTokens2 } = await Promise.resolve().then(() => (init_googleCalendarService(), googleCalendarService_exports));
      const tokens = await exchangeCodeForTokens2(code);
      const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { eq: eq3 } = await import("drizzle-orm");
      await db2.update(users2).set({
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(users2.id, userId));
      res.redirect("/settings?google=success");
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.redirect("/settings?google=error&message=auth_failed");
    }
  });
  app2.get("/api/google/calendars", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listCalendars: listCalendars2 } = await Promise.resolve().then(() => (init_googleCalendarService(), googleCalendarService_exports));
      const calendars = await listCalendars2(userId);
      res.json(calendars);
    } catch (error) {
      console.error("Error listing calendars:", error);
      if (error.message === "User not connected to Google Calendar") {
        return res.status(401).json({ error: "Not connected to Google Calendar" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/google/calendar", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { calendarId } = req.body;
      if (!calendarId) {
        return res.status(400).json({ error: "calendarId is required" });
      }
      const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { eq: eq3 } = await import("drizzle-orm");
      await db2.update(users2).set({
        googleCalendarId: calendarId,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(users2.id, userId));
      res.json({ success: true, calendarId });
    } catch (error) {
      console.error("Error setting calendar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/google/disconnect", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { disconnectGoogleCalendar: disconnectGoogleCalendar2 } = await Promise.resolve().then(() => (init_googleCalendarService(), googleCalendarService_exports));
      await disconnectGoogleCalendar2(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/google/sync-job/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const workLog = await storage.getWorkLog(req.params.id, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      const { syncJobToCalendar: syncJobToCalendar2 } = await Promise.resolve().then(() => (init_googleCalendarService(), googleCalendarService_exports));
      const event = await syncJobToCalendar2(userId, workLog);
      res.json({ success: true, event });
    } catch (error) {
      console.error("Error syncing job to calendar:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.post("/api/google/sync-all", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const { month } = req.body;
      if (!month) {
        return res.status(400).json({ error: "month is required (YYYY-MM format)" });
      }
      const jobs = await storage.getScheduledJobs(business.id, month);
      const { syncJobToCalendar: syncJobToCalendar2 } = await Promise.resolve().then(() => (init_googleCalendarService(), googleCalendarService_exports));
      let synced = 0;
      const errors = [];
      for (const job of jobs) {
        if (job.scheduledStartTime) {
          try {
            await syncJobToCalendar2(userId, job);
            synced++;
          } catch (err) {
            errors.push(`Job ${job.id}: ${err.message}`);
          }
        }
      }
      res.json({ synced, total: jobs.length, errors });
    } catch (error) {
      console.error("Error syncing all jobs:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.post("/api/google/import", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const { timeMin, timeMax } = req.body;
      if (!timeMin || !timeMax) {
        return res.status(400).json({ error: "timeMin and timeMax are required" });
      }
      const { importCalendarEvents: importCalendarEvents2 } = await Promise.resolve().then(() => (init_googleCalendarService(), googleCalendarService_exports));
      const imported = await importCalendarEvents2(userId, business.id, userId, timeMin, timeMax);
      res.json({ imported: imported.length, jobs: imported });
    } catch (error) {
      console.error("Error importing calendar events:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.json({
          totalJobs: 0,
          weekJobs: 0,
          thisMonthJobs: 0,
          images: 0,
          reports: 0
        });
      }
      const workLogs2 = await storage.getWorkLogs(business.id);
      const now = /* @__PURE__ */ new Date();
      const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekJobs = workLogs2.filter(
        (log) => new Date(log.serviceDate) >= thisWeekStart
      ).length;
      const thisMonthJobs = workLogs2.filter(
        (log) => new Date(log.serviceDate) >= thisMonthStart
      ).length;
      const totalImages = workLogs2.reduce((sum, log) => sum + (log.imageUrls?.length || 0), 0);
      const totalReports = workLogs2.reduce((sum, log) => sum + (log.pdfUrls?.length || 0), 0);
      res.json({
        totalJobs: workLogs2.length,
        weekJobs,
        thisMonthJobs,
        images: totalImages,
        reports: totalReports
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/form-templates", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      const templates = await storage.getFormTemplates(business.id);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching form templates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/form-templates/by-work-type/:workType", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      const templates = await storage.getFormTemplatesByWorkType(business.id, req.params.workType);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching form templates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/form-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const template = await storage.getFormTemplate(req.params.id, business.id);
      if (!template) return res.status(404).json({ error: "Template not found" });
      res.json(template);
    } catch (error) {
      console.error("Error fetching form template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/form-templates", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const validatedData = insertFormTemplateSchema.parse({
        ...req.body,
        businessId: business.id
      });
      const template = await storage.createFormTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating form template:", error);
      res.status(400).json({ error: "Invalid template data" });
    }
  });
  app2.patch("/api/form-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const validatedData = updateFormTemplateSchema.parse(req.body);
      const template = await storage.updateFormTemplate(req.params.id, business.id, validatedData);
      if (!template) return res.status(404).json({ error: "Template not found" });
      res.json(template);
    } catch (error) {
      console.error("Error updating form template:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });
  app2.delete("/api/form-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const deleted = await storage.deleteFormTemplate(req.params.id, business.id);
      if (!deleted) return res.status(404).json({ error: "Template not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting form template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/work-logs/:workLogId/forms", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      const submissions = await storage.getFormSubmissions(req.params.workLogId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/work-logs/:workLogId/forms", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      const validatedData = insertFormSubmissionSchema.parse({
        ...req.body,
        workLogId: req.params.workLogId
      });
      const submission = await storage.createFormSubmission(validatedData);
      if (req.body.tasksToCreate && Array.isArray(req.body.tasksToCreate)) {
        for (const task of req.body.tasksToCreate) {
          await storage.createWorkLogTask({
            workLogId: req.params.workLogId,
            title: task.title,
            description: task.description,
            createdFromForm: submission.id
          });
        }
      }
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating form submission:", error);
      res.status(400).json({ error: "Invalid submission data" });
    }
  });
  app2.get("/api/work-logs/:workLogId/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      const tasks = await storage.getWorkLogTasks(req.params.workLogId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/work-logs/:workLogId/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      const validatedData = insertWorkLogTaskSchema.parse({
        ...req.body,
        workLogId: req.params.workLogId
      });
      const task = await storage.createWorkLogTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ error: "Invalid task data" });
    }
  });
  app2.patch("/api/work-logs/:workLogId/tasks/:taskId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      const validatedData = updateWorkLogTaskSchema.parse(req.body);
      if (validatedData.status === "completed") {
        validatedData.completedAt = /* @__PURE__ */ new Date();
      }
      const task = await storage.updateWorkLogTask(req.params.taskId, req.params.workLogId, validatedData);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });
  app2.delete("/api/work-logs/:workLogId/tasks/:taskId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });
      const deleted = await storage.deleteWorkLogTask(req.params.taskId, req.params.workLogId);
      if (!deleted) return res.status(404).json({ error: "Task not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// api/index.ts
var app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
var initialized = false;
var initPromise = null;
async function initializeApp() {
  if (initialized) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await registerRoutes(app);
    initialized = true;
  })();
  return initPromise;
}
async function handler(req, res) {
  await initializeApp();
  return app(req, res);
}
export {
  handler as default
};
