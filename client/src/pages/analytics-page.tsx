import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubscriptionPlan } from "@shared/schema";
import { 
  Loader2, 
  AlertTriangle, 
  BarChart4, 
  LineChart, 
  PieChart, 
  Calendar, 
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Activity,
  LucideIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartLineChart, Line, PieChart as RechartPieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from "@/hooks/use-toast";

// Types for analytics data
interface AnalyticsData {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    teamMembers: number;
    avgCompletionTime: number;
  };
  projectPerformance: {
    name: string;
    completionRate: number;
    onTime: number;
    delayed: number;
  }[];
  taskActivity: {
    date: string;
    completed: number;
    created: number;
  }[];
  timeDistribution: {
    category: string;
    hours: number;
    color: string;
  }[];
  userActivity: {
    user: string;
    tasks: number;
    completionRate: number;
  }[];
}

// Mock analytics data
const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalProjects: 12,
    activeProjects: 8,
    completedProjects: 4,
    totalTasks: 156,
    completedTasks: 98,
    teamMembers: 8,
    avgCompletionTime: 3.2, // days
  },
  projectPerformance: [
    { name: "Website Redesign", completionRate: 65, onTime: 18, delayed: 4 },
    { name: "Marketing Campaign", completionRate: 25, onTime: 8, delayed: 2 },
    { name: "Product Launch", completionRate: 80, onTime: 24, delayed: 6 },
    { name: "Mobile App", completionRate: 45, onTime: 15, delayed: 9 },
    { name: "Brand Refresh", completionRate: 90, onTime: 12, delayed: 1 },
  ],
  taskActivity: [
    { date: "Mon", completed: 12, created: 15 },
    { date: "Tue", completed: 18, created: 10 },
    { date: "Wed", completed: 15, created: 12 },
    { date: "Thu", completed: 20, created: 14 },
    { date: "Fri", completed: 25, created: 8 },
    { date: "Sat", completed: 5, created: 2 },
    { date: "Sun", completed: 3, created: 5 },
  ],
  timeDistribution: [
    { category: "Design", hours: 28, color: "#8884d8" },
    { category: "Development", hours: 40, color: "#83a6ed" },
    { category: "Meetings", hours: 12, color: "#8dd1e1" },
    { category: "Research", hours: 8, color: "#82ca9d" },
    { category: "Planning", hours: 15, color: "#ffc658" },
  ],
  userActivity: [
    { user: "John Doe", tasks: 45, completionRate: 88 },
    { user: "Jane Smith", tasks: 32, completionRate: 94 },
    { user: "Bob Johnson", tasks: 28, completionRate: 75 },
    { user: "Alice Williams", tasks: 38, completionRate: 82 },
    { user: "Charlie Brown", tasks: 22, completionRate: 91 },
  ],
};

// Component to show upgrade prompt for locked features
interface FeatureLockProps {
  title: string;
  description: string;
  icon: LucideIcon;
  requiredPlan: SubscriptionPlan;
}

function FeatureLock({ title, description, icon: Icon, requiredPlan }: FeatureLockProps) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center h-full">
      <div className="bg-gray-100 p-3 rounded-full mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      <Button asChild className="mt-2">
        <a href="/upgrade">Upgrade to {requiredPlan}</a>
      </Button>
    </div>
  );
}

// Stats card component for overview metrics
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  className?: string;
}

