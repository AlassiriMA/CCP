import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { SubscriptionPlan, UserRole } from "@shared/schema";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  requiredPlans?: SubscriptionPlan[];
  adminOnly?: boolean;
};

export function ProtectedRoute({
  path,
  component: Component,
  requiredPlans,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading state while auth status is being determined
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check admin access if required
  if (adminOnly && user.role !== UserRole.ADMIN) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <a href="/" className="text-primary hover:underline">Return to Dashboard</a>
        </div>
      </Route>
    );
  }

  // Check subscription plan requirements if specified
  if (requiredPlans && requiredPlans.length > 0 && !requiredPlans.includes(user.plan as SubscriptionPlan)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-2">Subscription Required</h1>
          <p className="text-gray-600 mb-4">This feature requires a higher subscription plan.</p>
          <a href="/pricing" className="text-primary hover:underline">View Plans</a>
        </div>
      </Route>
    );
  }

  // Render the component if all checks pass
  return <Route path={path} component={Component} />;
}
