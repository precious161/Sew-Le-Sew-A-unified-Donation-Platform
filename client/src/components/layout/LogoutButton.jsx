import React from 'react';
import { ArrowRight } from 'lucide-react'; 
import AuthService from '../../services/AuthService';
import { useAuth } from '../../hooks/useAuth';

const LogoutButton = () => {
  const { setUser } = useAuth();

  const handleLogout = async () => {
    setUser(null);
    await AuthService.logout();
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-3 px-6 py-3 text-lg font-bold text-gray-800 hover:text-medical-red bg-white border-2 border-gray-100 hover:border-medical-red rounded-2xl shadow-sm transition-all duration-300 group"
    >
      <span>Logout</span>
      {/* Making the arrow Medical Red so it is impossible to miss */}
      <ArrowRight 
        size={24} 
        strokeWidth={3}
        className="text-medical-red group-hover:translate-x-2 transition-transform duration-300" 
      />
    </button>
  );
};

export default LogoutButton;