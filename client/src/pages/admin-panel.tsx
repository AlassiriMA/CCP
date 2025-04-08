import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart2, Users, Crown, DollarSign, UserPlus, Menu, 
  Search, Bell, PieChart, Settings
} from "lucide-react";
import UserTable from "@/components/admin/user-table";

// Navigation items for the sidebar
const navigationItems = [
  { name: "Overview", icon: <BarChart2 className="mr-3 h-5 w-5" />, href: "#admin-overview" },
  { name: "User Management", icon: <Users className="mr-3 h-5 w-5" />, href: "#admin-users" },
  { name: "Subscriptions", icon: <Crown className="mr-3 h-5 w-5" />, href: "#admin-subscriptions" },
  { name: "Analytics", icon: <PieChart className="mr-3 h-5 w-5" />, href: "#admin-analytics" },
  { name: "Settings", icon: <Settings className="mr-3 h-5 w-5" />, href: "#admin-settings" }
];

export default function AdminPanel() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [activeItem, setActiveItem] = useState(navigationItems[0].href);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch admin analytics data
  const { data: adminAnalytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
    enabled: !!user,
  });

  // Fetch users data
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Handle signout
  const handleSignout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Hide mobile menu on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block md:flex-shrink-0 fixed md:relative z-50 md:z-auto w-64 h-full`}>
          <div className="flex flex-col w-64 h-full bg-gray-800">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
              <span className="text-white font-bold text-lg">SaaSPro Admin</span>
            </div>
            <div className="h-0 flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigationItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`${
                      activeItem === item.href
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveItem(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.icon}
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex justify-between">
              <div className="flex-1 flex">
                <div className="w-full flex md:ml-0">
                  <label htmlFor="search-field" className="sr-only">Search</label>
                  <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 ml-3" />
                    </div>
                    <Input
                      id="search-field"
                      className="block w-full h-full pl-10 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                      placeholder="Search"
                      type="search"
                    />
                  </div>
                </div>
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
                  <Bell className="h-6 w-6" />
                </Button>

                {/* Profile dropdown */}
                <div className="ml-3 relative">
                  <Button 
                    variant="ghost" 
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none"
                    onClick={handleSignout}
                  >
                    <img 
                      className="h-8 w-8 rounded-full" 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                      alt="Admin profile" 
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
              </div>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Welcome Message */}
                <div className="py-4">
                  <Card className="mb-6">
                    <CardContent className="pt-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-2">Welcome, Super Admin!</h2>
                      <p className="text-gray-600 mb-4">This dashboard provides complete control over your SaaSPro platform.</p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex">
                          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                            <Crown className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-900">Manage subscriptions</h3>
                            <p className="text-sm text-gray-500">View and modify user plans</p>
                          </div>
                        </div>
                        <div className="flex">
                          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-900">Control user access</h3>
                            <p className="text-sm text-gray-500">Manage roles and permissions</p>
                          </div>
                        </div>
                        <div className="flex">
                          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                            <Crown className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-900">Configure plans</h3>
                            <p className="text-sm text-gray-500">Define and update subscriptions</p>
                          </div>
                        </div>
                        <div className="flex">
                          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                            <BarChart2 className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-900">Monitor system health</h3>
                            <p className="text-sm text-gray-500">Track key metrics and activity</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Users
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {isLoadingAnalytics ? '...' : adminAnalytics?.totalUsers || 0}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <a href="#admin-users" className="font-medium text-primary hover:text-primary/80">
                          View all
                        </a>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Crown className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Active Subscriptions
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {isLoadingAnalytics ? '...' : adminAnalytics?.activeSubscriptions || 0}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <a href="#admin-subscriptions" className="font-medium text-primary hover:text-primary/80">
                          View all
                        </a>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <DollarSign className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Monthly Revenue
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                ${isLoadingAnalytics ? '...' : adminAnalytics?.monthlyRevenue || 0}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <a href="#admin-financials" className="font-medium text-primary hover:text-primary/80">
                          View report
                        </a>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UserPlus className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              New Users (This Week)
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {isLoadingAnalytics ? '...' : adminAnalytics?.newUsersThisWeek || 0}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <a href="#admin-analytics" className="font-medium text-primary hover:text-primary/80">
                          View analytics
                        </a>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* User Management Table */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                    <Button className="inline-flex items-center">
                      Add New User
                    </Button>
                  </div>
                  
                  <UserTable 
                    isLoading={isLoadingUsers} 
                    users={users || []} 
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
