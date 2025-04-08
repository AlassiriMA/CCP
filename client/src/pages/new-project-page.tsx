import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import NewProjectForm from "@/components/projects/new-project-form";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionPlan } from "@shared/schema";

export default function NewProjectPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Get existing projects to check limits
  const { data: userProjects = [], isLoading: isLoadingProjects } = useQuery<any[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check project limits based on subscription
  if (!isLoadingProjects) {
    const userPlan = user.plan as SubscriptionPlan;
    const projectLimit = userPlan === SubscriptionPlan.FREE
      ? 3
      : userPlan === SubscriptionPlan.PRO
        ? 10
        : 999; // Enterprise has virtually unlimited projects
        
    if (userProjects.length >= projectLimit) {
      navigate("/upgrade");
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl">Create New Project</CardTitle>
            <CardDescription>
              Fill out the form below to create a new project
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <NewProjectForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}