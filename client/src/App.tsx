import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import AdminPanel from "@/pages/admin-panel";
import ProjectsPage from "@/pages/projects-page";
import NewProjectPage from "@/pages/new-project-page";
import AnalyticsPage from "@/pages/analytics-page";
import UpgradePage from "@/pages/upgrade-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { SubscriptionPlan, UserRole } from "@shared/schema";
import { Loader2 } from "lucide-react";

function App() {
  return (
    <>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />

        {/* Protected routes */}
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/projects" component={ProjectsPage} />
        <ProtectedRoute path="/projects/new" component={NewProjectPage} />
        <ProtectedRoute path="/analytics" component={AnalyticsPage} />
        <ProtectedRoute path="/upgrade" component={UpgradePage} />
        <ProtectedRoute 
          path="/admin" 
          component={AdminPanel} 
          adminOnly={true} 
        />

        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
