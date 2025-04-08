import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionPlan } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  Users, 
  Clock, 
  Tag, 
  ChevronRight, 
  AlertTriangle,
  LucideIcon
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types for projects
interface Project {
  id: number;
  name: string;
  description: string;
  status: "Planning" | "In Progress" | "Review" | "Completed";
  progress: number;
  createdAt: string;
  collaborators: number;
  tags: string[];
}

// Mock project data (would be replaced with real API calls)
const mockProjects: Project[] = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Complete overhaul of the company website with modern design principles",
    status: "In Progress",
    progress: 65,
    createdAt: "2023-04-15",
    collaborators: 4,
    tags: ["Design", "Frontend"]
  },
  {
    id: 2,
    name: "Marketing Campaign",
    description: "Q2 marketing campaign for product launch",
    status: "Planning",
    progress: 25,
    createdAt: "2023-04-10",
    collaborators: 3,
    tags: ["Marketing", "Social Media"]
  },
  {
    id: 3,
    name: "Product Launch",
    description: "Preparation for new product launch event",
    status: "Review",
    progress: 80,
    createdAt: "2023-03-28",
    collaborators: 6,
    tags: ["Product", "Event"]
  },
  {
    id: 4,
    name: "Customer Feedback Analysis",
    description: "Review and analyze customer feedback for service improvements",
    status: "Completed",
    progress: 100,
    createdAt: "2023-03-15",
    collaborators: 2,
    tags: ["Research", "Customer"]
  }
];

// Create a feature limitation component to show upgrade prompts
interface FeatureLimitationProps {
  feature: string;
  planRequired: SubscriptionPlan;
  icon: LucideIcon;
}

function FeatureLimitation({ feature, planRequired, icon: Icon }: FeatureLimitationProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4 flex items-start gap-3">
      <AlertTriangle className="text-amber-500 h-6 w-6 mt-1 flex-shrink-0" />
      <div>
        <h3 className="font-medium text-amber-800">{feature} requires a {planRequired} plan</h3>
        <p className="text-amber-700 text-sm mt-1">
          Upgrade your subscription to access this feature and many more.
        </p>
        <Button variant="outline" className="mt-2 bg-white border-amber-300 text-amber-800 hover:bg-amber-100">
          <Link to="/upgrade">Upgrade Now</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    tags: ""
  });

  // Query to fetch projects (using mock data for now)
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      // In a real app, this would fetch from the API
      // For now, we'll return mock data
      return new Promise(resolve => {
        setTimeout(() => resolve(mockProjects), 800);
      });
    },
  });

  // Mutation for creating a new project
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; description: string; tags: string[] }) => {
      // This would actually call the API in a real app
      // For now, we'll simulate an API call
      return await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            id: Math.floor(Math.random() * 1000),
            name: projectData.name,
            description: projectData.description,
            status: "Planning" as const,
            progress: 0,
            createdAt: new Date().toISOString().split('T')[0],
            collaborators: 1,
            tags: projectData.tags
          });
        }, 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewProject({ name: "", description: "", tags: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating project",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProject.name) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project.",
        variant: "destructive",
      });
      return;
    }

    createProjectMutation.mutate({
      name: newProject.name,
      description: newProject.description,
      tags: newProject.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
    });
  };

  const getFilteredProjects = () => {
    if (!projects) return [];
    
    switch (selectedTab) {
      case "active":
        return projects.filter(p => p.status === "In Progress" || p.status === "Review");
      case "planning":
        return projects.filter(p => p.status === "Planning");
      case "completed":
        return projects.filter(p => p.status === "Completed");
      default:
        return projects;
    }
  };

  // Calculate project limits based on subscription plan
  const getProjectLimits = () => {
    if (!user) return { current: 0, max: 0 };
    
    switch (user.plan) {
      case SubscriptionPlan.FREE:
        return { current: projects?.length || 0, max: 3 };
      case SubscriptionPlan.PRO:
        return { current: projects?.length || 0, max: 15 };
      case SubscriptionPlan.ENTERPRISE:
        return { current: projects?.length || 0, max: Infinity };
      default:
        return { current: 0, max: 0 };
    }
  };

  const projectLimits = getProjectLimits();
  const canCreateProject = projectLimits.current < projectLimits.max;
  const filteredProjects = getFilteredProjects();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">
            Manage and track your projects ({projectLimits.current} of {projectLimits.max === Infinity ? 'unlimited' : projectLimits.max})
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="flex items-center"
            disabled={!canCreateProject}
            asChild
          >
            <Link to="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Link>
          </Button>
          {!canCreateProject && user?.plan !== SubscriptionPlan.ENTERPRISE && (
            <p className="text-xs text-red-500 mt-1">
              Project limit reached. Upgrade your plan to create more projects.
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Additional features based on plan */}
      {user?.plan === SubscriptionPlan.FREE && (
        <FeatureLimitation 
          feature="Advanced project analytics" 
          planRequired={SubscriptionPlan.PRO} 
          icon={AlertTriangle} 
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 px-6">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="mt-1">{project.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {(user?.plan !== SubscriptionPlan.FREE) && (
                    <>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2 sm:mb-0">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {project.createdAt}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{project.collaborators} collaborators</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Status: {project.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-500">{project.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary hover:text-primary/80 flex items-center"
                >
                  View details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to your workspace. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Project Name*
              </label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="project-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="project-description"
                placeholder="Enter project description"
                rows={3}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="project-tags" className="text-sm font-medium">
                Tags (comma separated)
              </label>
              <Input
                id="project-tags"
                placeholder="Design, Marketing, Development"
                value={newProject.tags}
                onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={createProjectMutation.isPending}
              className="ml-2"
            >
              {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}