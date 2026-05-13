import {
  users,
  businesses,
  businessMembers,
  vendors,
  properties,
  workLogs,
  type User,
  type UpsertUser,
  type Business,
  type InsertBusiness,
  type BusinessMember,
  type InsertBusinessMember,
  type Vendor,
  type InsertVendor,
  type UpdateVendor,
  type Property,
  type InsertProperty,
  type UpdateProperty,
  type WorkLog,
  type InsertWorkLog,
  type UpdateWorkLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike } from "drizzle-orm";

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
  updateBusiness(id: string, name: string): Promise<Business | undefined>;
  
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

  // Property operations
  createProperty(property: InsertProperty): Promise<Property>;
  getProperties(businessId: string): Promise<(Property & { workLogCount: number })[]>;
  getProperty(id: string, businessId: string): Promise<Property | undefined>;
  updateProperty(id: string, businessId: string, updates: UpdateProperty): Promise<Property | undefined>;
  deleteProperty(id: string, businessId: string): Promise<boolean>;
  
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

  async updateBusiness(id: string, name: string): Promise<Business | undefined> {
    const [business] = await db
      .update(businesses)
      .set({ name, updatedAt: new Date() })
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
    return result.rowCount ? result.rowCount > 0 : false;
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
    return result.rowCount ? result.rowCount > 0 : false;
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
    return result.rowCount ? result.rowCount > 0 : false;
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
    return result.rowCount ? result.rowCount > 0 : false;
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
}

export const storage = new DatabaseStorage();
