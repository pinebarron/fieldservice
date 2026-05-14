import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkLogSchema, updateWorkLogSchema, insertBusinessSchema, updateBusinessSchema, insertBusinessMemberSchema, insertVendorSchema, updateVendorSchema, insertPropertySchema, updatePropertySchema, insertPricingItemSchema, updatePricingItemSchema, insertEstimateSchema, updateEstimateSchema, insertEstimateLineItemSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  const objectStorageService = new ObjectStorageService();

  // Setup authentication (from Replit Auth blueprint)
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Business routes
  app.post("/api/business", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has a business
      const existingBusiness = await storage.getBusinessByOwnerId(userId);
      if (existingBusiness) {
        return res.status(400).json({ error: "User already has a business" });
      }

      const validatedData = insertBusinessSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      const business = await storage.createBusiness(validatedData);
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      res.status(400).json({ error: "Invalid business data" });
    }
  });

  app.get("/api/business", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      res.json(business || null);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/business/settings", isAuthenticated, async (req: any, res) => {
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

  // Business member routes
  app.get("/api/business/members", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/business/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      const { email, firstName, lastName, role = "technician" } = req.body;
      
      // Create or get user
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({
          id: crypto.randomUUID(),
          email,
          firstName,
          lastName,
          profileImageUrl: null,
        });
      }

      const validatedData = insertBusinessMemberSchema.parse({
        userId: user.id,
        role,
        businessId: business.id,
      });
      const member = await storage.addBusinessMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding business member:", error);
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.patch("/api/business/members/:id/role", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/business/members/:id", isAuthenticated, async (req: any, res) => {
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

  // Vendor Routes
  app.post("/api/vendors", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/vendors", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/vendors/:id", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/vendors/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/vendors/:id", isAuthenticated, async (req: any, res) => {
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

  // Property Routes
  app.post("/api/properties", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/properties", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/properties/:id", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/properties/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/properties/:id", isAuthenticated, async (req: any, res) => {
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

  // Pricing Item Routes
  app.get("/api/pricing-items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      res.json(await storage.getPricingItems(business.id));
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
  });

  app.post("/api/pricing-items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const data = insertPricingItemSchema.parse({ ...req.body, businessId: business.id });
      res.status(201).json(await storage.createPricingItem(data));
    } catch (e) { res.status(400).json({ error: "Invalid data" }); }
  });

  app.patch("/api/pricing-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const data = updatePricingItemSchema.parse(req.body);
      const item = await storage.updatePricingItem(req.params.id, business.id, data);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e) { res.status(400).json({ error: "Invalid data" }); }
  });

  app.delete("/api/pricing-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const deleted = await storage.deletePricingItem(req.params.id, business.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
  });

  // Estimate Routes
  app.post("/api/estimates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });
      const data = insertEstimateSchema.parse({ ...req.body, businessId: business.id });
      res.status(201).json(await storage.createEstimate(data));
    } catch (e) { console.error(e); res.status(400).json({ error: "Invalid data" }); }
  });

  app.get("/api/estimates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);
      res.json(await storage.getEstimates(business.id));
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
  });

  app.get("/api/estimates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const estimate = await storage.getEstimate(req.params.id, business.id);
      if (!estimate) return res.status(404).json({ error: "Not found" });
      const lineItems = await storage.getEstimateLineItems(estimate.id);
      res.json({ ...estimate, lineItems });
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
  });

  app.patch("/api/estimates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const { lineItems, ...rest } = req.body;
      const data = (await import("@shared/schema")).updateEstimateSchema.parse(rest);
      const estimate = await storage.updateEstimate(req.params.id, business.id, data);
      if (!estimate) return res.status(404).json({ error: "Not found" });
      if (lineItems !== undefined) {
        await storage.replaceEstimateLineItems(req.params.id, lineItems);
      }
      const updatedLineItems = await storage.getEstimateLineItems(req.params.id);
      res.json({ ...estimate, lineItems: updatedLineItems });
    } catch (e) { console.error(e); res.status(400).json({ error: "Invalid data" }); }
  });

  app.delete("/api/estimates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Not found" });
      const deleted = await storage.deleteEstimate(req.params.id, business.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
  });

  // Work Log Routes (all protected)
  app.get("/api/work-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.json([]);
      }

      const { workType, customerName, technicianUserId, dateFrom, dateTo, propertyId } = req.query;
      
      const filters = {
        workType: workType as string,
        customerName: customerName as string, 
        technicianUserId: technicianUserId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        propertyId: propertyId as string,
      };

      const workLogs = await storage.getWorkLogsByFilter(business.id, filters);
      res.json(workLogs);
    } catch (error) {
      console.error("Error fetching work logs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/work-logs/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/work-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) {
        return res.status(400).json({ error: "Business not found" });
      }

      const validatedData = insertWorkLogSchema.parse({
        ...req.body,
        businessId: business.id,
      });
      const workLog = await storage.createWorkLog(validatedData);
      res.status(201).json(workLog);
    } catch (error) {
      console.error("Error creating work log:", error);
      res.status(400).json({ error: "Invalid work log data" });
    }
  });

  app.put("/api/work-logs/:id", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/work-logs/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/work-logs/:id", isAuthenticated, async (req: any, res) => {
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

  // Developer API client routes (session auth only — cannot use API keys to manage API keys)
  app.get("/api/developer/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      if (business.ownerId !== userId) return res.status(403).json({ error: "Only the owner can manage API clients" });
      const clients = await storage.getApiClients(business.id);
      res.json(clients.map(c => ({ ...c, clientSecretHash: undefined })));
    } catch (error) {
      console.error("Error fetching API clients:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/developer/clients", isAuthenticated, async (req: any, res) => {
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
        clientSecretHash: undefined,
        clientSecret: result.clientSecret,
      });
    } catch (error) {
      console.error("Error creating API client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/developer/clients/:id", isAuthenticated, async (req: any, res) => {
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

  // Check-in route
  app.post("/api/work-logs/:id/check-in", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const { lat, lng } = req.body;
      const updates: any = { checkInTime: new Date().toISOString() };
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

  // Check-out route
  app.post("/api/work-logs/:id/check-out", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });
      const { lat, lng } = req.body;
      const updates: any = { checkOutTime: new Date().toISOString() };
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
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
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

      const workLogs = await storage.getWorkLogs(business.id);
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
