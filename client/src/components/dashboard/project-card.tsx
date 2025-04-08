import React from 'react';
import { Folder, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectCardProps {
  name: string;
  updatedAt: string;
  status: string;
}

export default function ProjectCard({ name, updatedAt, status }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <li className="px-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="bg-primary/10 h-10 w-10 rounded-md flex items-center justify-center text-primary">
          <Folder className="h-5 w-5" />
        </div>
        <div className="ml-4">
          <h4 className="text-sm font-medium text-gray-900">{name}</h4>
          <p className="text-sm text-gray-500">Last updated {updatedAt}</p>
        </div>
      </div>
      <div className="flex items-center">
        <span className={`${getStatusColor(status)} text-xs px-2 py-1 rounded-full mr-4`}>
          {status}
        </span>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </li>
  );
}
