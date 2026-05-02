import React from 'react';
import { LayoutDashboard, UserCircle, Heart, LogOut, ShieldAlert } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthService from '../../services/AuthService';

const Sidebar = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  
  const isAdmin = user?.Role === 'Red_Cross_Admin';

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
        <span className="text-2xl font-black tracking-tighter  text-white leading-none">
          Sew Le Sew
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-3">
        {/*  Admin Panel*/}
        <button
          onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
          className={`w-full flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all font-bold text-xs  tracking-widest ${
            (location.pathname === '/dashboard' || location.pathname === '/admin')
            ? 'bg-medical-red text-white shadow-xl shadow-red-900/40' 
            : 'text-white/40 hover:bg-white/5 hover:text-white'
          }`}
        >
          {isAdmin ? <ShieldAlert size={18}/> : <LayoutDashboard size={18}/>}
          {isAdmin ? 'Admin Panel' : 'Dashboard'}
        </button>

        <button
          onClick={() => navigate('/profile')}
          className={`w-full flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all font-bold text-xs tracking-widest ${
            location.pathname === '/profile' 
            ? 'bg-medical-red text-white shadow-xl' 
            : 'text-white/40 hover:bg-white/5 hover:text-white'
          }`}
        >
          <UserCircle size={18}/> Profile
        </button>
      </nav>

      {/* Bottom Profile Area  */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-4 mb-6 p-2">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 border-white/10 shadow-lg ${isAdmin ? 'bg-[#FFB800] text-[#111C44]' : 'bg-medical-red text-white'}`}>
            {user?.FirstName?.[0]}
          </div>
          <div className="overflow-hidden text-left">
            <p className="text-sm font-black  truncate text-white leading-tight">
              {user?.FirstName}
            </p>
            <p className={`text-[9px] font-black  tracking-[0.15em] mt-1 ${isAdmin ? 'text-red-400' : 'text-[#05CD99]'}`}>
                {isAdmin ? 'ADMINISTRATOR' : user?.Role}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-white/30 hover:text-medical-red transition-all font-black text-xs uppercase tracking-widest"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;