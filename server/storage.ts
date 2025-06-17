import { 
  users, 
  clubs, 
  bannedGuests, 
  guestlists, 
  guestlistEntries,
  notifications,
  chatMessages,
  activityLogs,
  userClubAssignments,
  securityCompanies,
  licenses,
  type User, 
  type InsertUser,
  type Club,
  type InsertClub,
  type BannedGuest,
  type InsertBannedGuest,
  type Guestlist,
  type InsertGuestlist,
  type GuestlistEntry,
  type InsertGuestlistEntry,
  type Notification,
  type InsertNotification,
  type ChatMessage,
  type InsertChatMessage,
  type ActivityLog,
  type SecurityCompany,
  type License,
  type InsertLicense
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, count, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUserClubs(userId: number): Promise<Club[]>;

  // Clubs
  getAllClubs(): Promise<Club[]>;
  getClub(id: number): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  updateClub(id: number, updates: Partial<InsertClub>): Promise<Club>;
  deleteClub(id: number): Promise<void>;
  assignUserToClub(userId: number, clubId: number): Promise<void>;

  // Banned Guests
  getBannedGuests(clubId?: number): Promise<BannedGuest[]>;
  getBannedGuest(id: number): Promise<BannedGuest | undefined>;
  createBannedGuest(guest: InsertBannedGuest): Promise<BannedGuest>;
  updateBannedGuest(id: number, updates: Partial<InsertBannedGuest>): Promise<BannedGuest>;
  searchBannedGuests(query: string, clubId?: number): Promise<BannedGuest[]>;

  // Guestlists
  getGuestlists(clubId?: number): Promise<Guestlist[]>;
  getGuestlist(id: number): Promise<Guestlist | undefined>;
  createGuestlist(guestlist: InsertGuestlist): Promise<Guestlist>;
  updateGuestlist(id: number, updates: Partial<InsertGuestlist>): Promise<Guestlist>;
  deleteGuestlist(id: number): Promise<void>;

  // Guestlist Entries
  getGuestlistEntries(guestlistId: number): Promise<GuestlistEntry[]>;
  createGuestlistEntry(entry: InsertGuestlistEntry): Promise<GuestlistEntry>;
  updateGuestlistEntry(id: number, updates: Partial<InsertGuestlistEntry>): Promise<GuestlistEntry>;
  checkInGuest(entryId: number, checkedInBy: number): Promise<GuestlistEntry>;

  // Notifications
  getNotifications(userId?: number, role?: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;

  // Chat
  getChatMessages(fromUserId?: number, toUserId?: number, clubId?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(userId: number, fromUserId: number): Promise<void>;

  // Activity Logs
  getActivityLogs(clubId?: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(action: string, description: string, userId: number, clubId?: number, metadata?: any): Promise<ActivityLog>;

  // Stats
  getDashboardStats(): Promise<{
    totalClubs: number;
    activeBans: number;
    guestlistEntries: number;
    idScans: number;
  }>;

  // Licenses
  getAllLicenses(): Promise<License[]>;
  getLicense(id: number): Promise<License | undefined>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: number, updates: Partial<InsertLicense>): Promise<License>;
  revokeLicense(id: number): Promise<void>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async getUserClubs(userId: number): Promise<Club[]> {
    const result = await db
      .select()
      .from(clubs)
      .innerJoin(userClubAssignments, eq(clubs.id, userClubAssignments.clubId))
      .where(eq(userClubAssignments.userId, userId));
    
    return result.map(row => row.clubs);
  }

  // Clubs
  async getAllClubs(): Promise<Club[]> {
    return await db.select().from(clubs).orderBy(desc(clubs.createdAt));
  }

  async getClub(id: number): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club || undefined;
  }

  async createClub(insertClub: InsertClub): Promise<Club> {
    const [club] = await db
      .insert(clubs)
      .values(insertClub)
      .returning();
    return club;
  }

  async updateClub(id: number, updates: Partial<InsertClub>): Promise<Club> {
    const [club] = await db
      .update(clubs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clubs.id, id))
      .returning();
    return club;
  }

  async deleteClub(id: number): Promise<void> {
    await db.delete(clubs).where(eq(clubs.id, id));
  }

  async assignUserToClub(userId: number, clubId: number): Promise<void> {
    await db.insert(userClubAssignments).values({ userId, clubId });
  }

  // Banned Guests
  async getBannedGuests(clubId?: number): Promise<BannedGuest[]> {
    const query = db.select().from(bannedGuests).orderBy(desc(bannedGuests.createdAt));
    
    if (clubId) {
      return await query.where(eq(bannedGuests.clubId, clubId));
    }
    
    return await query;
  }

  async getBannedGuest(id: number): Promise<BannedGuest | undefined> {
    const [guest] = await db.select().from(bannedGuests).where(eq(bannedGuests.id, id));
    return guest || undefined;
  }

  async createBannedGuest(guest: InsertBannedGuest): Promise<BannedGuest> {
    const [bannedGuest] = await db
      .insert(bannedGuests)
      .values(guest)
      .returning();
    return bannedGuest;
  }

  async updateBannedGuest(id: number, updates: Partial<InsertBannedGuest>): Promise<BannedGuest> {
    const [guest] = await db
      .update(bannedGuests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bannedGuests.id, id))
      .returning();
    return guest;
  }

  async searchBannedGuests(query: string, clubId?: number): Promise<BannedGuest[]> {
    const searchCondition = or(
      sql`${bannedGuests.firstName} ILIKE ${`%${query}%`}`,
      sql`${bannedGuests.lastName} ILIKE ${`%${query}%`}`,
      sql`${bannedGuests.idNumber} ILIKE ${`%${query}%`}`
    );

    if (clubId) {
      return await db.select().from(bannedGuests).where(and(searchCondition, eq(bannedGuests.clubId, clubId)));
    }
    
    return await db.select().from(bannedGuests).where(searchCondition);
  }

  // Guestlists
  async getGuestlists(clubId?: number): Promise<Guestlist[]> {
    const query = db.select().from(guestlists).orderBy(desc(guestlists.createdAt));
    
    if (clubId) {
      return await query.where(eq(guestlists.clubId, clubId));
    }
    
    return await query;
  }

  async getGuestlist(id: number): Promise<Guestlist | undefined> {
    const [guestlist] = await db.select().from(guestlists).where(eq(guestlists.id, id));
    return guestlist || undefined;
  }

  async createGuestlist(guestlist: InsertGuestlist): Promise<Guestlist> {
    const [newGuestlist] = await db
      .insert(guestlists)
      .values(guestlist)
      .returning();
    return newGuestlist;
  }

  async updateGuestlist(id: number, updates: Partial<InsertGuestlist>): Promise<Guestlist> {
    const [guestlist] = await db
      .update(guestlists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guestlists.id, id))
      .returning();
    return guestlist;
  }

  async deleteGuestlist(id: number): Promise<void> {
    await db.delete(guestlists).where(eq(guestlists.id, id));
  }

  // Guestlist Entries
  async getGuestlistEntries(guestlistId: number): Promise<GuestlistEntry[]> {
    return await db
      .select()
      .from(guestlistEntries)
      .where(eq(guestlistEntries.guestlistId, guestlistId))
      .orderBy(desc(guestlistEntries.createdAt));
  }

  async createGuestlistEntry(entry: InsertGuestlistEntry): Promise<GuestlistEntry> {
    const [newEntry] = await db
      .insert(guestlistEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateGuestlistEntry(id: number, updates: Partial<InsertGuestlistEntry>): Promise<GuestlistEntry> {
    const [entry] = await db
      .update(guestlistEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guestlistEntries.id, id))
      .returning();
    return entry;
  }

  async checkInGuest(entryId: number, checkedInBy: number): Promise<GuestlistEntry> {
    const [entry] = await db
      .update(guestlistEntries)
      .set({
        status: "checked_in",
        checkedInAt: new Date(),
        checkedInBy,
        updatedAt: new Date()
      })
      .where(eq(guestlistEntries.id, entryId))
      .returning();
    return entry;
  }

  // Notifications
  async getNotifications(userId?: number, role?: string): Promise<Notification[]> {
    if (userId && role) {
      return await db.select().from(notifications)
        .where(
          or(
            eq(notifications.targetUserId, userId),
            eq(notifications.targetRole, role as any)
          )
        )
        .orderBy(desc(notifications.createdAt));
    } else if (userId) {
      return await db.select().from(notifications)
        .where(eq(notifications.targetUserId, userId))
        .orderBy(desc(notifications.createdAt));
    } else if (role) {
      return await db.select().from(notifications)
        .where(eq(notifications.targetRole, role as any))
        .orderBy(desc(notifications.createdAt));
    }
    
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Chat
  async getChatMessages(fromUserId?: number, toUserId?: number, clubId?: number): Promise<ChatMessage[]> {
    const conditions = [];
    if (fromUserId && toUserId) {
      conditions.push(
        or(
          and(eq(chatMessages.fromUserId, fromUserId), eq(chatMessages.toUserId, toUserId)),
          and(eq(chatMessages.fromUserId, toUserId), eq(chatMessages.toUserId, fromUserId))
        )
      );
    }
    if (clubId) {
      conditions.push(eq(chatMessages.clubId, clubId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(chatMessages)
        .where(and(...conditions))
        .orderBy(desc(chatMessages.createdAt));
    }
    
    return await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markMessagesAsRead(userId: number, fromUserId: number): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.toUserId, userId),
          eq(chatMessages.fromUserId, fromUserId)
        )
      );
  }

  // Activity Logs
  async getActivityLogs(clubId?: number, limit: number = 50): Promise<ActivityLog[]> {
    let query = db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
    
    if (clubId) {
      query = query.where(eq(activityLogs.clubId, clubId));
    }
    
    return await query;
  }

  async createActivityLog(
    action: string, 
    description: string, 
    userId: number, 
    clubId?: number, 
    metadata?: any
  ): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values({
        action,
        description,
        userId,
        clubId,
        metadata: metadata ? JSON.stringify(metadata) : null
      })
      .returning();
    return log;
  }

  // Stats
  async getDashboardStats(): Promise<{
    totalClubs: number;
    activeBans: number;
    guestlistEntries: number;
    idScans: number;
  }> {
    const [clubsCount] = await db
      .select({ count: count() })
      .from(clubs)
      .where(eq(clubs.isActive, true));

    const [bansCount] = await db
      .select({ count: count() })
      .from(bannedGuests)
      .where(or(eq(bannedGuests.status, "banned_sl"), eq(bannedGuests.status, "banned_lr")));

    const [entriesCount] = await db
      .select({ count: count() })
      .from(guestlistEntries);

    // ID scans would be tracked via activity logs
    const [scansCount] = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(eq(activityLogs.action, "id_scan"));

    return {
      totalClubs: clubsCount.count,
      activeBans: bansCount.count,
      guestlistEntries: entriesCount.count,
      idScans: scansCount.count
    };
  }

  // License methods
  async getAllLicenses(): Promise<License[]> {
    return await db.select().from(licenses).orderBy(desc(licenses.createdAt));
  }

  async getLicense(id: number): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    return license || undefined;
  }

  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const [license] = await db
      .insert(licenses)
      .values(insertLicense)
      .returning();
    return license;
  }

  async updateLicense(id: number, updates: Partial<InsertLicense>): Promise<License> {
    const [license] = await db
      .update(licenses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(licenses.id, id))
      .returning();
    return license;
  }

  async revokeLicense(id: number): Promise<void> {
    await db
      .update(licenses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(licenses.id, id));
  }
}

export const storage = new DatabaseStorage();
