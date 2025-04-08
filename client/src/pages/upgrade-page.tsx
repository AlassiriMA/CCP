import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { SubscriptionPlan } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  X, 
  Loader2, 
  Shield, 
  Rocket, 
  Building2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the pricing plans
interface PricingPlan {
  id: SubscriptionPlan;
  title: string;
  price: { monthly: number; annual: number };
  description: string;
  features: Array<{ text: string; included: boolean }>;
  icon: React.ReactNode;
  popular?: boolean;
  buttonText: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: SubscriptionPlan.FREE,
    title: "Free",
    price: { monthly: 0, annual: 0 },
    description: "Get started with basic features",
    icon: <Shield className="h-8 w-8 text-blue-400" />,
    features: [
      { text: "Up to 3 projects", included: true },
      { text: "Basic project management", included: true },
      { text: "Limited collaborators (2 per project)", included: true },
      { text: "Basic analytics", included: true },
      { text: "Community support", included: true },
      { text: "Advanced collaboration tools", included: false },
      { text: "Custom fields", included: false },
      { text: "Priority support", included: false },
      { text: "Advanced analytics", included: false },
    ],
    buttonText: "Current Plan",
  },
  {
    id: SubscriptionPlan.PRO,
    title: "Pro",
    price: { monthly: 29, annual: 290 },
    description: "Unlock advanced features and more capacity",
    icon: <Rocket className="h-8 w-8 text-indigo-500" />,
    features: [
      { text: "Up to 15 projects", included: true },
      { text: "Advanced project management", included: true },
      { text: "Unlimited collaborators", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Email & chat support", included: true },
      { text: "Custom fields & tags", included: true },
      { text: "Project templates", included: true },
      { text: "API access", included: true },
      { text: "Dedicated account manager", included: false },
    ],
    popular: true,
    buttonText: "Upgrade to Pro",
  },
  {
    id: SubscriptionPlan.ENTERPRISE,
    title: "Enterprise",
    price: { monthly: 99, annual: 990 },
    description: "Tailored solutions for your business",
    icon: <Building2 className="h-8 w-8 text-purple-500" />,
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Advanced project management", included: true },
      { text: "Unlimited collaborators", included: true },
      { text: "Advanced analytics & reporting", included: true },
      { text: "24/7 priority support", included: true },
      { text: "Custom fields & workflows", included: true },
      { text: "Project templates", included: true },
      { text: "API access", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "SSO & advanced security", included: true },
    ],
    buttonText: "Contact Sales",
  },
];

export default function UpgradePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Mutation for updating user's subscription plan
  const upgradePlanMutation = useMutation({
    mutationFn: async (planId: SubscriptionPlan) => {
      // In a real app, this would make a request to the Stripe API first
      // to create a checkout session, then redirect the user to the Stripe checkout page
      // For now, we'll simulate a successful upgrade by updating the user's plan directly
      return await apiRequest("POST", "/api/users/upgrade-plan", { plan: planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Subscription updated",
        description: `Your subscription has been updated to ${selectedPlan?.toLowerCase()}.`,
      });
      setShowModal(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating subscription",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (plan: SubscriptionPlan) => {
    // For Enterprise plan, we'd typically redirect to a contact form
    if (plan === SubscriptionPlan.ENTERPRISE) {
      window.location.href = "/contact-sales";
      return;
    }

    // Don't allow "downgrading" to the free plan
    if (plan === SubscriptionPlan.FREE && user?.plan !== SubscriptionPlan.FREE) {
      toast({
        title: "Cannot downgrade",
        description: "Please contact customer support to downgrade your subscription.",
        variant: "destructive",
      });
      return;
    }

    // Don't do anything if it's the current plan
    if (plan === user?.plan) {
      return;
    }

    setSelectedPlan(plan);
    setShowModal(true);
    
    // In a real app, here we would redirect to Stripe Checkout
    // For now, we'll just simulate the upgrade
    upgradePlanMutation.mutate(plan);
  };

  const getSavingsPercentage = () => {
    // Calculate the percentage savings for annual billing
    return 17; // Roughly the savings for paying annually vs monthly
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Upgrade Your Subscription</h1>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto">
          Choose the plan that's right for you and take your productivity to the next level.
        </p>
        
        <div className="mt-6">
          <Tabs 
            value={billingPeriod} 
            onValueChange={(value) => setBillingPeriod(value as "monthly" | "annual")}
            className="inline-flex"
          >
            <TabsList className="grid w-60 grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">
                Annual
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-800">
                  Save {getSavingsPercentage()}%
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pricingPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 -mt-2 -mr-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-white">
                  Popular
                </span>
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <CardDescription className="mt-1">{plan.description}</CardDescription>
                </div>
                <div>{plan.icon}</div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">
                  ${plan.price[billingPeriod]}
                </span>
                <span className="text-gray-500 ml-1">
                  {billingPeriod === "monthly" ? "/month" : "/year"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 mt-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mr-2 shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={`w-full ${plan.id === user?.plan ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : plan.popular ? 'bg-primary' : ''}`}
                variant={plan.id === user?.plan ? "outline" : "default"}
                disabled={plan.id === user?.plan || upgradePlanMutation.isPending}
                onClick={() => handleUpgrade(plan.id)}
              >
                {upgradePlanMutation.isPending && plan.id === selectedPlan && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {plan.id === user?.plan ? "Current Plan" : plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-10 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Can I change my plan later?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade your plan at any time. If you need to downgrade, please contact our support team.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">How does billing work?</h3>
            <p className="text-gray-600">
              You'll be charged at the beginning of each billing cycle. You can choose between monthly or annual billing.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Is there a free trial?</h3>
            <p className="text-gray-600">
              Yes, all plans come with a 14-day free trial so you can try out all the features before committing.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">
              We accept all major credit cards and PayPal. For Enterprise customers, we also offer invoice-based payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}