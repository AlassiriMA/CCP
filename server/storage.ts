import { 
  users, 
  projects, 
  tasks, 
  tags, 
  projectTags, 
  activityLogs, 
  projectCollaborators,
  SubscriptionPlan, 
  UserRole, 
  type User, 
  type InsertUser, 
  type Project, 
  type InsertProject,
  type Task,
  type InsertTask,
  type Tag,
  type InsertTag,
  type ActivityLog
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, desc, sql, count, isNull, not, max, min, avg } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import pg from 'pg';
const { Pool } = pg;
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? true : false,
});

// Interface for managing the application data
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByPlan(plan: SubscriptionPlan): Promise<User[]>;
  updateUserPlan(id: number, plan: SubscriptionPlan): Promise<User | undefined>;
  updateUserStripeInfo(id: number, customerInfo: { customerId: string; subscriptionId: string }): Promise<User | undefined>;
  updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined>;
  
  // Project management
  getProjects(userId: number): Promise<Project[]>;
  getProjectById(projectId: number): Promise<Project | undefined>;
  createProject(project: InsertProject & { tags?: string[] }): Promise<Project>;
  updateProject(projectId: number, projectData: Partial<Project>): Promise<Project | undefined>;
  deleteProject(projectId: number): Promise<boolean>;
  getProjectCollaborators(projectId: number): Promise<any[]>;
  addProjectCollaborator(projectId: number, userId: number, role?: string): Promise<any>;
  removeProjectCollaborator(projectId: number, userId: number): Promise<boolean>;
  getProjectTags(projectId: number): Promise<Tag[]>;
  
  // Task management
  getProjectTasks(projectId: number): Promise<Task[]>;
  getTaskById(taskId: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(taskId: number, taskData: Partial<Task>): Promise<Task | undefined>;
  deleteTask(taskId: number): Promise<boolean>;
  getTasksAssignedToUser(userId: number): Promise<Task[]>;
  
  // Tag management
  getAllTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  getOrCreateTag(tagName: string): Promise<Tag>;
  assignTagToProject(projectId: number, tagId: number): Promise<void>;
  
  // Activity logs
  logActivity(activity: { action: string, entityType: string, entityId: number, userId: number, metadata?: string }): Promise<ActivityLog>;
  getRecentActivities(userId: number, limit?: number): Promise<ActivityLog[]>;
  
  // Analytics
  getUserStats(userId: number): Promise<any>;
  getAdminOverview(): Promise<any>;
  
  // Session management
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true,
    });
    
    // Initialize with an admin user if not exists
    this.getUserByUsername("admin").then(user => {
      if (!user) {
        this.createUser({
          username: "admin",
          password: "admin123", // This will be hashed by auth.ts
          email: "admin@saaspro.com",
          firstName: "Admin",
          lastName: "User",
          plan: SubscriptionPlan.ENTERPRISE
        }).then(user => {
          this.updateUser(user.id, { role: UserRole.ADMIN });
        });
      }
    });
  }

  // User management methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: UserRole.USER,
        plan: insertUser.plan || SubscriptionPlan.FREE,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByPlan(plan: SubscriptionPlan): Promise<User[]> {
    return db.select().from(users).where(eq(users.plan, plan));
  }

  async updateUserPlan(id: number, plan: SubscriptionPlan): Promise<User | undefined> {
    return this.updateUser(id, { plan });
  }

  async updateUserStripeInfo(id: number, customerInfo: { customerId: string; subscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(id, { 
      stripeCustomerId: customerInfo.customerId,
      stripeSubscriptionId: customerInfo.subscriptionId
    });
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined> {
    return this.updateUser(id, { stripeCustomerId: customerId });
  }
  
  // Project management methods
  async getProjects(userId: number): Promise<Project[]> {
    // Get all projects where the user is either the owner or a collaborator
    const userProjects = await db.select()
      .from(projects)
      .where(eq(projects.userId, userId));
    
    const collaboratedProjects = await db.select({
        project: projects
      })
      .from(projectCollaborators)
      .innerJoin(projects, eq(projectCollaborators.projectId, projects.id))
      .where(eq(projectCollaborators.userId, userId));
    
    const collaboratedProjectsArray = collaboratedProjects.map(row => row.project);
    
    return [...userProjects, ...collaboratedProjectsArray];
  }
  
  async getProjectById(projectId: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    return project;
  }
  
  async createProject(projectData: InsertProject & { tags?: string[] }): Promise<Project> {
    const { tags: tagList, ...projectDetails } = projectData;
    
    // Create the project
    const [project] = await db.insert(projects)
      .values(projectDetails)
      .returning();
    
    // Add tags if provided
    if (tagList && tagList.length > 0) {
      for (const tagName of tagList) {
        // Get or create the tag
        const tag = await this.getOrCreateTag(tagName);
        
        // Associate tag with project
        await this.assignTagToProject(project.id, tag.id);
      }
    }
    
    // Log activity
    await this.logActivity({
      action: 'Project created',
      entityType: 'project',
      entityId: project.id,
      userId: projectDetails.userId
    });
    
    return project;
  }
  
  async updateProject(projectId: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db.update(projects)
      .set(projectData)
      .where(eq(projects.id, projectId))
      .returning();
    
    if (project) {
      // Log activity
      await this.logActivity({
        action: 'Project updated',
        entityType: 'project',
        entityId: project.id,
        userId: project.userId
      });
    }
    
    return project;
  }
  
  async deleteProject(projectId: number): Promise<boolean> {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return false;
    
    // Delete the project (foreign key constraints will cascade and delete related records)
    await db.delete(projects).where(eq(projects.id, projectId));
    
    // Log activity
    await this.logActivity({
      action: 'Project deleted',
      entityType: 'project',
      entityId: projectId,
      userId: project.userId
    });
    
    return true;
  }
  
  async getProjectCollaborators(projectId: number): Promise<any[]> {
    return db.select({
        userId: projectCollaborators.userId,
        role: projectCollaborators.role,
        addedAt: projectCollaborators.addedAt,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(projectCollaborators)
      .innerJoin(users, eq(projectCollaborators.userId, users.id))
      .where(eq(projectCollaborators.projectId, projectId));
  }
  
  async addProjectCollaborator(projectId: number, userId: number, role: string = 'member'): Promise<any> {
    const [collaboration] = await db.insert(projectCollaborators)
      .values({
        projectId,
        userId,
        role
      })
      .returning();
    
    // Log activity
    await this.logActivity({
      action: 'Collaborator added',
      entityType: 'project',
      entityId: projectId,
      userId
    });
    
    return collaboration;
  }
  
  async removeProjectCollaborator(projectId: number, userId: number): Promise<boolean> {
    await db.delete(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
    
    // Log activity
    await this.logActivity({
      action: 'Collaborator removed',
      entityType: 'project',
      entityId: projectId,
      userId
    });
    
    return true;
  }
  
  async getProjectTags(projectId: number): Promise<Tag[]> {
    const tagRecords = await db.select({
        tag: tags
      })
      .from(projectTags)
      .innerJoin(tags, eq(projectTags.tagId, tags.id))
      .where(eq(projectTags.projectId, projectId));
    
    return tagRecords.map(record => record.tag);
  }
  
  // Task management methods
  async getProjectTasks(projectId: number): Promise<Task[]> {
    return db.select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));
  }
  
  async getTaskById(taskId: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    return task;
  }
  
  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks)
      .values(taskData)
      .returning();
    
    // Log activity
    await this.logActivity({
      action: 'Task created',
      entityType: 'task',
      entityId: task.id,
      userId: taskData.createdById
    });
    
    return task;
  }
  
  async updateTask(taskId: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set(taskData)
      .where(eq(tasks.id, taskId))
      .returning();
    
    if (task) {
      // Log activity
      await this.logActivity({
        action: 'Task updated',
        entityType: 'task',
        entityId: task.id,
        userId: task.createdById
      });
    }
    
    return task;
  }
  
  async deleteTask(taskId: number): Promise<boolean> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return false;
    
    await db.delete(tasks).where(eq(tasks.id, taskId));
    
    // Log activity
    await this.logActivity({
      action: 'Task deleted',
      entityType: 'task',
      entityId: taskId,
      userId: task.createdById
    });
    
    return true;
  }
  
  async getTasksAssignedToUser(userId: number): Promise<Task[]> {
    return db.select()
      .from(tasks)
      .where(eq(tasks.assignedToId, userId))
      .orderBy(desc(tasks.createdAt));
  }
  
  // Tag management methods
  async getAllTags(): Promise<Tag[]> {
    return db.select().from(tags);
  }
  
  async createTag(tagData: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags)
      .values(tagData)
      .returning();
    
    return tag;
  }
  
  async getOrCreateTag(tagName: string): Promise<Tag> {
    // Try to find existing tag
    const [existingTag] = await db.select()
      .from(tags)
      .where(eq(tags.name, tagName));
    
    if (existingTag) {
      return existingTag;
    }
    
    // Create new tag if doesn't exist
    return this.createTag({ name: tagName });
  }
  
  async assignTagToProject(projectId: number, tagId: number): Promise<void> {
    // Check if the association already exists
    const [existingAssociation] = await db.select()
      .from(projectTags)
      .where(
        and(
          eq(projectTags.projectId, projectId),
          eq(projectTags.tagId, tagId)
        )
      );
    
    if (!existingAssociation) {
      await db.insert(projectTags)
        .values({
          projectId,
          tagId
        });
    }
  }
  
  // Activity log methods
  async logActivity(activityData: { action: string, entityType: string, entityId: number, userId: number, metadata?: string }): Promise<ActivityLog> {
    const [activity] = await db.insert(activityLogs)
      .values({
        action: activityData.action,
        entityType: activityData.entityType,
        entityId: activityData.entityId,
        userId: activityData.userId,
        metadata: activityData.metadata
      })
      .returning();
    
    return activity;
  }
  
  async getRecentActivities(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    const activities = await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
    
    return activities;
  }
  
  // Analytics methods
  async getUserStats(userId: number): Promise<any> {
    // Count total projects
    const [projectCount] = await db.select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, userId));
    
    // Count active tasks
    const [activeTasksCount] = await db.select({ count: count() })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(projects.userId, userId),
          not(eq(tasks.status, 'Completed'))
        )
      );
    
    // Calculate completion rate
    const [taskStats] = await db.select({
        total: count(),
        completed: count(tasks.completedAt)
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.userId, userId));
    
    const completionRate = taskStats.total > 0 
      ? Math.round((taskStats.completed / taskStats.total) * 100) 
      : 0;
    
    return {
      totalProjects: projectCount.count,
      activeTasksCount: activeTasksCount.count,
      completionRate
    };
  }
  
  async getAdminOverview(): Promise<any> {
    // User statistics
    const [userCounts] = await db.select({
        total: count(),
        free: count(eq(users.plan, SubscriptionPlan.FREE)),
        pro: count(eq(users.plan, SubscriptionPlan.PRO)),
        enterprise: count(eq(users.plan, SubscriptionPlan.ENTERPRISE))
      })
      .from(users);
    
    // Project statistics
    const [projectStats] = await db.select({
        total: count(),
        planning: count(eq(projects.status, 'Planning')),
        inProgress: count(eq(projects.status, 'In Progress')),
        review: count(eq(projects.status, 'Review')),
        completed: count(eq(projects.status, 'Completed'))
      })
      .from(projects);
    
    // Task statistics
    const [taskStats] = await db.select({
        total: count(),
        pending: count(eq(tasks.status, 'Pending')),
        inProgress: count(eq(tasks.status, 'In Progress')),
        completed: count(eq(tasks.status, 'Completed')),
        blocked: count(eq(tasks.status, 'Blocked'))
      })
      .from(tasks);
    
    // Recent signups
    const recentUsers = await db.select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);
    
    return {
      users: userCounts,
      projects: projectStats,
      tasks: taskStats,
      recentSignups: recentUsers
    };
  }
}

export const storage = new DatabaseStorage();
