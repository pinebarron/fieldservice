import {
  users,
  businesses,
  businessMembers,
  workLogs,
  type User,
  type UpsertUser,
  type Business,
  type InsertBusiness,
  type BusinessMember,
  type InsertBusinessMember,
  type WorkLog,
  type InsertWorkLog,
  type UpdateWorkLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Business operations
  createBusiness(business: InsertBusiness): Promise<Business>;
  getBusiness(id: string): Promise<Business | undefined>;
  getBusinessByOwnerId(ownerId: string): Promise<Business | undefined>;
  updateBusiness(id: string, name: string): Promise<Business | undefined>;
  
  // Business member operations
  addBusinessMember(member: InsertBusinessMember): Promise<BusinessMember>;
  getBusinessMembers(businessId: string): Promise<(BusinessMember & { user: User })[]>;
  removeBusinessMember(id: string): Promise<boolean>;
  
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
  }): Promise<(WorkLog & { technician: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async removeBusinessMember(id: string): Promise<boolean> {
    const result = await db.delete(businessMembers).where(eq(businessMembers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Work log operations
  async getWorkLogs(businessId: string): Promise<(WorkLog & { technician: User })[]> {
    const logs = await db
      .select({
        id: workLogs.id,
        businessId: workLogs.businessId,
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
    const [workLog] = await db.insert(workLogs).values(workLogData).returning();
    return workLog;
  }

  async updateWorkLog(id: string, businessId: string, updates: UpdateWorkLog): Promise<WorkLog | undefined> {
    const [workLog] = await db
      .update(workLogs)
      .set({ ...updates, updatedAt: new Date() })
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

    const logs = await db
      .select({
        id: workLogs.id,
        businessId: workLogs.businessId,
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
