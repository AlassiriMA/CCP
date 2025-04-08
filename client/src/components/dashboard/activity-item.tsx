import React from 'react';

interface ActivityItemProps {
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  time: string;
}

export default function ActivityItem({ user, action, time }: ActivityItemProps) {
  return (
    <li className="px-6 py-4">
      <div className="flex space-x-3">
        <img 
          className="h-8 w-8 rounded-full" 
          src={user.avatar} 
          alt={`${user.name} avatar`} 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
          }}
        />
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
            <p className="text-sm text-gray-500">{time}</p>
          </div>
          <p className="text-sm text-gray-500 truncate">{action}</p>
        </div>
      </div>
    </li>
  );
}
