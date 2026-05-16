import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthService from '../../services/AuthService';
import {
  LayoutDashboard, UserCircle, Heart, LogOut, ShieldAlert,
  Users, UserPlus, Activity, ClipboardCheck, Fingerprint
} from 'lucide-react';

const Sidebar = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const isAdmin = user?.Role === 'Red_Cross_Admin';
  const isDonor = user?.Role === 'Donor';
  const isRecipient = user?.Role === 'Recipient';

  const handleLogout = async () => {
    setUser(null);
    await AuthService.logout();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`w-72 h-screen flex flex-col p-6 fixed left-0 top-0 z-50 shadow-2xl transition-colors duration-500 ${
      isDarkMode ? 'bg-[#0b1121] border-r border-white/5' : 'bg-[#111C44]'
    }`}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-16 mt-4 px-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="bg-medical-red p-2.5 rounded-2xl shadow-lg">
          <Heart size={24} fill="white" className="text-white" />
        </div>
        <span className="text-2xl font-black tracking-tighter text-white uppercase italic antialiased">
          Sew<span className="font-light italic px-0.5 text-medical-red">le</span>Sew
        </span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2 text-left">
        <NavItem
          icon={isAdmin ? <ShieldAlert size={18}/> : <LayoutDashboard size={18}/>}
          label={isAdmin ? 'Admin Portal' : 'Overview'}
          active={isActive('/admin') || isActive('/dashboard')}
          onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
        />

        {/* ADMIN REGISTRY */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Registry</div>
            <NavItem icon={<Fingerprint size={18}/>} label="ID Queue" active={isActive('/admin/identities')} onClick={() => navigate('/admin/identities')} />
            <NavItem icon={<Users size={18}/>} label="Donors" active={isActive('/admin/donors')} onClick={() => navigate('/admin/donors')} />
            <NavItem icon={<UserPlus size={18}/>} label="Recipients" active={isActive('/admin/recipients')} onClick={() => navigate('/admin/recipients')} />
          </>
        )}

        {/* RECIPIENT FLOW */}
        {isRecipient && (
          <>
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Patient Services</div>
            <NavItem
                icon={<Activity size={18}/>}
                label="Medical Profile"
                active={isActive('/donations/recipient/health-info')}
                onClick={() => navigate('/donations/recipient/health-info')}
            />
          </>
        )}

        {/* DONOR FLOW */}
        {isDonor && (
          <>
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Vetting Hub</div>
            <NavItem
              icon={<ClipboardCheck size={18}/>}
              label="Eligibility Quiz"
              active={isActive('/donations/donor/check')}
              onClick={() => navigate('/donations/donor/check')}
            />
          </>
        )}

        {/* Removed redundant "Verify Identity" block here */}

        <div className="pt-4 border-t border-white/5 mt-4"></div>
        <NavItem icon={<UserCircle size={18}/>} label="My Profile" active={isActive('/profile')} onClick={() => navigate('/profile')} />
      </nav>

      {/* User Card */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-4 mb-6 p-2 text-white text-left">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isAdmin ? 'bg-[#FFB800] text-[#111C44]' : (isRecipient ? 'bg-blue-600' : 'bg-medical-red')}`}>
            {user?.FirstName?.[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-black truncate leading-tight uppercase tracking-tighter">{user?.FirstName}</p>
            <p className={`text-[8px] font-black tracking-widest mt-1 text-[#05CD99] uppercase`}>
                {user?.Role?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 text-white/30 hover:text-medical-red transition-all font-black text-xs uppercase tracking-widest text-left">
          <LogOut size={18} /><span>Secure Logout</span>
        </button>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all font-bold text-xs tracking-widest text-left ${
      active
      ? 'bg-medical-red text-white shadow-xl shadow-red-900/40 translate-x-2'
      : 'text-white/40 hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon} {label}
  </button>
);

export default Sidebar;