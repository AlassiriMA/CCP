import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { UserRole, SubscriptionPlan, insertProjectSchema, insertTaskSchema, insertTagSchema } from "@shared/schema";
import { eq, and, not, count, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { tags } from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is an admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === UserRole.ADMIN) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

// Middleware to check if user has subscription plan (PRO or higher)
const hasSubscription = (minPlan: SubscriptionPlan = SubscriptionPlan.PRO) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    const userPlan = req.user.plan as SubscriptionPlan;
    
    // Check if the user's plan meets the minimum requirement
    if (minPlan === SubscriptionPlan.FREE ||
        (minPlan === SubscriptionPlan.PRO && 
          (userPlan === SubscriptionPlan.PRO || userPlan === SubscriptionPlan.ENTERPRISE)) ||
        (minPlan === SubscriptionPlan.ENTERPRISE && userPlan === SubscriptionPlan.ENTERPRISE)) {
      return next();
    }
    
    res.status(403).json({ 
      message: "Upgrade required", 
      requiredPlan: minPlan 
    });
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get all users (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password field from users before sending
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve users" });
    }
  });

  // Get a specific user (admin only)
  app.get("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password field before sending
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user" });
    }
  });

  // Update a user's plan (admin only)
  app.patch("/api/users/:id/plan", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { plan } = req.body;
      
      if (!Object.values(SubscriptionPlan).includes(plan)) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }
      
      const updatedUser = await storage.updateUserPlan(id, plan);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password field before sending
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user plan" });
    }
  });

  // Update user subscription (for Stripe integration)
  app.post("/api/update-subscription", isAuthenticated, async (req, res) => {
    try {
      const { plan } = req.body;
      const userId = req.user!.id;
      
      if (!Object.values(SubscriptionPlan).includes(plan)) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }
      
      const updatedUser = await storage.updateUserPlan(userId, plan);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password field before sending
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // USER STATS & ANALYTICS
  
  // User statistics (requires authentication)
  app.get("/api/user-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user statistics" });
    }
  });
  
  // Analytics data (requires authentication)
  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get user statistics with project counts
      const userStats = await storage.getUserStats(userId);
      
      // Get activity logs
      const activities = await storage.getRecentActivities(userId, 5);
      
      res.json({
        ...userStats,
        recentActivities: activities
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve analytics data" });
    }
  });

  // Admin analytics (admin only)
  app.get("/api/admin/analytics", isAdmin, async (req, res) => {
    try {
      // Get admin overview data
      const overview = await storage.getAdminOverview();
      
      // Calculate revenue
      const monthlyRevenue = calculateMonthlyRevenue(
        overview.users.pro, 
        overview.users.enterprise
      );
      
      res.json({
        ...overview,
        monthlyRevenue
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve analytics" });
    }
  });
  
  // PROJECT MANAGEMENT
  
  // Get all projects for the current user
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve projects" });
    }
  });
  
  // Get a specific project
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is authorized (owner or collaborator)
      const userId = req.user!.id;
      if (project.userId !== userId) {
        // Check if user is a collaborator
        const collaborators = await storage.getProjectCollaborators(projectId);
        const isCollaborator = collaborators.some(c => c.userId === userId);
        
        if (!isCollaborator) {
          return res.status(403).json({ message: "Unauthorized access to project" });
        }
      }
      
      // Get tags for this project
      const tags = await storage.getProjectTags(projectId);
      
      res.json({
        ...project,
        tags
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve project" });
    }
  });
  
  // Create a new project (available with all plans but with different limitations)
  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userPlan = req.user!.plan as SubscriptionPlan;
      
      // Get existing project count
      const userProjects = await storage.getProjects(userId);
      
      // Check project limits based on subscription
      const projectLimit = userPlan === SubscriptionPlan.FREE 
        ? 3 
        : userPlan === SubscriptionPlan.PRO 
          ? 10 
          : 999; // Enterprise has virtually unlimited projects
      
      if (userProjects.length >= projectLimit) {
        return res.status(403).json({ 
          message: "Project limit reached for your subscription plan",
          currentPlan: userPlan,
          limit: projectLimit
        });
      }
      
      // Validate input using Zod schema
      const validationResult = insertProjectSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Create project
      const projectData = {
        ...validationResult.data,
        userId
      };
      
      const newProject = await storage.createProject(projectData);
      res.status(201).json(newProject);
    } catch (error) {
      res.status(500).json({ message: "Failed to create project" });
    }
  });
  
  // Update a project
  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is authorized (owner or collaborator with edit rights)
      const userId = req.user!.id;
      if (project.userId !== userId) {
        // Check if user is a collaborator with edit rights
        const collaborators = await storage.getProjectCollaborators(projectId);
        const userCollaboration = collaborators.find(c => c.userId === userId);
        
        if (!userCollaboration || userCollaboration.role !== 'editor') {
          return res.status(403).json({ message: "Unauthorized to update this project" });
        }
      }
      
      // Update project
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });
  
  // Delete a project
  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only the owner can delete a project
      const userId = req.user!.id;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Only the project owner can delete it" });
      }
      
      // Delete project
      await storage.deleteProject(projectId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });
  
  // TASK MANAGEMENT
  
  // Get all tasks for a project
  app.get("/api/projects/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is authorized (owner or collaborator)
      const userId = req.user!.id;
      if (project.userId !== userId) {
        // Check if user is a collaborator
        const collaborators = await storage.getProjectCollaborators(projectId);
        const isCollaborator = collaborators.some(c => c.userId === userId);
        
        if (!isCollaborator) {
          return res.status(403).json({ message: "Unauthorized access to project tasks" });
        }
      }
      
      const tasks = await storage.getProjectTasks(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve tasks" });
    }
  });
  
  // Create a new task for a project
  app.post("/api/projects/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is authorized (owner or collaborator)
      const userId = req.user!.id;
      if (project.userId !== userId) {
        // Check if user is a collaborator
        const collaborators = await storage.getProjectCollaborators(projectId);
        const isCollaborator = collaborators.some(c => c.userId === userId);
        
        if (!isCollaborator) {
          return res.status(403).json({ message: "Unauthorized to add tasks to this project" });
        }
      }
      
      // Validate input using Zod schema
      const validationResult = insertTaskSchema.safeParse({
        ...req.body,
        projectId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: validationResult.error.errors 
        });
      }
      
      const taskData = {
        ...validationResult.data,
        createdById: userId
      };
      
      const newTask = await storage.createTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  // Update a task
  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Get project to check authorization
      const project = await storage.getProjectById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is authorized (owner, task creator, or assignee)
      const userId = req.user!.id;
      if (project.userId !== userId && task.createdById !== userId && task.assignedToId !== userId) {
        // Check if user is a collaborator
        const collaborators = await storage.getProjectCollaborators(task.projectId);
        const isCollaborator = collaborators.some(c => c.userId === userId);
        
        if (!isCollaborator) {
          return res.status(403).json({ message: "Unauthorized to update this task" });
        }
      }
      
      // If marking as completed, set completedAt
      const taskData = { ...req.body };
      if (taskData.status === 'Completed' && !task.completedAt) {
        taskData.completedAt = new Date();
      }
      
      const updatedTask = await storage.updateTask(taskId, taskData);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  
  // Delete a task
  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Get project to check authorization
      const project = await storage.getProjectById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only project owner or task creator can delete a task
      const userId = req.user!.id;
      if (project.userId !== userId && task.createdById !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this task" });
      }
      
      await storage.deleteTask(taskId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  
  // COLLABORATOR MANAGEMENT
  
  // Get all collaborators for a project
  app.get("/api/projects/:id/collaborators", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is authorized (owner or collaborator)
      const userId = req.user!.id;
      if (project.userId !== userId) {
        // Check if user is a collaborator
        const collaborators = await storage.getProjectCollaborators(projectId);
        const isCollaborator = collaborators.some(c => c.userId === userId);
        
        if (!isCollaborator) {
          return res.status(403).json({ message: "Unauthorized access to project collaborators" });
        }
      }
      
      const collaborators = await storage.getProjectCollaborators(projectId);
      res.json(collaborators);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve collaborators" });
    }
  });
  
  // Add a collaborator to a project (PRO and ENTERPRISE only)
  app.post("/api/projects/:id/collaborators", hasSubscription(SubscriptionPlan.PRO), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only the project owner can add collaborators
      const userId = req.user!.id;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Only the project owner can add collaborators" });
      }
      
      const { collaboratorId, role = 'member' } = req.body;
      
      if (!collaboratorId) {
        return res.status(400).json({ message: "Collaborator ID is required" });
      }
      
      // Check if user exists
      const collaborator = await storage.getUser(parseInt(collaboratorId));
      if (!collaborator) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add collaborator
      const collaboration = await storage.addProjectCollaborator(projectId, collaborator.id, role);
      res.status(201).json(collaboration);
    } catch (error) {
      res.status(500).json({ message: "Failed to add collaborator" });
    }
  });
  
  // Remove a collaborator from a project
  app.delete("/api/projects/:projectId/collaborators/:userId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const collaboratorId = parseInt(req.params.userId);
      
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only the project owner can remove collaborators
      const userId = req.user!.id;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Only the project owner can remove collaborators" });
      }
      
      await storage.removeProjectCollaborator(projectId, collaboratorId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove collaborator" });
    }
  });
  
  // TAG MANAGEMENT
  
  // Get all tags
  app.get("/api/tags", isAuthenticated, async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve tags" });
    }
  });
  
  // Create a new tag
  app.post("/api/tags", isAuthenticated, async (req, res) => {
    try {
      // Validate input using Zod schema
      const validationResult = insertTagSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid tag data", 
          errors: validationResult.error.errors 
        });
      }
      
      const newTag = await storage.createTag(validationResult.data);
      res.status(201).json(newTag);
    } catch (error) {
      res.status(500).json({ message: "Failed to create tag" });
    }
  });
  
  // Add a tag to a project
  app.post("/api/projects/:id/tags", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is authorized (owner or editor collaborator)
      const userId = req.user!.id;
      if (project.userId !== userId) {
        // Check if user is a collaborator with edit rights
        const collaborators = await storage.getProjectCollaborators(projectId);
        const userCollaboration = collaborators.find(c => c.userId === userId);
        
        if (!userCollaboration || userCollaboration.role !== 'editor') {
          return res.status(403).json({ message: "Unauthorized to add tags to this project" });
        }
      }
      
      const { tagId, tagName } = req.body;
      
      if (!tagId && !tagName) {
        return res.status(400).json({ message: "Either tagId or tagName is required" });
      }
      
      let tag;
      
      if (tagId) {
        // Use existing tag
        [tag] = await db.select().from(tags).where(eq(tags.id, tagId));
        
        if (!tag) {
          return res.status(404).json({ message: "Tag not found" });
        }
      } else {
        // Create or get tag by name
        tag = await storage.getOrCreateTag(tagName);
      }
      
      // Assign tag to project
      await storage.assignTagToProject(projectId, tag.id);
      
      // Get updated tags for this project
      const projectTags = await storage.getProjectTags(projectId);
      
      res.status(201).json(projectTags);
    } catch (error) {
      res.status(500).json({ message: "Failed to add tag to project" });
    }
  });
  
  // Get tasks assigned to the current user
  app.get("/api/my-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tasks = await storage.getTasksAssignedToUser(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve assigned tasks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate monthly revenue
function calculateMonthlyRevenue(proUsers: any[], enterpriseUsers: any[]): number {
  const PRO_PRICE = 29;
  const ENTERPRISE_PRICE = 99;
  
  return (proUsers.length * PRO_PRICE) + (enterpriseUsers.length * ENTERPRISE_PRICE);
}