function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <div className={`flex items-center mt-1 text-sm ${trend.direction === "up" ? "text-green-600" : "text-red-600"}`}>
                {trend.direction === "up" ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("7days");
  const [reportType, setReportType] = useState("performance");

  // Query to fetch analytics data
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics', dateRange],
    queryFn: async () => {
      // In a real app, this would fetch from the API with the date range parameter
      // For now, we'll return mock data
      return new Promise(resolve => {
        setTimeout(() => resolve(mockAnalyticsData), 800);
      });
    },
  });

  const handleExportReport = () => {
    // This would generate a report download in a real app
    // For now, just show a toast
    toast({
      title: "Report Exported",
      description: "Your analytics report has been exported successfully.",
    });
  };

  // Determine which features are available based on user's plan
  const canAccessAdvancedAnalytics = user?.plan !== SubscriptionPlan.FREE;
  const canAccessUserAnalytics = user?.plan === SubscriptionPlan.ENTERPRISE;
  const canExportReports = user?.plan !== SubscriptionPlan.FREE;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Monitor your project performance and team productivity
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          {canExportReports ? (
            <Button onClick={handleExportReport} className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          ) : (
            <Button disabled className="flex items-center opacity-60">
              <Download className="mr-2 h-4 w-4" />
              Export Report
              <span className="ml-2 text-xs">(Pro+)</span>
            </Button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Projects" 
          value={analytics?.overview.totalProjects || 0} 
          icon={BarChart4}
          trend={{ direction: "up", value: "+15% from last month" }}
        />
        <StatCard 
          title="Completion Rate" 
          value={`${Math.round((analytics?.overview.completedTasks || 0) / (analytics?.overview.totalTasks || 1) * 100)}%`} 
          icon={Activity}
          trend={{ direction: "up", value: "+8% from last month" }}
        />
        <StatCard 
          title="Team Members" 
          value={analytics?.overview.teamMembers || 0} 
          icon={Users}
        />
        <StatCard 
          title="Avg. Completion Time" 
          value={`${analytics?.overview.avgCompletionTime || 0} days`} 
          icon={Clock}
          trend={{ direction: "down", value: "-0.5 days from last month" }}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="performance" value={reportType} onValueChange={setReportType} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tasks">Task Activity</TabsTrigger>
          <TabsTrigger value="time">Time Distribution</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Performance</CardTitle>
              <CardDescription>
                Completion rates and task status for your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics?.projectPerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completionRate" name="Completion Rate (%)" fill="#8884d8" />
                    <Bar dataKey="onTime" name="Tasks On Time" fill="#82ca9d" />
                    <Bar dataKey="delayed" name="Delayed Tasks" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Activity Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Activity</CardTitle>
              <CardDescription>
                Tasks created vs completed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canAccessAdvancedAnalytics ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartLineChart
                      data={analytics?.taskActivity}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completed" name="Tasks Completed" stroke="#82ca9d" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="created" name="Tasks Created" stroke="#8884d8" />
                    </RechartLineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <FeatureLock
                  title="Advanced Task Analytics"
                  description="Upgrade to Pro to access detailed task analytics, including completion trends and bottleneck identification."
                  icon={LineChart}
                  requiredPlan={SubscriptionPlan.PRO}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Distribution Tab */}
        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Distribution</CardTitle>
              <CardDescription>
                How your team's time is distributed across different activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canAccessAdvancedAnalytics ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={analytics?.timeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="hours"
                        nameKey="category"
                      >
                        {analytics?.timeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <FeatureLock
                  title="Time Distribution Analytics"
                  description="Upgrade to Pro to see how your team's time is distributed across different project categories and activities."
                  icon={PieChart}
                  requiredPlan={SubscriptionPlan.PRO}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Activity</CardTitle>
              <CardDescription>
                Individual performance and task completion by team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canAccessUserAnalytics ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">Team Member</th>
                        <th scope="col" className="px-6 py-3">Tasks Assigned</th>
                        <th scope="col" className="px-6 py-3">Completion Rate</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.userActivity.map((user, index) => (
                        <tr key={index} className="bg-white border-b">
                          <td className="px-6 py-4 font-medium text-gray-900">{user.user}</td>
                          <td className="px-6 py-4">{user.tasks}</td>
                          <td className="px-6 py-4">{user.completionRate}%</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.completionRate > 85 ? 'bg-green-100 text-green-800' : 
                              user.completionRate > 70 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {user.completionRate > 85 ? 'Excellent' : 
                               user.completionRate > 70 ? 'Good' : 
                               'Needs Improvement'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <FeatureLock
                  title="Team Member Analytics"
                  description="Upgrade to Enterprise to access detailed performance metrics for individual team members and identify top performers."
                  icon={Users}
                  requiredPlan={SubscriptionPlan.ENTERPRISE}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Notice for Free Users */}
      {user?.plan === SubscriptionPlan.FREE && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Unlock the full power of analytics
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Upgrade to Pro to access advanced analytics features, including historical data, 
                  export capabilities, and detailed performance metrics.
                </p>
              </div>
              <div className="mt-4">
                <Button size="sm" asChild>
                  <a href="/upgrade">Upgrade to Pro</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}