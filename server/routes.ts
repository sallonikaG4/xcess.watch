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
