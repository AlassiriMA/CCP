import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: string;
  previousValue?: string;
  status?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export default function StatsCard({
  title,
  value,
  change,
  previousValue,
  status,
  changeType = 'neutral'
}: StatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-primary/10 text-primary/80';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          {(change || status) && (
            <span className={`text-xs px-2 py-1 rounded-full ${getChangeColor()}`}>
              {change || status}
            </span>
          )}
        </div>
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {previousValue && <p className="ml-2 text-sm text-gray-500">{previousValue}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
