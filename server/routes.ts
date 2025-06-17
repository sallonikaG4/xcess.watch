import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
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
      const entry = await storage.checkInGuest(entryId, req.user.id);
      
      await storage.createActivityLog(
        "guest_checkin",
        `Guest "${entry.firstName} ${entry.lastName}" checked in`,
        req.user.id
      );

      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to check in guest" });
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
        users = await storage.getUsersByRole(""); // This will need to be updated to get all users
      }
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
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
      const licenses = [
        {
          id: 1,
          organization: "Demo Security Corp",
          licenseKey: "XESS-1234-5678-9ABC-DEF0",
          licenseType: "professional",
          maxClubs: 10,
          maxUsers: 100,
          expirationDate: "2025-12-31",
          isActive: true,
          features: ["ban_management", "guestlist_management", "real_time_chat", "advanced_reporting"],
          createdAt: "2024-01-15"
        },
        {
          id: 2,
          organization: "Enterprise Club Chain",
          licenseKey: "XESS-ABCD-EFGH-1234-5678",
          licenseType: "enterprise",
          maxClubs: 50,
          maxUsers: 500,
          expirationDate: "2026-06-30",
          isActive: true,
          features: ["ban_management", "guestlist_management", "real_time_chat", "advanced_reporting", "whitelabel_support", "api_access"],
          createdAt: "2024-02-01"
        }
      ];
      
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
