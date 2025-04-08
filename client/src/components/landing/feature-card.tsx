import React from 'react';
import { 
  ShieldCheck, LayoutDashboard, Users, BarChart2, Rocket, Headphones, 
  LucideIcon 
} from 'lucide-react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

// Map of icon names to Lucide components
const iconMap: Record<string, React.ReactNode> = {
  'shield-check': <ShieldCheck className="h-6 w-6" />,
  'layout-dashboard': <LayoutDashboard className="h-6 w-6" />,
  'users': <Users className="h-6 w-6" />,
  'bar-chart-2': <BarChart2 className="h-6 w-6" />,
  'rocket': <Rocket className="h-6 w-6" />,
  'headphones': <Headphones className="h-6 w-6" />,
};

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 hover:shadow-md transition">
      <div className="text-primary mb-4">
        {iconMap[icon] || <div className="h-6 w-6" />}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">
        {description}
      </p>
    </div>
  );
}
