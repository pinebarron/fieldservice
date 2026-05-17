import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkLogSchema, updateWorkLogSchema, insertBusinessSchema, updateBusinessSchema, insertBusinessMemberSchema, insertVendorSchema, updateVendorSchema, insertPropertySchema, updatePropertySchema, insertPricingItemSchema, updatePricingItemSchema, insertEstimateSchema, updateEstimateSchema, insertEstimateLineItemSchema, insertRecurringScheduleSchema, updateRecurringScheduleSchema, workLogStatusSchema, insertFormTemplateSchema, updateFormTemplateSchema, insertFormSubmissionSchema, insertWorkLogTaskSchema, updateWorkLogTaskSchema } from "@shared/schema";
import { objectStorageService, ObjectNotFoundError } from "./supabaseStorage";
import { setupAuth, isAuthenticated } from "./supabaseAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // objectStorageService is imported as singleton from supabaseStorage

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
      await objectStorageService.downloadObject(req.path, res);
    } catch (error) {
      console.error("Error downloading object:", error);
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

  // Schedule Routes
  app.get("/api/schedule/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);

      const month = req.query.month as string;
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

  app.post("/api/schedule/jobs", isAuthenticated, async (req: any, res) => {
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
        status: "scheduled",
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

  app.post("/api/work-logs/:id/start", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/work-logs/:id/complete", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/work-logs/:id/status", isAuthenticated, async (req: any, res) => {
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

      // Validate status transitions
      const currentStatus = workLog.status;
      const newStatus = parsedStatus.data;

      const validTransitions: Record<string, string[]> = {
        "scheduled": ["in-progress", "cancelled"],
        "in-progress": ["completed", "cancelled"],
        "completed": [], // Cannot transition from completed
        "cancelled": ["scheduled"], // Can reschedule cancelled jobs
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

  // Recurring Schedule Routes
  app.get("/api/recurring-schedules", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/recurring-schedules/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/recurring-schedules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });

      const validatedData = insertRecurringScheduleSchema.parse({
        ...req.body,
        businessId: business.id,
      });
      const schedule = await storage.createRecurringSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating recurring schedule:", error);
      res.status(400).json({ error: "Invalid recurring schedule data" });
    }
  });

  app.patch("/api/recurring-schedules/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/recurring-schedules/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/recurring-schedules/generate-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });

      const { generateRecurringJobs } = await import("./recurringJobService");
      const generated = await generateRecurringJobs(business.id);
      res.json({ generated: generated.length, jobs: generated });
    } catch (error) {
      console.error("Error generating recurring jobs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Google Calendar Integration Routes
  app.get("/api/google/status", isAuthenticated, async (req: any, res) => {
    try {
      const { isGoogleCalendarConfigured } = await import("./googleCalendarService");
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      res.json({
        configured: isGoogleCalendarConfigured(),
        connected: !!(user?.googleAccessToken),
        calendarId: user?.googleCalendarId || null,
      });
    } catch (error) {
      console.error("Error checking Google status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/google/auth", isAuthenticated, async (req: any, res) => {
    try {
      const { isGoogleCalendarConfigured, getAuthUrl } = await import("./googleCalendarService");

      if (!isGoogleCalendarConfigured()) {
        return res.status(400).json({ error: "Google Calendar not configured" });
      }

      const userId = req.user.claims.sub;
      const authUrl = getAuthUrl(userId);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/google/callback", async (req: any, res) => {
    try {
      const { code, state } = req.query;
      const userId = state as string;

      if (!code || !userId) {
        return res.redirect("/settings?google=error&message=missing_params");
      }

      const { exchangeCodeForTokens } = await import("./googleCalendarService");
      const tokens = await exchangeCodeForTokens(code as string);

      // Save tokens to user
      const { users } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");

      await db.update(users).set({
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));

      res.redirect("/settings?google=success");
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.redirect("/settings?google=error&message=auth_failed");
    }
  });

  app.get("/api/google/calendars", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listCalendars } = await import("./googleCalendarService");
      const calendars = await listCalendars(userId);
      res.json(calendars);
    } catch (error: any) {
      console.error("Error listing calendars:", error);
      if (error.message === "User not connected to Google Calendar") {
        return res.status(401).json({ error: "Not connected to Google Calendar" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/google/calendar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { calendarId } = req.body;

      if (!calendarId) {
        return res.status(400).json({ error: "calendarId is required" });
      }

      const { users } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");

      await db.update(users).set({
        googleCalendarId: calendarId,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));

      res.json({ success: true, calendarId });
    } catch (error) {
      console.error("Error setting calendar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/google/disconnect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { disconnectGoogleCalendar } = await import("./googleCalendarService");
      await disconnectGoogleCalendar(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/google/sync-job/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });

      const workLog = await storage.getWorkLog(req.params.id, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });

      const { syncJobToCalendar } = await import("./googleCalendarService");
      const event = await syncJobToCalendar(userId, workLog as any);
      res.json({ success: true, event });
    } catch (error: any) {
      console.error("Error syncing job to calendar:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/google/sync-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });

      const { month } = req.body;
      if (!month) {
        return res.status(400).json({ error: "month is required (YYYY-MM format)" });
      }

      const jobs = await storage.getScheduledJobs(business.id, month);
      const { syncJobToCalendar } = await import("./googleCalendarService");

      let synced = 0;
      const errors: string[] = [];

      for (const job of jobs) {
        if (job.scheduledStartTime) {
          try {
            await syncJobToCalendar(userId, job as any);
            synced++;
          } catch (err: any) {
            errors.push(`Job ${job.id}: ${err.message}`);
          }
        }
      }

      res.json({ synced, total: jobs.length, errors });
    } catch (error: any) {
      console.error("Error syncing all jobs:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/google/import", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });

      const { timeMin, timeMax } = req.body;
      if (!timeMin || !timeMax) {
        return res.status(400).json({ error: "timeMin and timeMax are required" });
      }

      const { importCalendarEvents } = await import("./googleCalendarService");
      const imported = await importCalendarEvents(userId, business.id, userId, timeMin, timeMax);

      res.json({ imported: imported.length, jobs: imported });
    } catch (error: any) {
      console.error("Error importing calendar events:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
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

  // =====================================================
  // Form Template Routes
  // =====================================================

  app.get("/api/form-templates", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/form-templates/by-work-type/:workType", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/form-templates/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/form-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });

      const validatedData = insertFormTemplateSchema.parse({
        ...req.body,
        businessId: business.id,
      });
      const template = await storage.createFormTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating form template:", error);
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.patch("/api/form-templates/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/form-templates/:id", isAuthenticated, async (req: any, res) => {
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

  // =====================================================
  // Form Submission Routes
  // =====================================================

  app.get("/api/work-logs/:workLogId/forms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);

      // Verify work log belongs to business
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });

      const submissions = await storage.getFormSubmissions(req.params.workLogId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/work-logs/:workLogId/forms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });

      // Verify work log belongs to business
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });

      const validatedData = insertFormSubmissionSchema.parse({
        ...req.body,
        workLogId: req.params.workLogId,
      });

      const submission = await storage.createFormSubmission(validatedData);

      // Create auto-tasks if any
      if (req.body.tasksToCreate && Array.isArray(req.body.tasksToCreate)) {
        for (const task of req.body.tasksToCreate) {
          await storage.createWorkLogTask({
            workLogId: req.params.workLogId,
            title: task.title,
            description: task.description,
            createdFromForm: submission.id,
          });
        }
      }

      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating form submission:", error);
      res.status(400).json({ error: "Invalid submission data" });
    }
  });

  // =====================================================
  // Work Log Task Routes
  // =====================================================

  app.get("/api/work-logs/:workLogId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.json([]);

      // Verify work log belongs to business
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });

      const tasks = await storage.getWorkLogTasks(req.params.workLogId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/work-logs/:workLogId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(400).json({ error: "Business not found" });

      // Verify work log belongs to business
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });

      const validatedData = insertWorkLogTaskSchema.parse({
        ...req.body,
        workLogId: req.params.workLogId,
      });

      const task = await storage.createWorkLogTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.patch("/api/work-logs/:workLogId/tasks/:taskId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });

      // Verify work log belongs to business
      const workLog = await storage.getWorkLog(req.params.workLogId, business.id);
      if (!workLog) return res.status(404).json({ error: "Work log not found" });

      const validatedData = updateWorkLogTaskSchema.parse(req.body);

      // Add completedAt if status is changing to completed
      if (validatedData.status === "completed") {
        (validatedData as any).completedAt = new Date();
      }

      const task = await storage.updateWorkLogTask(req.params.taskId, req.params.workLogId, validatedData);
      if (!task) return res.status(404).json({ error: "Task not found" });

      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/work-logs/:workLogId/tasks/:taskId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByUserId(userId);
      if (!business) return res.status(404).json({ error: "Business not found" });

      // Verify work log belongs to business
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

  const httpServer = createServer(app);
  return httpServer;
}
