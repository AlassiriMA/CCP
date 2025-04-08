import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionBadge } from "@/components/ui/subscription-badge";
import { Project, SubscriptionPlan, UserRole } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Bell, ChevronDown, LayoutDashboard, Users, BarChart2, Settings } from "lucide-react";
import WelcomeMessage from "@/components/dashboard/welcome-message";
import StatsCard from "@/components/dashboard/stats-card";
import ProjectCard from "@/components/dashboard/project-card";
import ActivityItem from "@/components/dashboard/activity-item";

interface Analytics {
  totalProjects: number;
  activeTasksCount: number;
  completionRate: number;
  recentActivities: Array<{
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    userId: number;
    timestamp: string;
    metadata?: string;
  }>;
}

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<Analytics>({
    queryKey: ['/api/analytics'],
    enabled: !!user,
  });
  
  const { data: userProjects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSignout = () => {
    logoutMutation.mutate();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#user-menu-button') && !target.closest('#user-menu')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-primary font-bold text-2xl mr-8">SaaSPro</span>
            <div className="hidden md:flex space-x-8">
              <Link
                to="/dashboard"
                className={`text-${activeTab === 'overview' ? 'gray-900 border-b-2 border-primary' : 'gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'} px-1 pb-3 text-sm font-medium`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </Link>
              <Link
                to="/projects"
                className={`text-${activeTab === 'projects' ? 'gray-900 border-b-2 border-primary' : 'gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'} px-1 pb-3 text-sm font-medium`}
                onClick={() => setActiveTab('projects')}
              >
                Projects
              </Link>
              <Link
                to="/analytics"
                className={`text-${activeTab === 'analytics' ? 'gray-900 border-b-2 border-primary' : 'gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'} px-1 pb-3 text-sm font-medium`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </Link>
              <Link
                to="#dashboard-settings"
                className={`text-${activeTab === 'settings' ? 'gray-900 border-b-2 border-primary' : 'gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'} px-1 pb-3 text-sm font-medium`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <SubscriptionBadge plan={user.plan as SubscriptionPlan} />
            
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-600">
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="relative inline-block text-left">
              <Button 
                variant="ghost" 
                size="icon" 
                id="user-menu-button"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                onClick={toggleUserMenu}
                className="bg-gray-100 rounded-full h-8 w-8 p-0"
              >
                <span className="sr-only">Open user menu</span>
                <img 
                  className="h-8 w-8 rounded-full" 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                  alt="User profile" 
                />
              </Button>
              {isUserMenuOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" 
                  role="menu" 
                  aria-orientation="vertical" 
                  aria-labelledby="user-menu-button" 
                  id="user-menu"
                >
                  <Link to="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Your Profile</Link>
                  <Link to="#account-settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Account Settings</Link>
                  <Link to="/upgrade" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Subscription & Billing</Link>
                  {user.role === UserRole.ADMIN && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Admin Panel</Link>
                  )}
                  <button 
                    onClick={handleSignout} 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Message */}
        <div className="px-4 sm:px-0 mb-6">
          <WelcomeMessage user={user} />
        </div>

        {/* Dashboard Overview */}
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
            <StatsCard 
              title="Total Projects"
              value={analytics?.totalProjects || 12}
              change="+12.5%"
              previousValue="from 8 last month"
            />
            <StatsCard 
              title="Active Tasks"
              value={analytics?.activeTasksCount || 36}
              change="+28.4%"
              previousValue="from 28 last week"
              changeType="positive"
            />
            <StatsCard 
              title="Project Completion"
              value={`${analytics?.completionRate || 78}%`}
              status="On track"
              previousValue="average completion rate"
            />
          </div>

          {/* Recent Projects */}
          <Card className="mb-6">
            <CardHeader className="border-b border-gray-200 flex justify-between items-center">
              <CardTitle>Recent Projects</CardTitle>
              {userProjects && userProjects.length >= 3 && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/projects/new">New Project</Link>
                </Button>
              )}
            </CardHeader>
            {isLoadingProjects ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userProjects && userProjects.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {userProjects.slice(0, 5).map((project) => (
                  <ProjectCard 
                    key={project.id}
                    name={project.name}
                    updatedAt={new Date(project.createdAt || Date.now()).toLocaleDateString()}
                    status={project.status}
                  />
                ))}
              </ul>
            ) : (
              <div className="py-10 text-center">
                <p className="text-gray-500 mb-4">You don't have any projects yet</p>
                <Button variant="default" asChild>
                  <Link to="/projects/new">Create your first project</Link>
                </Button>
              </div>
            )}
            <div className="px-6 py-4 border-t border-gray-200">
              <Link to="/projects" className="text-primary hover:text-primary/80 font-medium text-sm">View all projects</Link>
            </div>
          </Card>

          {/* Activity & Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              {isLoadingAnalytics ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : analytics?.recentActivities && analytics.recentActivities.length > 0 ? (
                <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                  {analytics.recentActivities.map((activity) => (
                    <ActivityItem 
                      key={activity.id}
                      user={{
                        name: user.username,
                        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      }}
                      action={`${activity.action} on ${activity.entityType} #${activity.entityId}`}
                      time={new Date(activity.timestamp).toLocaleString()}
                    />
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-gray-500">No recent activity yet</p>
                </div>
              )}
              <div className="px-6 py-4 border-t border-gray-200">
                <a href="#all-activity" className="text-primary hover:text-primary/80 font-medium text-sm">View all activity</a>
              </div>
            </Card>

            {/* Analytics Summary */}
            <Card>
              <CardHeader className="border-b border-gray-200 flex justify-between items-center">
                <CardTitle>Analytics Summary</CardTitle>
                <div className="flex items-center">
                  <Link to="/analytics" className="text-primary hover:text-primary/80 text-xs font-medium mr-3">
                    View detailed analytics
                  </Link>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-xs font-medium">Week</Button>
                    <Button variant="secondary" size="sm" className="text-xs font-medium">Month</Button>
                    <Button variant="ghost" size="sm" className="text-xs font-medium">Year</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="w-full h-48 bg-gray-50 rounded flex items-center justify-center">
                  {isLoadingAnalytics ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                  ) : (
                    <div className="text-center">
                      <BarChart2 className="h-10 w-10 text-gray-300 mb-2 mx-auto" />
                      <p className="text-sm text-gray-500">Analytics data visualization</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">Task Completion Rate</p>
                    <p className="text-lg font-semibold text-gray-900">82%</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">Team Productivity</p>
                    <p className="text-lg font-semibold text-gray-900">+15%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
