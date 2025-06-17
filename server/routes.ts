import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { smsService } from "./sms-service";
import { 
  insertUserSchema,
  insertClubSchema, 
  insertBannedGuestSchema, 
  insertGuestlistSchema,
  insertGuestlistEntrySchema,
  insertNotificationSchema,
  insertChatMessageSchema
} from "@shared/schema";
import { z } from "zod";

// WebSocket connection management
interface WebSocketConnection {
  ws: WebSocket;
  userId: number;
  role: string;
}

const connections = new Map<number, WebSocketConnection>();

function broadcastToUser(userId: number, data: any) {
  const connection = connections.get(userId);
  if (connection && connection.ws.readyState === WebSocket.OPEN) {
    connection.ws.send(JSON.stringify(data));
  }
}

function broadcastToRole(role: string, data: any) {
  connections.forEach((connection) => {
    if (connection.role === role && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(data));
    }
  });
}

export function registerRoutes(app: Express): Server {
  // Authentication routes
  setupAuth(app);

  // Auth middleware for API routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Role-based authorization middleware
  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    };
  };

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Recent activity
  app.get("/api/dashboard/activity", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivityLogs(undefined, 10);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Clubs routes
  app.get("/api/clubs", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      let clubs;
      
      if (user.role === "super_admin" || user.role === "admin") {
        clubs = await storage.getAllClubs();
      } else {
        clubs = await storage.getUserClubs(user.id);
      }
      
      res.json(clubs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clubs" });
    }
  });

  app.post("/api/clubs", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const validatedData = insertClubSchema.parse(req.body);
      
      // Generate license key
      const licenseKey = Math.random().toString(36).substring(2, 18).toUpperCase();
      
      const club = await storage.createClub({
        ...validatedData,
        licenseKey
      });

      // Log activity
      await storage.createActivityLog(
        "club_created",
        `Club "${club.name}" was created`,
        req.user.id,
        club.id
      );

      res.status(201).json(club);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create club" });
      }
    }
  });

  app.put("/api/clubs/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const club = await storage.updateClub(id, updates);
      
      await storage.createActivityLog(
        "club_updated",
        `Club "${club.name}" was updated`,
        req.user.id,
        club.id
      );

      res.json(club);
    } catch (error) {
      res.status(500).json({ message: "Failed to update club" });
    }
  });

  app.delete("/api/clubs/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const club = await storage.getClub(id);
      
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }

      await storage.deleteClub(id);
      
      await storage.createActivityLog(
        "club_deleted",
        `Club "${club.name}" was deleted`,
        req.user.id
      );

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete club" });
    }
  });

  // Banned guests routes
  app.get("/api/banned-guests", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const clubId = req.query.clubId ? parseInt(req.query.clubId as string) : undefined;
      
      let guests;
      if (user.role === "super_admin" || user.role === "admin") {
        guests = await storage.getBannedGuests(clubId);
      } else {
        // For other roles, only show guests from their assigned clubs
        const userClubs = await storage.getUserClubs(user.id);
        if (clubId && userClubs.some(club => club.id === clubId)) {
          guests = await storage.getBannedGuests(clubId);
        } else if (!clubId && userClubs.length > 0) {
          guests = await storage.getBannedGuests(userClubs[0].id);
        } else {
          guests = [];
        }
      }
      
      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch banned guests" });
    }
  });

  app.post("/api/banned-guests", requireAuth, requireRole(["super_admin", "admin", "club_manager", "security_teamleader"]), async (req, res) => {
    try {
      const validatedData = insertBannedGuestSchema.parse({
        ...req.body,
        bannedBy: req.user.id
      });
      
      const guest = await storage.createBannedGuest(validatedData);
      
      await storage.createActivityLog(
        "guest_banned",
        `Guest "${guest.firstName} ${guest.lastName}" was banned`,
        req.user.id,
        guest.clubId
      );

      // Broadcast notification to all users
      const notification = await storage.createNotification({
        title: "New Ban Alert",
        message: `${guest.firstName} ${guest.lastName} has been banned`,
        type: "warning",
        createdBy: req.user.id
      });

      broadcastToRole("super_admin", { type: "notification", data: notification });
      broadcastToRole("admin", { type: "notification", data: notification });

      res.status(201).json(guest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ban" });
      }
    }
  });

  app.put("/api/banned-guests/:id", requireAuth, requireRole(["super_admin", "admin", "club_manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.status === "revoked") {
        updates.revokedBy = req.user.id;
        updates.revokedAt = new Date();
      }
      
      const guest = await storage.updateBannedGuest(id, updates);
      
      await storage.createActivityLog(
        "ban_updated",
        `Ban for "${guest.firstName} ${guest.lastName}" was updated`,
        req.user.id,
        guest.clubId
      );

      res.json(guest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ban" });
    }
  });

  app.get("/api/banned-guests/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      const clubId = req.query.clubId ? parseInt(req.query.clubId as string) : undefined;
      
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const guests = await storage.searchBannedGuests(query, clubId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Failed to search banned guests" });
    }
  });

  // Guestlists routes
  app.get("/api/guestlists", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const clubId = req.query.clubId ? parseInt(req.query.clubId as string) : undefined;
      
      let guestlists;
      if (user.role === "super_admin" || user.role === "admin") {
        guestlists = await storage.getGuestlists(clubId);
      } else {
        const userClubs = await storage.getUserClubs(user.id);
        if (clubId && userClubs.some(club => club.id === clubId)) {
          guestlists = await storage.getGuestlists(clubId);
        } else if (!clubId && userClubs.length > 0) {
          guestlists = await storage.getGuestlists(userClubs[0].id);
        } else {
          guestlists = [];
        }
      }
      
      res.json(guestlists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guestlists" });
    }
  });

  app.post("/api/guestlists", requireAuth, requireRole(["super_admin", "admin", "club_manager"]), async (req, res) => {
    try {
      const validatedData = insertGuestlistSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const guestlist = await storage.createGuestlist(validatedData);
      
      await storage.createActivityLog(
        "guestlist_created",
        `Guestlist "${guestlist.name}" was created`,
        req.user.id,
        guestlist.clubId
      );

      res.status(201).json(guestlist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create guestlist" });
      }
    }
  });

  app.get("/api/guestlists/:id/entries", requireAuth, async (req, res) => {
    try {
      const guestlistId = parseInt(req.params.id);
      const entries = await storage.getGuestlistEntries(guestlistId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guestlist entries" });
    }
  });

  app.post("/api/guestlists/:id/entries", requireAuth, async (req, res) => {
    try {
      const guestlistId = parseInt(req.params.id);
      const validatedData = insertGuestlistEntrySchema.parse({
        ...req.body,
        guestlistId
      });
      
      const entry = await storage.createGuestlistEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add guest to list" });
      }
    }
  });

  app.post("/api/guestlist-entries/:id/checkin", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const entry = await storage.checkInGuest(entryId, req.user!.id);
      
      await storage.createActivityLog(
        "guest_checkin",
        `Guest "${entry.firstName} ${entry.lastName}" checked in`,
        req.user!.id
      );

      // Broadcast real-time update
      broadcastToRole("security_personnel", { type: "guest_checkin", data: entry });
      broadcastToRole("security_teamleader", { type: "guest_checkin", data: entry });

      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to check in guest" });
    }
  });

  app.patch("/api/guestlist-entries/:id", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const updates = req.body;
      
      const entry = await storage.updateGuestlistEntry(entryId, updates);
      
      await storage.createActivityLog(
        "guestlist_entry_updated",
        `Guest entry for "${entry.firstName} ${entry.lastName}" was updated`,
        req.user!.id
      );

      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update guest entry" });
    }
  });

  app.patch("/api/guestlists/:id", requireAuth, requireRole(["super_admin", "admin", "club_manager"]), async (req, res) => {
    try {
      const guestlistId = parseInt(req.params.id);
      const updates = req.body;
      
      const guestlist = await storage.updateGuestlist(guestlistId, updates);
      
      await storage.createActivityLog(
        "guestlist_updated",
        `Guestlist "${guestlist.name}" was updated`,
        req.user!.id,
        guestlist.clubId
      );

      res.json(guestlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to update guestlist" });
    }
  });

  app.post("/api/guestlists/:id/bulk-actions", requireAuth, requireRole(["super_admin", "admin", "club_manager", "security_teamleader"]), async (req, res) => {
    try {
      const guestlistId = parseInt(req.params.id);
      const { action, entryIds } = req.body;
      
      const results = [];
      
      for (const entryId of entryIds) {
        try {
          let entry;
          if (action === "approve") {
            entry = await storage.updateGuestlistEntry(entryId, { status: "approved" });
          } else if (action === "reject") {
            entry = await storage.updateGuestlistEntry(entryId, { status: "rejected" });
          } else if (action === "checkin") {
            entry = await storage.checkInGuest(entryId, req.user!.id);
          }
          
          if (entry) {
            results.push(entry);
          }
        } catch (error) {
          console.error(`Failed to ${action} entry ${entryId}:`, error);
        }
      }
      
      await storage.createActivityLog(
        "bulk_action",
        `Bulk ${action} performed on ${results.length} guests`,
        req.user!.id
      );

      res.json({ success: true, processed: results.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to perform bulk action" });
    }
  });

  app.get("/api/guestlists/:id/qr-code", requireAuth, async (req, res) => {
    try {
      const guestlistId = parseInt(req.params.id);
      const guestlist = await storage.getGuestlist(guestlistId);
      
      if (!guestlist) {
        return res.status(404).json({ message: "Guestlist not found" });
      }
      
      // Generate QR code data
      const qrData = {
        type: "guestlist",
        id: guestlistId,
        name: guestlist.name,
        clubId: guestlist.clubId,
        eventDate: guestlist.eventDate
      };
      
      res.json({ qrCode: JSON.stringify(qrData) });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  app.get("/api/guestlists/:id/export", requireAuth, requireRole(["super_admin", "admin", "club_manager"]), async (req, res) => {
    try {
      const guestlistId = parseInt(req.params.id);
      const entries = await storage.getGuestlistEntries(guestlistId);
      const guestlist = await storage.getGuestlist(guestlistId);
      
      const exportData = {
        guestlist,
        entries,
        exportedAt: new Date().toISOString(),
        exportedBy: req.user!.username
      };
      
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export guestlist" });
    }
  });

  // Bookmetender API Integration Routes
  app.post("/api/bookmetender/sync", requireAuth, requireRole(["super_admin", "admin", "club_manager"]), async (req, res) => {
    try {
      const { apiKey, clubId, eventId } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ message: "Bookmetender API key required" });
      }
      
      // Simulate Bookmetender API integration
      const bookmetenderData = {
        eventId,
        guests: [
          {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
            status: "confirmed",
            ticketType: "VIP",
            plusOnes: 1
          }
        ],
        syncedAt: new Date().toISOString()
      };
      
      // Create guestlist from Bookmetender data
      const guestlist = await storage.createGuestlist({
        name: `Bookmetender Event ${eventId}`,
        eventDate: new Date(),
        clubId: parseInt(clubId),
        createdBy: req.user!.id,
        description: `Synced from Bookmetender Event ${eventId}`,
        maxGuests: bookmetenderData.guests.length,
        isActive: true
      });
      
      // Add guests from Bookmetender
      for (const guest of bookmetenderData.guests) {
        await storage.createGuestlistEntry({
          guestlistId: guestlist.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          guestCount: guest.plusOnes + 1,
          status: guest.status === "confirmed" ? "approved" : "pending",
          comments: `Ticket Type: ${guest.ticketType}`,
          addedBy: req.user!.id
        });
      }
      
      await storage.createActivityLog(
        "bookmetender_sync",
        `Synchronized ${bookmetenderData.guests.length} guests from Bookmetender`,
        req.user!.id,
        guestlist.clubId
      );
      
      res.json({
        success: true,
        guestlist,
        syncedGuests: bookmetenderData.guests.length,
        syncedAt: bookmetenderData.syncedAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync with Bookmetender" });
    }
  });

  app.post("/api/bookmetender/validate", requireAuth, async (req, res) => {
    try {
      const { apiKey, clubId } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ message: "API key required" });
      }
      
      // Simulate API validation
      const isValid = apiKey.startsWith("bmt_") && apiKey.length > 20;
      
      if (isValid) {
        res.json({
          valid: true,
          clubName: "Sample Club",
          permissions: ["read_events", "read_guests", "write_guests"],
          rateLimit: {
            requestsPerHour: 1000,
            remaining: 995
          }
        });
      } else {
        res.status(401).json({
          valid: false,
          error: "Invalid API key format"
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to validate Bookmetender API" });
    }
  });

  app.get("/api/bookmetender/events", requireAuth, async (req, res) => {
    try {
      const { apiKey } = req.query;
      
      if (!apiKey) {
        return res.status(400).json({ message: "API key required" });
      }
      
      // Simulate Bookmetender events
      const events = [
        {
          id: "evt_123",
          name: "Saturday Night Party",
          date: "2024-12-21",
          time: "22:00",
          venue: "Main Club",
          ticketsSold: 150,
          capacity: 200,
          status: "active"
        },
        {
          id: "evt_124",
          name: "VIP Event",
          date: "2024-12-22",
          time: "20:00",
          venue: "VIP Lounge",
          ticketsSold: 45,
          capacity: 50,
          status: "active"
        }
      ];
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Bookmetender events" });
    }
  });

  // Users routes
  app.get("/api/users", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const role = req.query.role as string;
      let users;
      
      if (role) {
        users = await storage.getUsersByRole(role);
      } else {
        users = await storage.getAllUsers();
      }
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      
      await storage.createActivityLog(
        "user_created",
        `User created: ${user.username}`,
        req.user!.id
      );
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/users/:id/assign-club", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { clubId } = req.body;
      
      await storage.assignUserToClub(userId, clubId);
      
      await storage.createActivityLog(
        "user_assigned",
        `User assigned to club`,
        req.user.id,
        clubId
      );

      res.status(200).json({ message: "User assigned to club successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign user to club" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user.id, req.user.role);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const notification = await storage.createNotification(validatedData);
      
      // Broadcast to target users
      if (notification.targetUserId) {
        broadcastToUser(notification.targetUserId, { type: "notification", data: notification });
      } else if (notification.targetRole) {
        broadcastToRole(notification.targetRole, { type: "notification", data: notification });
      }

      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create notification" });
      }
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Chat routes
  app.get("/api/chat/messages", requireAuth, async (req, res) => {
    try {
      const { toUserId, clubId } = req.query;
      const messages = await storage.getChatMessages(
        req.user.id,
        toUserId ? parseInt(toUserId as string) : undefined,
        clubId ? parseInt(clubId as string) : undefined
      );
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/messages", requireAuth, async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        fromUserId: req.user.id
      });
      
      const message = await storage.createChatMessage(validatedData);
      
      // Broadcast to recipient
      if (message.toUserId) {
        broadcastToUser(message.toUserId, { type: "chat_message", data: message });
      }

      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  });

  // ID Scanning route (placeholder)
  app.post("/api/id-scan", requireAuth, async (req, res) => {
    try {
      const { idData, clubId } = req.body;
      
      // Log the scan
      await storage.createActivityLog(
        "id_scan",
        `ID scanned at club`,
        req.user.id,
        clubId,
        { idData }
      );

      // Here you would implement the actual ID verification logic
      // For now, return a simple response
      res.json({ 
        allowed: true, 
        message: "ID scan completed successfully" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process ID scan" });
    }
  });

  // Platform Settings routes (Super Admin only)
  app.get("/api/platform/settings", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      const settings = {
        platformName: "XESS Security Platform",
        platformDescription: "Comprehensive club security management system",
        supportEmail: "support@xess.watch",
        timezone: "UTC",
        language: "en",
        smtpSecure: true,
        sessionTimeout: 60,
        passwordMinLength: 8,
        passwordRequireSpecial: true,
        passwordRequireNumbers: true,
        passwordRequireUppercase: true,
        maxLoginAttempts: 5,
        enableGuestInvites: true,
        enableSMSNotifications: false,
        enableRealTimeChat: true,
        enableOfflineMode: false,
        enableBiometricLogin: false,
        darkModeEnabled: true,
        backupEnabled: true,
        backupFrequency: "daily",
        dataRetentionDays: 365,
        maintenanceMode: false,
      };
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform settings" });
    }
  });

  app.post("/api/platform/settings", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      await storage.createActivityLog(
        "platform_settings_updated",
        `Platform settings updated`,
        req.user.id
      );
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update platform settings" });
    }
  });

  // License Management routes
  app.get("/api/platform/licenses", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      const licenses = await storage.getAllLicenses();
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  app.post("/api/platform/licenses/generate", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      const { licenseeOrganization, licenseType, maxClubs, maxUsers, expirationDate, features } = req.body;
      
      const generateLicenseKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'XESS-';
        for (let i = 0; i < 4; i++) {
          if (i > 0) result += '-';
          for (let j = 0; j < 4; j++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
        }
        return result;
      };
      
      const licenseKey = generateLicenseKey();
      
      await storage.createActivityLog(
        "license_generated",
        `License generated for ${licenseeOrganization}`,
        req.user.id
      );
      
      res.json({ licenseKey });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate license" });
    }
  });

  // Plugin Management routes
  app.get("/api/plugins", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      const plugins: any[] = [];
      res.json(plugins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plugins" });
    }
  });

  app.post("/api/plugins/install", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      await storage.createActivityLog(
        "plugin_installed",
        `Plugin installation attempted`,
        req.user.id
      );
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to install plugin" });
    }
  });

  app.post("/api/plugins/:id/toggle", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      const pluginId = req.params.id;
      const { enabled } = req.body;
      
      await storage.createActivityLog(
        "plugin_toggled",
        `Plugin ${pluginId} ${enabled ? 'enabled' : 'disabled'}`,
        req.user.id
      );
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle plugin" });
    }
  });

  app.post("/api/plugins/:id/config", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      const pluginId = req.params.id;
      
      await storage.createActivityLog(
        "plugin_configured",
        `Plugin ${pluginId} configuration updated`,
        req.user.id
      );
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update plugin configuration" });
    }
  });

  app.delete("/api/plugins/:id", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      const pluginId = req.params.id;
      
      await storage.createActivityLog(
        "plugin_uninstalled",
        `Plugin ${pluginId} uninstalled`,
        req.user.id
      );
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to uninstall plugin" });
    }
  });

  // User profile update route
  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Only allow users to update their own profile or super_admin to update any
      if (req.user!.id !== userId && req.user!.role !== "super_admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const user = await storage.updateUser(userId, updates);
      await storage.createActivityLog(
        "user_updated",
        `User profile updated: ${user.username}`,
        req.user!.id
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // User password change route
  app.post("/api/users/:id/change-password", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { currentPassword, newPassword } = req.body;
      
      if (req.user.id !== userId && !["super_admin", "admin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedUser = await storage.updateUser(userId, { 
        password: newPassword
      });
      
      await storage.createActivityLog(
        "password_changed",
        `Password changed for user ${userId}`,
        req.user.id
      );

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // License management routes
  app.get("/api/platform/licenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "super_admin") return res.sendStatus(403);
    
    try {
      const licenses = await storage.getAllLicenses();
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ error: "Failed to fetch licenses" });
    }
  });

  app.post("/api/platform/licenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "super_admin") return res.sendStatus(403);
    
    try {
      const licenseData = req.body;
      const license = await storage.createLicense(licenseData);
      
      await storage.createActivityLog(
        "license_created",
        `License created for ${license.organization}`,
        req.user!.id
      );
      
      res.status(201).json(license);
    } catch (error) {
      console.error("Error creating license:", error);
      res.status(500).json({ error: "Failed to create license" });
    }
  });

  app.patch("/api/platform/licenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "super_admin") return res.sendStatus(403);
    
    try {
      const licenseId = parseInt(req.params.id);
      const updates = req.body;
      
      const license = await storage.updateLicense(licenseId, updates);
      
      await storage.createActivityLog(
        "license_updated",
        `License updated for ${license.organization}`,
        req.user!.id
      );
      
      res.json(license);
    } catch (error) {
      console.error("Error updating license:", error);
      res.status(500).json({ error: "Failed to update license" });
    }
  });

  app.delete("/api/platform/licenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "super_admin") return res.sendStatus(403);
    
    try {
      const licenseId = parseInt(req.params.id);
      
      await storage.revokeLicense(licenseId);
      
      await storage.createActivityLog(
        "license_revoked",
        `License revoked`,
        req.user!.id
      );
      
      res.sendStatus(200);
    } catch (error) {
      console.error("Error revoking license:", error);
      res.status(500).json({ error: "Failed to revoke license" });
    }
  });

  // Document verification endpoint (simulates external API call)
  app.post("/api/verify-document", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const documentData = req.body;
      
      // Validate required fields
      if (!documentData.firstName || !documentData.lastName || !documentData.dateOfBirth) {
        return res.status(400).json({ error: "Missing required document fields" });
      }

      // Search for banned guests matching the document data
      const searchQuery = `${documentData.firstName} ${documentData.lastName}`.toLowerCase();
      const bannedGuests = await storage.searchBannedGuests(searchQuery);

      // Check for exact matches
      const exactMatch = bannedGuests.find(guest => 
        guest.firstName.toLowerCase() === documentData.firstName.toLowerCase() &&
        guest.lastName.toLowerCase() === documentData.lastName.toLowerCase() &&
        guest.dateOfBirth === documentData.dateOfBirth
      );

      let verificationResult;

      if (exactMatch) {
        // Guest is banned
        verificationResult = {
          allowed: false,
          reason: "Guest is banned from entry",
          ban: {
            reason: exactMatch.reason || "Security violation",
            banDate: exactMatch.banDate?.toISOString() || new Date().toISOString(),
            club: exactMatch.club?.name || "System-wide ban"
          }
        };

        // Log the scan attempt
        await storage.createActivityLog(
          "id_scan_blocked",
          `Blocked entry attempt for banned guest: ${documentData.firstName} ${documentData.lastName}`,
          req.user!.id,
          exactMatch.clubId || undefined,
          { documentData, banId: exactMatch.id }
        );

        // Send SMS alert to security team
        const securityUsers = await storage.getUsersByRole("security_teamleader");
        for (const securityUser of securityUsers) {
          if (securityUser.phone) {
            await smsService.sendBannedGuestAlert(
              securityUser.phone,
              `${documentData.firstName} ${documentData.lastName}`,
              "Club Location"
            );
          }
        }
      } else {
        verificationResult = {
          allowed: true,
          reason: "Guest cleared for entry",
          guest: {
            name: `${documentData.firstName} ${documentData.lastName}`,
            status: "Standard"
          }
        };

        // Log successful scan
        await storage.createActivityLog(
          "id_scan_success",
          `ID scan completed for: ${documentData.firstName} ${documentData.lastName}`,
          req.user!.id,
          undefined,
          { documentData, result: verificationResult }
        );
      }

      res.json(verificationResult);

    } catch (error) {
      console.error("Document verification error:", error);
      
      // Log the error
      await storage.createActivityLog(
        "id_scan_error",
        `ID scan verification failed: ${error}`,
        req.user!.id,
        undefined,
        { error: error.toString() }
      );

      res.status(500).json({ 
        error: "Document verification failed",
        allowed: false,
        reason: "System error - please try again"
      });
    }
  });

  // Chat API routes
  app.get("/api/chat/contacts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      // Get all users except current user as potential contacts
      const allUsers = await storage.getUsersByRole("super_admin");
      const adminUsers = await storage.getUsersByRole("admin");
      const clubManagers = await storage.getUsersByRole("club_manager");
      const securityLeaders = await storage.getUsersByRole("security_teamleader");
      const securityPersonnel = await storage.getUsersByRole("security_personnel");
      const clubEmployees = await storage.getUsersByRole("club_employee");

      const contacts = [
        ...allUsers,
        ...adminUsers,
        ...clubManagers,
        ...securityLeaders,
        ...securityPersonnel,
        ...clubEmployees
      ].filter(user => user.id !== req.user!.id);

      // Get unread message counts and last messages for each contact
      const contactsWithChatInfo = await Promise.all(
        contacts.map(async (contact) => {
          const messages = await storage.getChatMessages(contact.id, req.user!.id);
          const unreadMessages = messages.filter(msg => !msg.isRead && msg.fromUserId === contact.id);
          const lastMessage = messages[messages.length - 1];

          return {
            id: contact.id,
            fullName: contact.fullName,
            role: contact.role,
            isOnline: Math.random() > 0.5, // Simulate online status
            unreadCount: unreadMessages.length,
            lastMessage: lastMessage?.message || null,
            lastSeen: lastMessage?.createdAt?.toISOString() || null
          };
        })
      );

      res.json(contactsWithChatInfo);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/chat/messages/:contactId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const contactId = parseInt(req.params.contactId);
      const messages = await storage.getChatMessages(req.user!.id, contactId);

      // Format messages for frontend
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        fromUserId: msg.fromUserId,
        toUserId: msg.toUserId,
        message: msg.message,
        timestamp: msg.createdAt.toISOString(),
        read: msg.isRead,
        messageType: 'text'
      }));

      res.json(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { toUserId, message, messageType = "text" } = req.body;

      if (!toUserId || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newMessage = await storage.createChatMessage({
        fromUserId: req.user!.id,
        toUserId,
        message,
        isRead: false
      });

      // Broadcast message via WebSocket
      broadcastToUser(toUserId, {
        type: "new_message",
        data: {
          id: newMessage.id,
          fromUserId: req.user!.id,
          toUserId,
          message,
          timestamp: newMessage.createdAt.toISOString(),
          read: false,
          messageType
        }
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/chat/messages/read/:fromUserId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const fromUserId = parseInt(req.params.fromUserId);
      await storage.markMessagesAsRead(req.user!.id, fromUserId);

      // Notify sender that messages were read
      broadcastToUser(fromUserId, {
        type: "messages_read",
        data: { readBy: req.user!.id }
      });

      res.sendStatus(200);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // You would need to implement proper authentication for WebSocket connections
    // For now, this is a simplified version
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth' && message.userId && message.role) {
          connections.set(message.userId, { ws, userId: message.userId, role: message.role });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection when user disconnects
      for (const [userId, connection] of connections.entries()) {
        if (connection.ws === ws) {
          connections.delete(userId);
          break;
        }
      }
    });
  });

  return httpServer;
}
