import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SubscriptionPlan, UserRole, User } from '@shared/schema';
import { 
  LayoutDashboard, 
  FolderKanban, 
  BarChart2 
} from 'lucide-react';

interface WelcomeMessageProps {
  user: User;
}

export default function WelcomeMessage({ user }: WelcomeMessageProps) {
  const getPlanSpecificMessage = () => {
    switch (user.plan) {
      case SubscriptionPlan.FREE:
        return {
          title: "Welcome to SaaSPro! You're on the Free plan.",
          description: "Here's how to get started with the basics:",
          features: [
            {
              icon: <LayoutDashboard className="text-xl" />,
              title: "Dashboard Overview",
              description: "Get a basic overview of your activities"
            },
            {
              icon: <FolderKanban className="text-xl" />,
              title: "Project Management",
              description: "Create and manage up to 3 projects"
            },
            {
              icon: <BarChart2 className="text-xl" />,
              title: "Basic Analytics",
              description: "Access simple analytics and reports"
            }
          ],
          cta: "Upgrade to Pro for full access"
        };
      case SubscriptionPlan.PRO:
        return {
          title: "Welcome to SaaSPro! You're on the Pro plan.",
          description: "Here's how to maximize your experience:",
          features: [
            {
              icon: <LayoutDashboard className="text-xl" />,
              title: "Dashboard Overview",
              description: "Get insights into your activities and performance"
            },
            {
              icon: <FolderKanban className="text-xl" />,
              title: "Project Management",
              description: "Create and manage unlimited projects"
            },
            {
              icon: <BarChart2 className="text-xl" />,
              title: "Advanced Analytics",
              description: "Access detailed data and generate reports"
            }
          ],
          cta: "Access Pro tutorials"
        };
      case SubscriptionPlan.ENTERPRISE:
        return {
          title: "Welcome to SaaSPro! You're on the Enterprise plan.",
          description: "Here's how to make the most of your premium access:",
          features: [
            {
              icon: <LayoutDashboard className="text-xl" />,
              title: "Custom Dashboard",
              description: "Personalized dashboard with all metrics"
            },
            {
              icon: <FolderKanban className="text-xl" />,
              title: "Enterprise Project Suite",
              description: "Advanced project management with custom workflows"
            },
            {
              icon: <BarChart2 className="text-xl" />,
              title: "Premium Analytics",
              description: "Real-time data and custom reporting"
            }
          ],
          cta: "Contact your dedicated account manager"
        };
      default:
        return {
          title: "Welcome to SaaSPro!",
          description: "Get started with your workspace:",
          features: [],
          cta: ""
        };
    }
  };

  const message = getPlanSpecificMessage();

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">{message.title}</h2>
        <p className="text-gray-600 mb-4">{message.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {message.features.map((feature, index) => (
            <div className="flex" key={index}>
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        {message.cta && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a href="#" className="text-primary hover:text-primary/80 font-medium">{message.cta}</a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
