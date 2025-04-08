import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <span className="text-primary font-bold text-2xl cursor-pointer">SaaSPro</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a 
                href="#features" 
                className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Pricing
              </a>
              <a 
                href="#testimonials" 
                className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Testimonials
              </a>
              <a 
                href="#" 
                className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Documentation
              </a>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex space-x-4">
              <Button asChild variant="ghost">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              aria-controls="mobile-menu" 
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-6 w-6 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <a href="#features" className="text-primary hover:bg-primary/5 block px-3 py-2 rounded-md text-base font-medium">Features</a>
            <a href="#pricing" className="text-gray-600 hover:bg-gray-50 hover:text-primary block px-3 py-2 rounded-md text-base font-medium">Pricing</a>
            <a href="#testimonials" className="text-gray-600 hover:bg-gray-50 hover:text-primary block px-3 py-2 rounded-md text-base font-medium">Testimonials</a>
            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-primary block px-3 py-2 rounded-md text-base font-medium">Documentation</a>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <Link to="/auth" className="text-gray-600 hover:bg-gray-50 hover:text-primary block px-3 py-2 rounded-md text-base font-medium">Sign in</Link>
              <Link to="/auth" className="bg-primary text-white block px-3 py-2 rounded-md text-base font-medium mt-1">Start Free Trial</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
