import React from 'react';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  content: string;
  author: string;
  role: string;
  rating: number;
}

export default function TestimonialCard({ content, author, role, rating }: TestimonialCardProps) {
  // Generate stars based on rating
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i < rating ? 'text-primary fill-primary' : 'text-gray-300'}`}
    />
  ));

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
      <div className="flex items-center mb-4">
        <div className="text-primary flex">
          {stars}
        </div>
      </div>
      <p className="text-gray-600 mb-6">
        "{content}"
      </p>
      <div className="flex items-center">
        <img 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=random`} 
          alt={author} 
          className="w-10 h-10 rounded-full mr-3" 
        />
        <div>
          <h4 className="font-medium text-gray-900">{author}</h4>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  );
}
