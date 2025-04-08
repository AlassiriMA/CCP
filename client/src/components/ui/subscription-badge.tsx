import { SubscriptionPlan } from "@shared/schema";
import { cn } from "@/lib/utils";

interface SubscriptionBadgeProps {
  plan: SubscriptionPlan;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SubscriptionBadge({ 
  plan, 
  size = "md", 
  className 
}: SubscriptionBadgeProps) {
  const getColorsByPlan = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return "bg-gray-100 text-gray-800";
      case SubscriptionPlan.PRO:
        return "bg-green-100 text-green-800";
      case SubscriptionPlan.ENTERPRISE:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "md":
        return "px-2.5 py-1 text-xs";
      case "lg":
        return "px-3 py-1.5 text-sm";
      default:
        return "px-2.5 py-1 text-xs";
    }
  };

  const formatPlanName = (plan: SubscriptionPlan) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1) + " Plan";
  };

  return (
    <span 
      className={cn(
        "rounded-full font-medium", 
        getColorsByPlan(plan),
        getSizeClasses(size),
        className
      )}
    >
      {formatPlanName(plan)}
    </span>
  );
}
