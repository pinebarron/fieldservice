import {
  users,
  businesses,
  businessMembers,
  vendors,
  properties,
  pricingItems,
  estimates,
  estimateLineItems,
  workLogs,
  apiClients,
  recurringSchedules,
  formTemplates,
  formSubmissions,
  workLogTasks,
  type User,
  type UpsertUser,
  type Business,
  type InsertBusiness,
  type UpdateBusiness,
  type BusinessMember,
  type InsertBusinessMember,
  type Vendor,
  type InsertVendor,
  type UpdateVendor,
  type Property,
  type InsertProperty,
  type UpdateProperty,
  type PricingItem,
  type InsertPricingItem,
  type UpdatePricingItem,
  type Estimate,
  type InsertEstimate,
  type UpdateEstimate,
  type EstimateLineItem,
  type InsertEstimateLineItem,
  type UpdateEstimateLineItem,
  type WorkLog,
  type InsertWorkLog,
  type UpdateWorkLog,
  type ApiClient,
  type RecurringSchedule,
  type InsertRecurringSchedule,
  type UpdateRecurringSchedule,
  type WorkLogStatus,
  type FormTemplate,
  type InsertFormTemplate,
  type UpdateFormTemplate,
  type FormSubmission,
  type InsertFormSubmission,
  type WorkLogTask,
  type InsertWorkLogTask,
  type UpdateWorkLogTask,
} from "@shared/schema";
import crypto from "crypto";
import { db } from "./db";
import { eq, and, desc, sql, ilike, or, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Business operations
  createBusiness(business: InsertBusiness): Promise<Business>;
  getBusiness(id: string): Promise<Business | undefined>;
  getBusinessByOwnerId(ownerId: string): Promise<Business | undefined>;
  getBusinessByUserId(userId: string): Promise<Business | undefined>;
  updateBusiness(id: string, updates: UpdateBusiness): Promise<Business | undefined>;
  
  // Business member operations
  addBusinessMember(member: InsertBusinessMember): Promise<BusinessMember>;
  getBusinessMembers(businessId: string): Promise<(BusinessMember & { user: User })[]>;
  updateBusinessMemberRole(id: string, role: string): Promise<BusinessMember | undefined>;
  removeBusinessMember(id: string): Promise<boolean>;

  // Vendor operations
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  getVendors(businessId: string): Promise<Vendor[]>;
  getVendor(id: string, businessId: string): Promise<Vendor | undefined>;
  updateVendor(id: string, businessId: string, updates: UpdateVendor): Promise<Vendor | undefined>;
  deleteVendor(id: string, businessId: string): Promise<boolean>;

  // Pricing item operations
  createPricingItem(item: InsertPricingItem): Promise<PricingItem>;
  getPricingItems(businessId: string): Promise<PricingItem[]>;
  updatePricingItem(id: string, businessId: string, updates: UpdatePricingItem): Promise<PricingItem | undefined>;
  deletePricingItem(id: string, businessId: string): Promise<boolean>;

  // Estimate operations
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  getEstimates(businessId: string): Promise<Estimate[]>;
  getEstimate(id: string, businessId: string): Promise<Estimate | undefined>;
  updateEstimate(id: string, businessId: string, updates: UpdateEstimate): Promise<Estimate | undefined>;
  deleteEstimate(id: string, businessId: string): Promise<boolean>;
  getEstimateLineItems(estimateId: string): Promise<EstimateLineItem[]>;
  addEstimateLineItem(item: InsertEstimateLineItem): Promise<EstimateLineItem>;
  updateEstimateLineItem(id: string, updates: UpdateEstimateLineItem): Promise<EstimateLineItem | undefined>;
  deleteEstimateLineItem(id: string): Promise<boolean>;
  replaceEstimateLineItems(estimateId: string, items: Omit<InsertEstimateLineItem, "estimateId">[]): Promise<EstimateLineItem[]>;

  // Property operations
  createProperty(property: InsertProperty): Promise<Property>;
  getProperties(businessId: string): Promise<(Property & { workLogCount: number })[]>;
  getProperty(id: string, businessId: string): Promise<Property | undefined>;
  updateProperty(id: string, businessId: string, updates: UpdateProperty): Promise<Property | undefined>;
  deleteProperty(id: string, businessId: string): Promise<boolean>;
  
  // API client operations
  createApiClient(businessId: string, name: string): Promise<{ clientId: string; clientSecret: string; record: ApiClient }>;
  getApiClients(businessId: string): Promise<ApiClient[]>;
  getApiClientByClientId(clientId: string): Promise<ApiClient | undefined>;
  revokeApiClient(id: string, businessId: string): Promise<boolean>;
  verifyApiClient(clientId: string, clientSecret: string): Promise<ApiClient | undefined>;

  // Work log operations
  getWorkLogs(businessId: string): Promise<(WorkLog & { technician: User })[]>;
  getWorkLog(id: string, businessId: string): Promise<WorkLog | undefined>;
  createWorkLog(workLog: InsertWorkLog): Promise<WorkLog>;
  updateWorkLog(id: string, businessId: string, updates: UpdateWorkLog): Promise<WorkLog | undefined>;
  deleteWorkLog(id: string, businessId: string): Promise<boolean>;
  getWorkLogsByFilter(businessId: string, filters: {
    workType?: string;
    customerName?: string;
    technicianUserId?: string;
    dateFrom?: string;
    dateTo?: string;
    propertyId?: string;
  }): Promise<(WorkLog & { technician: User })[]>;

  // Schedule operations
  getScheduledJobs(businessId: string, month: string): Promise<(WorkLog & { technician: User })[]>;
  updateWorkLogStatus(id: string, businessId: string, status: WorkLogStatus): Promise<WorkLog | undefined>;

  // Recurring schedule operations
  getRecurringSchedules(businessId: string): Promise<RecurringSchedule[]>;
  getRecurringSchedule(id: string, businessId: string): Promise<RecurringSchedule | undefined>;
  createRecurringSchedule(schedule: InsertRecurringSchedule): Promise<RecurringSchedule>;
  updateRecurringSchedule(id: string, businessId: string, updates: UpdateRecurringSchedule): Promise<RecurringSchedule | undefined>;
  deleteRecurringSchedule(id: string, businessId: string): Promise<boolean>;
  getActiveRecurringSchedules(businessId: string): Promise<RecurringSchedule[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Business operations
  async createBusiness(businessData: InsertBusiness): Promise<Business> {
    const [business] = await db.insert(businesses).values(businessData).returning();
    return business;
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async getBusinessByOwnerId(ownerId: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, ownerId));
    return business;
  }

  async getBusinessByUserId(userId: string): Promise<Business | undefined> {
    // Check owner first
    const [owned] = await db.select().from(businesses).where(eq(businesses.ownerId, userId));
    if (owned) return owned;
    // Fall back to member lookup
    const [membership] = await db
      .select({ business: businesses })
      .from(businessMembers)
      .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
      .where(eq(businessMembers.userId, userId));
    return membership?.business;
  }

  async updateBusiness(id: string, updates: UpdateBusiness): Promise<Business | undefined> {
    const [business] = await db
      .update(businesses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return business;
  }

  // Business member operations
  async addBusinessMember(memberData: InsertBusinessMember): Promise<BusinessMember> {
    const [member] = await db.insert(businessMembers).values(memberData).returning();
    return member;
  }

  async getBusinessMembers(businessId: string): Promise<(BusinessMember & { user: User })[]> {
    const members = await db
      .select({
        id: businessMembers.id,
        businessId: businessMembers.businessId,
        userId: businessMembers.userId,
        role: businessMembers.role,
        createdAt: businessMembers.createdAt,
        user: users,
      })
      .from(businessMembers)
      .innerJoin(users, eq(businessMembers.userId, users.id))
      .where(eq(businessMembers.businessId, businessId));
    return members;
  }

  async updateBusinessMemberRole(id: string, role: string): Promise<BusinessMember | undefined> {
    const [member] = await db
      .update(businessMembers)
      .set({ role })
      .where(eq(businessMembers.id, id))
      .returning();
    return member;
  }

  async removeBusinessMember(id: string): Promise<boolean> {
    const result = await db.delete(businessMembers).where(eq(businessMembers.id, id));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }

  // Vendor operations
  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(vendorData as any).returning();
    return vendor;
  }

  async getVendors(businessId: string): Promise<Vendor[]> {
    return db
      .select()
      .from(vendors)
      .where(eq(vendors.businessId, businessId))
      .orderBy(desc(vendors.createdAt));
  }

  async getVendor(id: string, businessId: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.businessId, businessId)));
    return vendor;
  }

  async updateVendor(id: string, businessId: string, updates: UpdateVendor): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(vendors.id, id), eq(vendors.businessId, businessId)))
      .returning();
    return vendor;
  }

  async deleteVendor(id: string, businessId: string): Promise<boolean> {
    const result = await db
      .delete(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.businessId, businessId)));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }

  // Pricing item operations
  async createPricingItem(itemData: InsertPricingItem): Promise<PricingItem> {
    const [item] = await db.insert(pricingItems).values(itemData as any).returning();
    return item;
  }

  async getPricingItems(businessId: string): Promise<PricingItem[]> {
    return db
      .select()
      .from(pricingItems)
      .where(eq(pricingItems.businessId, businessId))
      .orderBy(pricingItems.category, pricingItems.name);
  }

  async updatePricingItem(id: string, businessId: string, updates: UpdatePricingItem): Promise<PricingItem | undefined> {
    const [item] = await db
      .update(pricingItems)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(pricingItems.id, id), eq(pricingItems.businessId, businessId)))
      .returning();
    return item;
  }

  async deletePricingItem(id: string, businessId: string): Promise<boolean> {
    const result = await db
      .delete(pricingItems)
      .where(and(eq(pricingItems.id, id), eq(pricingItems.businessId, businessId)));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }

  // Estimate operations
  async createEstimate(estimateData: InsertEstimate): Promise<Estimate> {
    const [estimate] = await db.insert(estimates).values(estimateData as any).returning();
    return estimate;
  }

  async getEstimates(businessId: string): Promise<Estimate[]> {
    return db
      .select()
      .from(estimates)
      .where(eq(estimates.businessId, businessId))
      .orderBy(desc(estimates.createdAt));
  }

  async getEstimate(id: string, businessId: string): Promise<Estimate | undefined> {
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)));
    return estimate;
  }

  async updateEstimate(id: string, businessId: string, updates: UpdateEstimate): Promise<Estimate | undefined> {
    const [estimate] = await db
      .update(estimates)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)))
      .returning();
    return estimate;
  }

  async deleteEstimate(id: string, businessId: string): Promise<boolean> {
    await db.delete(estimateLineItems).where(eq(estimateLineItems.estimateId, id));
    const result = await db
      .delete(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }

  async getEstimateLineItems(estimateId: string): Promise<EstimateLineItem[]> {
    return db
      .select()
      .from(estimateLineItems)
      .where(eq(estimateLineItems.estimateId, estimateId))
      .orderBy(estimateLineItems.sortOrder);
  }

  async addEstimateLineItem(item: InsertEstimateLineItem): Promise<EstimateLineItem> {
    const [lineItem] = await db.insert(estimateLineItems).values(item as any).returning();
    return lineItem;
  }

  async updateEstimateLineItem(id: string, updates: UpdateEstimateLineItem): Promise<EstimateLineItem | undefined> {
    const [lineItem] = await db
      .update(estimateLineItems)
      .set(updates as any)
      .where(eq(estimateLineItems.id, id))
      .returning();
    return lineItem;
  }

  async deleteEstimateLineItem(id: string): Promise<boolean> {
    const result = await db.delete(estimateLineItems).where(eq(estimateLineItems.id, id));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }

  async replaceEstimateLineItems(estimateId: string, items: Omit<InsertEstimateLineItem, "estimateId">[]): Promise<EstimateLineItem[]> {
    await db.delete(estimateLineItems).where(eq(estimateLineItems.estimateId, estimateId));
    if (items.length === 0) return [];
    const toInsert = items.map((item, i) => ({ ...item, estimateId, sortOrder: String(i) }));
    return db.insert(estimateLineItems).values(toInsert as any).returning();
  }

  // Property operations
  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(propertyData).returning();
    return property;
  }

  async getProperties(businessId: string): Promise<(Property & { workLogCount: number })[]> {
    const props = await db
      .select()
      .from(properties)
      .where(eq(properties.businessId, businessId))
      .orderBy(desc(properties.createdAt));

    const withCounts = await Promise.all(
      props.map(async (p) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(workLogs)
          .where(eq(workLogs.propertyId, p.id));
        return { ...p, workLogCount: count };
      })
    );
    return withCounts;
  }

  async getProperty(id: string, businessId: string): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, id), eq(properties.businessId, businessId)));
    return property;
  }

  async updateProperty(id: string, businessId: string, updates: UpdateProperty): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(properties.id, id), eq(properties.businessId, businessId)))
      .returning();
    return property;
  }

  async deleteProperty(id: string, businessId: string): Promise<boolean> {
    // Unlink work logs from this property first
    await db
      .update(workLogs)
      .set({ propertyId: null })
      .where(and(eq(workLogs.propertyId, id), eq(workLogs.businessId, businessId)));
    const result = await db
      .delete(properties)
      .where(and(eq(properties.id, id), eq(properties.businessId, businessId)));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }

  // Work log operations
  async getWorkLogs(businessId: string): Promise<(WorkLog & { technician: User })[]> {
    const logs = await db
      .select({
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
        technician: users,
      })
      .from(workLogs)
      .innerJoin(users, eq(workLogs.technicianUserId, users.id))
      .where(eq(workLogs.businessId, businessId))
      .orderBy(desc(workLogs.createdAt));
    return logs;
  }

  async getWorkLog(id: string, businessId: string): Promise<WorkLog | undefined> {
    const [log] = await db
      .select()
      .from(workLogs)
      .where(and(eq(workLogs.id, id), eq(workLogs.businessId, businessId)));
    return log;
  }

  async createApiClient(businessId: string, name: string): Promise<{ clientId: string; clientSecret: string; record: ApiClient }> {
    const clientId = `fc_id_${crypto.randomBytes(12).toString("hex")}`;
    const clientSecret = `fc_secret_${crypto.randomBytes(24).toString("hex")}`;
    const clientSecretHash = crypto.createHash("sha256").update(clientSecret).digest("hex");
    const [record] = await db.insert(apiClients).values({ businessId, name, clientId, clientSecretHash }).returning();
    return { clientId, clientSecret, record };
  }

  async getApiClients(businessId: string): Promise<ApiClient[]> {
    return db.select().from(apiClients).where(eq(apiClients.businessId, businessId)).orderBy(desc(apiClients.createdAt));
  }

  async getApiClientByClientId(clientId: string): Promise<ApiClient | undefined> {
    const [record] = await db.select().from(apiClients).where(eq(apiClients.clientId, clientId));
    return record;
  }

  async revokeApiClient(id: string, businessId: string): Promise<boolean> {
    const [updated] = await db
      .update(apiClients)
      .set({ isActive: "false" })
      .where(and(eq(apiClients.id, id), eq(apiClients.businessId, businessId)))
      .returning();
    return !!updated;
  }

  async verifyApiClient(clientId: string, clientSecret: string): Promise<ApiClient | undefined> {
    const record = await this.getApiClientByClientId(clientId);
    if (!record || record.isActive !== "true") return undefined;
    const hash = crypto.createHash("sha256").update(clientSecret).digest("hex");
    if (hash !== record.clientSecretHash) return undefined;
    return record;
  }

  async createWorkLog(workLogData: InsertWorkLog): Promise<WorkLog> {
    const [workLog] = await db.insert(workLogs).values(workLogData as any).returning();
    return workLog;
  }

  async updateWorkLog(id: string, businessId: string, updates: UpdateWorkLog): Promise<WorkLog | undefined> {
    const [workLog] = await db
      .update(workLogs)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(workLogs.id, id), eq(workLogs.businessId, businessId)))
      .returning();
    return workLog;
  }

  async deleteWorkLog(id: string, businessId: string): Promise<boolean> {
    const result = await db
      .delete(workLogs)
      .where(and(eq(workLogs.id, id), eq(workLogs.businessId, businessId)));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }

  async getWorkLogsByFilter(
    businessId: string,
    filters: {
      workType?: string;
      customerName?: string;
      technicianUserId?: string;
      dateFrom?: string;
      dateTo?: string;
      propertyId?: string;
    }
  ): Promise<(WorkLog & { technician: User })[]> {
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
      conditions.push(sql`${workLogs.serviceDate} >= ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
      conditions.push(sql`${workLogs.serviceDate} <= ${filters.dateTo}`);
    }

    if (filters.propertyId) {
      conditions.push(eq(workLogs.propertyId, filters.propertyId));
    }

    const logs = await db
      .select({
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
        technician: users,
      })
      .from(workLogs)
      .innerJoin(users, eq(workLogs.technicianUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(workLogs.createdAt));
    return logs;
  }

  // Schedule operations
  async getScheduledJobs(businessId: string, month: string): Promise<(WorkLog & { technician: User })[]> {
    // month is in YYYY-MM format
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(monthNum + 1 > 12 ? 1 : monthNum + 1).padStart(2, "0")}-01`;
    const endYear = monthNum + 1 > 12 ? year + 1 : year;
    const adjustedEndDate = `${endYear}-${String(monthNum + 1 > 12 ? 1 : monthNum + 1).padStart(2, "0")}-01`;

    const logs = await db
      .select({
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
        technician: users,
      })
      .from(workLogs)
      .innerJoin(users, eq(workLogs.technicianUserId, users.id))
      .where(
        and(
          eq(workLogs.businessId, businessId),
          sql`${workLogs.serviceDate} >= ${startDate}`,
          sql`${workLogs.serviceDate} < ${adjustedEndDate}`
        )
      )
      .orderBy(workLogs.serviceDate, workLogs.scheduledStartTime);
    return logs;
  }

  async updateWorkLogStatus(id: string, businessId: string, status: WorkLogStatus): Promise<WorkLog | undefined> {
    const [workLog] = await db
      .update(workLogs)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(workLogs.id, id), eq(workLogs.businessId, businessId)))
      .returning();
    return workLog;
  }

  // Recurring schedule operations
  async getRecurringSchedules(businessId: string): Promise<RecurringSchedule[]> {
    return db
      .select()
      .from(recurringSchedules)
      .where(eq(recurringSchedules.businessId, businessId))
      .orderBy(desc(recurringSchedules.createdAt));
  }

  async getRecurringSchedule(id: string, businessId: string): Promise<RecurringSchedule | undefined> {
    const [schedule] = await db
      .select()
      .from(recurringSchedules)
      .where(and(eq(recurringSchedules.id, id), eq(recurringSchedules.businessId, businessId)));
    return schedule;
  }

  async createRecurringSchedule(scheduleData: InsertRecurringSchedule): Promise<RecurringSchedule> {
    const [schedule] = await db.insert(recurringSchedules).values(scheduleData as any).returning();
    return schedule;
  }

  async updateRecurringSchedule(id: string, businessId: string, updates: UpdateRecurringSchedule): Promise<RecurringSchedule | undefined> {
    const [schedule] = await db
      .update(recurringSchedules)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(recurringSchedules.id, id), eq(recurringSchedules.businessId, businessId)))
      .returning();
    return schedule;
  }

  async deleteRecurringSchedule(id: string, businessId: string): Promise<boolean> {
    const result = await db
      .delete(recurringSchedules)
      .where(and(eq(recurringSchedules.id, id), eq(recurringSchedules.businessId, businessId)));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }

  async getActiveRecurringSchedules(businessId: string): Promise<RecurringSchedule[]> {
    return db
      .select()
      .from(recurringSchedules)
      .where(
        and(
          eq(recurringSchedules.businessId, businessId),
          eq(recurringSchedules.isActive, "true")
        )
      );
  }

  // Form template operations
  async getFormTemplates(businessId: string): Promise<FormTemplate[]> {
    return db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.businessId, businessId))
      .orderBy(desc(formTemplates.createdAt));
  }

  async getFormTemplate(id: string, businessId: string): Promise<FormTemplate | undefined> {
    const [template] = await db
      .select()
      .from(formTemplates)
      .where(and(eq(formTemplates.id, id), eq(formTemplates.businessId, businessId)));
    return template;
  }

  async getFormTemplatesByWorkType(businessId: string, workType: string): Promise<FormTemplate[]> {
    return db
      .select()
      .from(formTemplates)
      .where(
        and(
          eq(formTemplates.businessId, businessId),
          eq(formTemplates.isActive, "true"),
          or(eq(formTemplates.workType, workType), isNull(formTemplates.workType))
        )
      );
  }

  async createFormTemplate(templateData: InsertFormTemplate): Promise<FormTemplate> {
    const [template] = await db.insert(formTemplates).values(templateData as any).returning();
    return template;
  }

  async updateFormTemplate(id: string, businessId: string, updates: UpdateFormTemplate): Promise<FormTemplate | undefined> {
    const [template] = await db
      .update(formTemplates)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(formTemplates.id, id), eq(formTemplates.businessId, businessId)))
      .returning();
    return template;
  }

  async deleteFormTemplate(id: string, businessId: string): Promise<boolean> {
    const result = await db
      .delete(formTemplates)
      .where(and(eq(formTemplates.id, id), eq(formTemplates.businessId, businessId)));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }

  // Form submission operations
  async getFormSubmissions(workLogId: string): Promise<(FormSubmission & { template: FormTemplate })[]> {
    return db
      .select({
        id: formSubmissions.id,
        workLogId: formSubmissions.workLogId,
        templateId: formSubmissions.templateId,
        responses: formSubmissions.responses,
        submittedAt: formSubmissions.submittedAt,
        template: formTemplates,
      })
      .from(formSubmissions)
      .innerJoin(formTemplates, eq(formSubmissions.templateId, formTemplates.id))
      .where(eq(formSubmissions.workLogId, workLogId));
  }

  async createFormSubmission(submissionData: InsertFormSubmission): Promise<FormSubmission> {
    const [submission] = await db.insert(formSubmissions).values(submissionData as any).returning();
    return submission;
  }

  // Work log task operations
  async getWorkLogTasks(workLogId: string): Promise<WorkLogTask[]> {
    return db
      .select()
      .from(workLogTasks)
      .where(eq(workLogTasks.workLogId, workLogId))
      .orderBy(workLogTasks.createdAt);
  }

  async createWorkLogTask(taskData: InsertWorkLogTask): Promise<WorkLogTask> {
    const [task] = await db.insert(workLogTasks).values(taskData as any).returning();
    return task;
  }

  async updateWorkLogTask(id: string, workLogId: string, updates: UpdateWorkLogTask): Promise<WorkLogTask | undefined> {
    const [task] = await db
      .update(workLogTasks)
      .set(updates as any)
      .where(and(eq(workLogTasks.id, id), eq(workLogTasks.workLogId, workLogId)))
      .returning();
    return task;
  }

  async deleteWorkLogTask(id: string, workLogId: string): Promise<boolean> {
    const result = await db
      .delete(workLogTasks)
      .where(and(eq(workLogTasks.id, id), eq(workLogTasks.workLogId, workLogId)));
    return (result as any).rowCount ? (result as any).rowCount > 0 : true;
  }
}

export const storage = new DatabaseStorage();
