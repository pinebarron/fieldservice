import { type User, type InsertUser, type WorkLog, type InsertWorkLog, type UpdateWorkLog } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getWorkLogs(): Promise<WorkLog[]>;
  getWorkLog(id: string): Promise<WorkLog | undefined>;
  createWorkLog(workLog: InsertWorkLog): Promise<WorkLog>;
  updateWorkLog(id: string, updates: UpdateWorkLog): Promise<WorkLog | undefined>;
  deleteWorkLog(id: string): Promise<boolean>;
  getWorkLogsByFilter(filters: {
    workType?: string;
    customerName?: string;
    technicianName?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<WorkLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workLogs: Map<string, WorkLog>;

  constructor() {
    this.users = new Map();
    this.workLogs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWorkLogs(): Promise<WorkLog[]> {
    return Array.from(this.workLogs.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getWorkLog(id: string): Promise<WorkLog | undefined> {
    return this.workLogs.get(id);
  }

  async createWorkLog(insertWorkLog: InsertWorkLog): Promise<WorkLog> {
    const id = randomUUID();
    const now = new Date();
    const workLog: WorkLog = {
      ...insertWorkLog,
      id,
      imageUrls: (insertWorkLog.imageUrls || []) as string[],
      pdfUrls: (insertWorkLog.pdfUrls || []) as string[],
      createdAt: now,
      updatedAt: now,
    };
    this.workLogs.set(id, workLog);
    return workLog;
  }

  async updateWorkLog(id: string, updates: UpdateWorkLog): Promise<WorkLog | undefined> {
    const existingWorkLog = this.workLogs.get(id);
    if (!existingWorkLog) {
      return undefined;
    }

    const updatedWorkLog: WorkLog = {
      ...existingWorkLog,
      ...updates,
      updatedAt: new Date(),
    };
    this.workLogs.set(id, updatedWorkLog);
    return updatedWorkLog;
  }

  async deleteWorkLog(id: string): Promise<boolean> {
    return this.workLogs.delete(id);
  }

  async getWorkLogsByFilter(filters: {
    workType?: string;
    customerName?: string;
    technicianName?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<WorkLog[]> {
    let workLogs = await this.getWorkLogs();

    if (filters.workType) {
      workLogs = workLogs.filter(log => 
        log.workType.toLowerCase().includes(filters.workType!.toLowerCase())
      );
    }

    if (filters.customerName) {
      workLogs = workLogs.filter(log => 
        log.customerName.toLowerCase().includes(filters.customerName!.toLowerCase())
      );
    }

    if (filters.technicianName) {
      workLogs = workLogs.filter(log => 
        log.technicianName.toLowerCase().includes(filters.technicianName!.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      workLogs = workLogs.filter(log => log.serviceDate >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      workLogs = workLogs.filter(log => log.serviceDate <= filters.dateTo!);
    }

    return workLogs;
  }
}

export const storage = new MemStorage();
