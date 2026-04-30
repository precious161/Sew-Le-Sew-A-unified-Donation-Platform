import React from 'react';
import { LayoutDashboard, UserCircle, Heart, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthService from '../../services/AuthService';

const Sidebar = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const handleLogout = async () => {
    setUser(null);
    await AuthService.logout();
  };

  return (
    <div className={`w-72 h-screen flex flex-col p-6 fixed left-0 top-0 z-50 shadow-2xl transition-colors duration-500 ${
      isDarkMode ? 'bg-[#0b1121] border-r border-white/5' : 'bg-[#111C44]'
    }`}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-16 mt-4 px-2">
        <div className="bg-medical-red p-2.5 rounded-2xl shadow-lg shadow-red-900/40">
          <Heart size={24} fill="white" className="text-white" />
        </div>
        <span className="text-2xl font-black tracking-tighter uppercase italic text-white">Sew Le Sew</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-3">
        <button
          onClick={() => navigate('/dashboard')}
          className={`w-full flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all font-bold text-xs uppercase tracking-widest ${
            location.pathname === '/dashboard' 
            ? 'bg-medical-red text-white shadow-xl shadow-red-900/40' 
            : 'text-white/40 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18}/> Dashboard
        </button>
        <button
          onClick={() => navigate('/profile')}
          className={`w-full flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all font-bold text-xs uppercase tracking-widest ${
            location.pathname === '/profile' 
            ? 'bg-medical-red text-white shadow-xl shadow-red-900/40' 
            : 'text-white/40 hover:bg-white/5 hover:text-white'
          }`}
        >
          <UserCircle size={18}/> My Profile
        </button>
      </nav>

      {/* Bottom Profile Area */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-4 mb-6 p-2">
          <div className="w-12 h-12 rounded-2xl bg-[#FFB800] flex items-center justify-center font-black text-[#111C44] border-2 border-white/10 shadow-lg">
            {user?.FirstName?.[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-black uppercase truncate text-white leading-tight">{user?.FirstName}</p>
            <p className="text-[9px] text-[#05CD99] font-black uppercase tracking-[0.2em] mt-1">
                {user?.Role}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-white/30 hover:text-medical-red hover:bg-red-500/5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;