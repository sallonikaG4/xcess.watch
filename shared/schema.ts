import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin", 
  "club_manager",
  "security_teamleader",
  "security_personnel",
  "club_employee"
]);

export const banStatusEnum = pgEnum("ban_status", [
  "banned_sl",
  "banned_lr", 
  "revoked",
  "reinstated"
]);

export const guestStatusEnum = pgEnum("guest_status", [
  "pending",
  "approved",
  "rejected",
  "checked_in",
  "no_show",
  "revoked"
]);

export const licenseStatusEnum = pgEnum("license_status", [
  "active",
  "inactive",
  "expired",
  "suspended"
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("club_employee"),
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Security companies table
export const securityCompanies = pgTable("security_companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  licenseKey: text("license_key").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  whitelabelSettings: text("whitelabel_settings"), // JSON string
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Clubs table  
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  licenseKey: text("license_key").notNull().unique(),
  licenseStatus: licenseStatusEnum("license_status").notNull().default("active"),
  isActive: boolean("is_active").notNull().default(true),
  smtpSettings: text("smtp_settings"), // JSON string
  smsSettings: text("sms_settings"), // JSON string
  securityCompanyId: integer("security_company_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// User club assignments
export const userClubAssignments = pgTable("user_club_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clubId: integer("club_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Banned guests table
export const bannedGuests = pgTable("banned_guests", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  nationality: text("nationality"),
  idNumber: text("id_number"),
  idType: text("id_type"), // passport, national_id, driver_license
  photoFront: text("photo_front"), // base64 or file path
  photoBack: text("photo_back"),
  banReason: text("ban_reason").notNull(),
  policeIncidentNumber: text("police_incident_number"),
  incidentDate: timestamp("incident_date"),
  incidentDescription: text("incident_description"),
  status: banStatusEnum("status").notNull().default("banned_sl"),
  clubId: integer("club_id").notNull(),
  bannedBy: integer("banned_by").notNull(),
  revokedBy: integer("revoked_by"),
  revocationReason: text("revocation_reason"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Guestlists table
export const guestlists = pgTable("guestlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventTime: text("event_time"),
  description: text("description"),
  maxGuests: integer("max_guests"),
  isActive: boolean("is_active").notNull().default(true),
  clubId: integer("club_id").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Guestlist entries
export const guestlistEntries = pgTable("guestlist_entries", {
  id: serial("id").primaryKey(),
  guestlistId: integer("guestlist_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  guestCount: integer("guest_count").notNull().default(1),
  comments: text("comments"),
  status: guestStatusEnum("status").notNull().default("pending"),
  checkedInAt: timestamp("checked_in_at"),
  checkedInBy: integer("checked_in_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, warning, error, success
  targetRole: userRoleEnum("target_role"),
  targetUserId: integer("target_user_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id"),
  clubId: integer("club_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  description: text("description").notNull(),
  userId: integer("user_id").notNull(),
  clubId: integer("club_id"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clubAssignments: many(userClubAssignments),
  bansCreated: many(bannedGuests, { relationName: "bannedBy" }),
  bansRevoked: many(bannedGuests, { relationName: "revokedBy" }),
  guestlistsCreated: many(guestlists),
  notificationsCreated: many(notifications),
  messagesFrom: many(chatMessages, { relationName: "fromUser" }),
  messagesTo: many(chatMessages, { relationName: "toUser" }),
  activities: many(activityLogs)
}));

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  securityCompany: one(securityCompanies, {
    fields: [clubs.securityCompanyId],
    references: [securityCompanies.id]
  }),
  userAssignments: many(userClubAssignments),
  bannedGuests: many(bannedGuests),
  guestlists: many(guestlists),
  chatMessages: many(chatMessages),
  activities: many(activityLogs)
}));

export const userClubAssignmentsRelations = relations(userClubAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userClubAssignments.userId],
    references: [users.id]
  }),
  club: one(clubs, {
    fields: [userClubAssignments.clubId],
    references: [clubs.id]
  })
}));

export const bannedGuestsRelations = relations(bannedGuests, ({ one }) => ({
  club: one(clubs, {
    fields: [bannedGuests.clubId],
    references: [clubs.id]
  }),
  bannedByUser: one(users, {
    fields: [bannedGuests.bannedBy],
    references: [users.id],
    relationName: "bannedBy"
  }),
  revokedByUser: one(users, {
    fields: [bannedGuests.revokedBy],
    references: [users.id],
    relationName: "revokedBy"
  })
}));

export const guestlistsRelations = relations(guestlists, ({ one, many }) => ({
  club: one(clubs, {
    fields: [guestlists.clubId],
    references: [clubs.id]
  }),
  createdByUser: one(users, {
    fields: [guestlists.createdBy],
    references: [users.id]
  }),
  entries: many(guestlistEntries)
}));

export const guestlistEntriesRelations = relations(guestlistEntries, ({ one }) => ({
  guestlist: one(guestlists, {
    fields: [guestlistEntries.guestlistId],
    references: [guestlists.id]
  }),
  checkedInByUser: one(users, {
    fields: [guestlistEntries.checkedInBy],
    references: [users.id]
  })
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});

export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBannedGuestSchema = createInsertSchema(bannedGuests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  revokedBy: true,
  revokedAt: true,
  revocationReason: true
});

export const insertGuestlistSchema = createInsertSchema(guestlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertGuestlistEntrySchema = createInsertSchema(guestlistEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  checkedInAt: true,
  checkedInBy: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubs.$inferSelect;
export type InsertBannedGuest = z.infer<typeof insertBannedGuestSchema>;
export type BannedGuest = typeof bannedGuests.$inferSelect;
export type InsertGuestlist = z.infer<typeof insertGuestlistSchema>;
export type Guestlist = typeof guestlists.$inferSelect;
export type InsertGuestlistEntry = z.infer<typeof insertGuestlistEntrySchema>;
export type GuestlistEntry = typeof guestlistEntries.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type SecurityCompany = typeof securityCompanies.$inferSelect;
