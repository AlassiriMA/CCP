import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, real, foreignKey, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define the subscription plans
export enum SubscriptionPlan {
  FREE = "free",
  PRO = "pro",
  ENTERPRISE = "enterprise"
}

// Define the user roles
export enum UserRole {
  USER = "user",
  ADMIN = "admin"
}

// Define project status enum
export const projectStatusEnum = pgEnum('project_status', [
  'Planning',
  'In Progress',
  'Review',
  'Completed'
]);

// Define task status enum
export const taskStatusEnum = pgEnum('task_status', [
  'Pending',
  'In Progress',
  'Completed',
  'Blocked'
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default(UserRole.USER),
  plan: text("plan").notNull().default(SubscriptionPlan.FREE),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default('Planning'),
  progress: integer("progress").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Project tags - junction table
export const projectTags = pgTable("project_tags", {
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.projectId, t.tagId] }),
}));

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default('Pending'),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  createdById: integer("created_by_id").notNull().references(() => users.id),
});

// Project collaborators - junction table
export const projectCollaborators = pgTable("project_collaborators", {
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text("role").notNull().default('member'), // member, owner, admin
  addedAt: timestamp("added_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.projectId, t.userId] }),
}));

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // project, task, user
  entityId: integer("entity_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: text("metadata"), // Additional JSON metadata
});

// Establish relationships
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tasksCreated: many(tasks, { relationName: "createdTasks" }),
  tasksAssigned: many(tasks, { relationName: "assignedTasks" }),
  collaboratedProjects: many(projectCollaborators),
  activities: many(activityLogs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
  collaborators: many(projectCollaborators),
  projectTags: many(projectTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  projectTags: many(projectTags),
}));

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
  project: one(projects, {
    fields: [projectTags.projectId],
    references: [projects.id],
  }),
  tag: one(tags, {
    fields: [projectTags.tagId],
    references: [tags.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "createdTasks",
  }),
}));

export const projectCollaboratorsRelations = relations(projectCollaborators, ({ one }) => ({
  project: one(projects, {
    fields: [projectCollaborators.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectCollaborators.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Schema definitions for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  plan: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  status: true,
  userId: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  dueDate: true,
  projectId: true,
  assignedToId: true,
  createdById: true,
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertTag = z.infer<typeof insertTagSchema>;
