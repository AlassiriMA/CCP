import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { SubscriptionPlan } from '@shared/schema';

interface PricingCardProps {
  plan: SubscriptionPlan;
  title: string;
  description: string;
  price: number;
  features: string[];
  ctaText: string;
  ctaLink: string;
  popular?: boolean;
  variant?: 'default' | 'dark';
}

export default function PricingCard({
  plan,
  title,
  description,
  price,
  features,
  ctaText,
  ctaLink,
  popular = false,
  variant = 'default'
}: PricingCardProps) {
  return (
    <div className={`
      ${popular ? 'transform md:scale-105' : ''} 
      ${variant === 'dark' ? 'border-gray-800' : 'border-gray-100'}
      ${popular ? 'relative border-2 border-primary shadow-lg' : 'border shadow-md'}
      bg-white rounded-lg overflow-hidden
    `}>
      {popular && (
        <div className="bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 text-center">
          Most Popular
        </div>
      )}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-4">{description}</p>
        <p className="text-4xl font-bold mb-6">
          ${price}
          <span className="text-lg font-normal text-gray-500">/mo</span>
        </p>
        
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          asChild
          className={`w-full ${
            variant === 'dark' 
              ? 'bg-gray-800 hover:bg-gray-900' 
              : popular 
                ? 'bg-primary hover:bg-primary/90' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
          variant={variant === 'dark' ? 'default' : popular ? 'default' : 'secondary'}
        >
          <Link to={ctaLink}>
            {ctaText}
          </Link>
        </Button>
      </div>
    </div>
  );
}
