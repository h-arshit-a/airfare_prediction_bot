import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { AuthModal } from './AuthModal';
import { useToast } from '@/components/ui/use-toast';

export const UserMenu: React.FC = () => {
  const { user, signOut, loading: isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toast } = useToast();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  
  const handleSignOut = async () => {
    closeMenu();
    await signOut();
    
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account",
      duration: 3000,
    });
  };

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
    closeMenu();
  };

  if (isLoading) {
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {user ? (
          <button
            onClick={toggleMenu}
            className="flex items-center space-x-2 focus:outline-none"
            aria-label="User menu"
            aria-expanded={isMenuOpen}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
              {user.email?.[0].toUpperCase() || '?'}
            </div>
            <span className="hidden md:inline text-sm font-medium">
              {user.email?.split('@')[0] || 'User'}
            </span>
          </button>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Sign In
          </button>
        )}

        {isMenuOpen && user && (
          <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-xl z-10 dark:bg-gray-800">
            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
              Signed in as <br />
              <span className="font-medium">{user.email}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}; 