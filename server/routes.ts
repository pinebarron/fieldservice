import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkLogSchema, updateWorkLogSchema } from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  const objectStorageService = new ObjectStorageService();

  // Work Log Routes
  app.get("/api/work-logs", async (req, res) => {
    try {
      const { workType, customerName, technicianName, dateFrom, dateTo } = req.query;
      
      const filters = {
        workType: workType as string,
        customerName: customerName as string, 
        technicianName: technicianName as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };

      const workLogs = await storage.getWorkLogsByFilter(filters);
      res.json(workLogs);
    } catch (error) {
      console.error("Error fetching work logs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/work-logs/:id", async (req, res) => {
    try {
      const workLog = await storage.getWorkLog(req.params.id);
      if (!workLog) {
        return res.status(404).json({ error: "Work log not found" });
      }
      res.json(workLog);
    } catch (error) {
      console.error("Error fetching work log:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/work-logs", async (req, res) => {
    try {
      const validatedData = insertWorkLogSchema.parse(req.body);
      const workLog = await storage.createWorkLog(validatedData);
      res.status(201).json(workLog);
    } catch (error) {
      console.error("Error creating work log:", error);
      res.status(400).json({ error: "Invalid work log data" });
    }
  });

  app.put("/api/work-logs/:id", async (req, res) => {
    try {
      const validatedData = updateWorkLogSchema.parse(req.body);
      const workLog = await storage.updateWorkLog(req.params.id, validatedData);
      if (!workLog) {
        return res.status(404).json({ error: "Work log not found" });
      }
      res.json(workLog);
    } catch (error) {
      console.error("Error updating work log:", error);
      res.status(400).json({ error: "Invalid work log data" });
    }
  });

  app.delete("/api/work-logs/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkLog(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Work log not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting work log:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object Storage Routes
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/objects/finalize", async (req, res) => {
    if (!req.body.objectUrl) {
      return res.status(400).json({ error: "objectUrl is required" });
    }

    try {
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.objectUrl,
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error finalizing object:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const workLogs = await storage.getWorkLogs();
      const now = new Date();
      const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const weekJobs = workLogs.filter(log => 
        new Date(log.serviceDate) >= thisWeekStart
      ).length;
      
      const thisMonthJobs = workLogs.filter(log => 
        new Date(log.serviceDate) >= thisMonthStart
      ).length;
      
      const totalImages = workLogs.reduce((sum, log) => sum + (log.imageUrls?.length || 0), 0);
      const totalReports = workLogs.reduce((sum, log) => sum + (log.pdfUrls?.length || 0), 0);

      res.json({
        totalJobs: workLogs.length,
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

  const httpServer = createServer(app);
  return httpServer;
}
