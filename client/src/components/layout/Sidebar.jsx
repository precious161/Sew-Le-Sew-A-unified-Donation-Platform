import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthService from '../../services/AuthService';
import {
  LayoutDashboard, UserCircle, Heart, LogOut, ShieldAlert,
  Users, UserPlus, Activity, ClipboardCheck, Fingerprint,
  History, FileText, HeartPulse, Calendar, Brain, Zap, Wallet, Eye,
  PlusCircle, DollarSign, Send, Menu, X
} from 'lucide-react';

const Sidebar = ({ isDarkMode, isMobileOpen, onClose }) => {
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

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActive = (path) => location.pathname === path;

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

  const SidebarContent = () => (
    <>
      {/* BRAND LOGO */}
      <div className="flex items-center gap-3 mb-16 mt-4 px-2 cursor-pointer group" onClick={() => handleNavigation('/')}>
        <div className="bg-medical-red p-2.5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
          <Heart size={24} fill="white" className="text-white" />
        </div>
        <span className="text-2xl font-black tracking-tighter text-white uppercase italic antialiased">
          Sew<span className="font-light italic px-0.5 text-medical-red">le</span>Sew
        </span>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2 text-left">
        <NavItem
          icon={isAdmin ? <ShieldAlert size={18}/> : <LayoutDashboard size={18}/>}
          label={isAdmin ? 'Admin Portal' : 'Overview'}
          active={isActive('/admin') || isActive('/dashboard')}
          onClick={() => handleNavigation(isAdmin ? '/admin' : '/dashboard')}
        />

        {/* ADMIN: SYSTEM HUB */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">System Hub</div>
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">User Management</div>
            <NavItem icon={<Fingerprint size={18}/>} label="Identity Queue" active={isActive('/admin/identities')} onClick={() => handleNavigation('/admin/identities')} />
            <NavItem icon={<Users size={18}/>} label="Donor Registry" active={isActive('/admin/donors')} onClick={() => handleNavigation('/admin/donors')} />
            <NavItem icon={<UserPlus size={18}/>} label="Recipient Registry" active={isActive('/admin/recipients')} onClick={() => handleNavigation('/admin/recipients')} />
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Donation Management</div>
            <NavItem icon={<FileText size={18}/>} label="Request Queue" active={isActive('/admin/requests')} onClick={() => handleNavigation('/admin/requests')} />
            <NavItem icon={<HeartPulse size={18}/>} label="Intent Queue" active={isActive('/admin/intents')} onClick={() => handleNavigation('/admin/intents')} />
            <NavItem icon={<Zap size={18}/>} label="Matching Engine" active={isActive('/admin/matches')} onClick={() => handleNavigation('/admin/matches')} />
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Financial Management</div>
            <NavItem icon={<DollarSign size={18}/>} label="Contributions" active={isActive('/admin/financial-contributions')} onClick={() => handleNavigation('/admin/financial-contributions')} />
            <NavItem icon={<Send size={18}/>} label="Distribution" active={isActive('/admin/financial-distribution')} onClick={() => handleNavigation('/admin/financial-distribution')} />
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Event Management</div>
            <NavItem icon={<Calendar size={18}/>} label="Manage Drives" active={isActive('/admin/events')} onClick={() => handleNavigation('/admin/events')} />
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">AI Analytics and Report</div>
            <NavItem icon={<Brain size={18}/>} label="AI Analytics" active={isActive('/admin/analytics')} onClick={() => handleNavigation('/admin/analytics')} />
          </>
        )}

        {/* RECIPIENT: PATIENT SERVICES */}
        {isRecipient && (
          <>
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Patient Services</div>
            <NavItem
              icon={<Activity size={18}/>}
              label="Medical Profile"
              active={isActive('/donations/recipient/health-info')}
              onClick={() => handleNavigation('/donations/recipient/health-info')}
            />
            <NavItem
              icon={<PlusCircle size={18}/>}
              label="New Support Request"
              active={isActive('/donations/recipient/request')}
              onClick={() => handleNavigation('/donations/recipient/request')}
            />
            <NavItem
              icon={<History size={18}/>}
              label="My Requests"
              active={isActive('/recipient/my-requests')}
              onClick={() => handleNavigation('/recipient/my-requests')}
            />
          </>
        )}

        {/* DONOR: CONTRIBUTION HUB */}
        {isDonor && (
          <>
            <div className="pt-4 pb-2 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Donation Hub</div>
            <NavItem icon={<ClipboardCheck size={18}/>} label="Eligibility Quiz" active={isActive('/donations/donor/check')} onClick={() => handleNavigation('/donations/donor/check')} />
            <NavItem icon={<HeartPulse size={18}/>} label="Register Intent" active={isActive('/donations/donor/register-intent')} onClick={() => handleNavigation('/donations/donor/register-intent')} />
            <NavItem icon={<Eye size={18}/>} label="My Intents" active={isActive('/donations/donor/my-intents')} onClick={() => handleNavigation('/donations/donor/my-intents')} />
            <NavItem icon={<Wallet size={18}/>} label="Financial Contribution" active={isActive('/donations/donor/financial')} onClick={() => handleNavigation('/donations/donor/financial')} />
            <NavItem icon={<Calendar size={18}/>} label="Upcoming Drives" active={isActive('/donations/donor/events')} onClick={() => handleNavigation('/donations/donor/events')} />
            <NavItem icon={<History size={18}/>} label="Donation History" active={isActive('/donations/donor/history')} onClick={() => handleNavigation('/donations/donor/history')} />
          </>
        )}

        <div className="pt-4 border-t border-white/5 mt-4 text-left"></div>
        <NavItem icon={<UserCircle size={18}/>} label="My Profile" active={isActive('/profile')} onClick={() => handleNavigation('/profile')} />
      </nav>

      {/* USER STATUS CARD */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-4 mb-6 p-2 text-white text-left">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg transition-all ${
            isAdmin ? 'bg-[#FFB800] text-[#111C44]' : (isRecipient ? 'bg-blue-600 shadow-blue-500/20' : 'bg-medical-red shadow-red-900/40')
          }`}>
            {user?.FirstName?.[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-black truncate leading-tight uppercase tracking-tighter">{user?.FirstName}</p>
            <p className={`text-[8px] font-black tracking-widest mt-1 uppercase ${isRecipient ? 'text-blue-400' : 'text-[#05CD99]'}`}>
                {isAdmin ? 'SYSTEM ADMIN' : user?.Role}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 text-white/30 hover:text-medical-red transition-all font-black text-xs uppercase tracking-widest text-left">
          <LogOut size={18} /><span>Secure Logout</span>
        </button>
      </div>
    </>
  );

  // For mobile: render as overlay with backdrop
  if (isMobileOpen !== undefined) {
    return (
      <>
        {isMobileOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
            <div className={`absolute left-0 top-0 w-72 h-screen flex flex-col p-6 shadow-2xl transition-all duration-300 ${
              isDarkMode ? 'bg-[#0b1121]' : 'bg-[#111C44]'
            }`}>
              <div className="flex justify-end mb-4">
                <button onClick={onClose} className="text-white/50 hover:text-white p-2">
                  <X size={24} />
                </button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}
      </>
    );
  }

  // For desktop: render as fixed sidebar
  return (
    <div className={`hidden md:flex w-72 h-screen flex-col p-6 fixed left-0 top-0 z-50 shadow-2xl transition-colors duration-500 ${
      isDarkMode ? 'bg-[#0b1121] border-r border-white/5' : 'bg-[#111C44]'
    }`}>
      <SidebarContent />
    </div>
  );
};

export default Sidebar;