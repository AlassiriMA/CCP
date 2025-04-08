import React from 'react';
import { LayoutDashboard, BarChart2, Users, Settings } from 'lucide-react';

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
}

const navigationItems = [
  { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
  { id: 'analytics', name: 'Analytics', icon: <BarChart2 className="mr-3 h-5 w-5" /> },
  { id: 'team', name: 'Team', icon: <Users className="mr-3 h-5 w-5" /> },
  { id: 'settings', name: 'Settings', icon: <Settings className="mr-3 h-5 w-5" /> },
];

export default function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <span className="text-white font-bold text-xl">SaaSPro</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigationItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`
                    ${activeItem === item.id ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} 
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    onItemClick(item.id);
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
    </div>
  );
}
