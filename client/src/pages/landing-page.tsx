import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import FeatureCard from "@/components/landing/feature-card";
import TestimonialCard from "@/components/landing/testimonial-card";
import PricingCard from "@/components/landing/pricing-card";
import { SubscriptionPlan } from "@shared/schema";
import { ArrowRight, PlayCircle, CheckIcon } from "lucide-react";

// Feature data
const features = [
  {
    icon: "shield-check",
    title: "Role-Based Access Control",
    description: "Define precise permissions for every team member and ensure data security."
  },
  {
    icon: "layout-dashboard",
    title: "Intuitive Dashboard",
    description: "Get a clear overview of your projects, tasks, and performance metrics at a glance."
  },
  {
    icon: "users",
    title: "Team Collaboration",
    description: "Seamlessly work together, share resources, and communicate within your team."
  },
  {
    icon: "bar-chart-2",
    title: "Advanced Analytics",
    description: "Track performance metrics and gain insights to make data-driven decisions."
  },
  {
    icon: "rocket",
    title: "Fast Onboarding",
    description: "Get started quickly with role-specific welcome messages and tutorials."
  },
  {
    icon: "headphones",
    title: "Dedicated Support",
    description: "Access comprehensive documentation and get help when you need it."
  }
];

// Testimonial data
const testimonials = [
  {
    content: "SaaSPro transformed how we manage our projects. The intuitive interface and powerful features have significantly improved our team's productivity.",
    author: "Sarah Johnson",
    role: "Product Manager, TechCorp",
    rating: 5
  },
  {
    content: "The Enterprise plan has been a game-changer for us. The dedicated support and custom integrations make it the perfect solution for our company's needs.",
    author: "Michael Chen",
    role: "CTO, InnovateX",
    rating: 5
  },
  {
    content: "We started with the Free plan to test it out and quickly upgraded to Pro. The analytics capabilities alone are worth the investment, and the platform is incredibly user-friendly.",
    author: "Emily Rodriguez",
    role: "Marketing Director, GrowthLab",
    rating: 5
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="md:flex md:items-center md:space-x-16">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                SaaSPro: Elevate Your Productivity.
              </h1>
              <p className="text-xl md:text-2xl text-indigo-100 mb-8">
                The all-in-one platform to streamline your workflow with ease and efficiency.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  asChild 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white text-primary hover:bg-gray-100 shadow-lg"
                >
                  <Link to="/auth">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10"
                >
                  Watch Demo
                  <PlayCircle className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Dashboard Preview" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful features to boost your productivity
            </h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              Designed for teams of all sizes, our platform offers everything you need to manage your workflow efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                icon={feature.icon} 
                title={feature.title} 
                description={feature.description} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              Choose the plan that's right for you. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <PricingCard
              plan={SubscriptionPlan.FREE}
              title="Free"
              description="Get started with limited access"
              price={0}
              features={[
                "Core platform features",
                "Basic analytics",
                "Up to 3 projects",
                "Community support"
              ]}
              ctaText="Sign up for free"
              ctaLink="/auth"
              popular={false}
            />

            {/* Pro Plan */}
            <PricingCard
              plan={SubscriptionPlan.PRO}
              title="Pro"
              description="Unlock advanced tools"
              price={29}
              features={[
                "All Free features",
                "Advanced analytics",
                "Unlimited projects",
                "Priority email support",
                "API access"
              ]}
              ctaText="Start 14-day trial"
              ctaLink="/auth"
              popular={true}
            />

            {/* Enterprise Plan */}
            <PricingCard
              plan={SubscriptionPlan.ENTERPRISE}
              title="Enterprise"
              description="Tailored solutions for your business"
              price={99}
              features={[
                "All Pro features",
                "Advanced security",
                "Custom integrations",
                "Dedicated account manager",
                "24/7 priority support"
              ]}
              ctaText="Contact sales"
              ctaLink="/auth"
              popular={false}
              variant="dark"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by innovative teams
            </h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              See what our customers have to say about their experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                content={testimonial.content}
                author={testimonial.author}
                role={testimonial.role}
                rating={testimonial.rating}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to streamline your workflow?
              </h2>
              <p className="text-xl text-gray-300">
                Join thousands of satisfied users who have transformed their productivity.
              </p>
            </div>
            <div className="md:w-1/3">
              <Button 
                asChild 
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 py-6 text-lg"
              >
                <Link to="/auth">
                  Start Your Free Trial
                </Link>
              </Button>
              <p className="text-gray-400 text-center mt-3 text-sm">
                No credit card required. 14-day free trial.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
