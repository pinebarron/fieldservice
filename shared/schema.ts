import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Work logs table
export const workLogs = pgTable("work_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
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
  imageUrls: json("image_urls").$type<string[]>().default([]),
  pdfUrls: json("pdf_urls").$type<string[]>().default([]),
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
export const insertBusinessMemberSchema = createInsertSchema(businessMembers).omit({
  id: true,
  createdAt: true,
});
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
export type BusinessMember = typeof businessMembers.$inferSelect;
export type InsertBusinessMember = z.infer<typeof insertBusinessMemberSchema>;
export type WorkLog = typeof workLogs.$inferSelect;
export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type UpdateWorkLog = z.infer<typeof updateWorkLogSchema>;
