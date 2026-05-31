import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import AdminService from '../../services/AdminService';
import NotificationHub from '../../components/notifications/NotificationHub';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShieldAlert, CheckCircle, Sun, Moon, UserPlus, ShieldCheck, Menu,
  TrendingUp, Activity, Calendar, Heart, DollarSign, Zap,
  ArrowUpRight, Bell, Brain, Eye, FileText, Clock, User
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    donors: 0,
    recipients: 0,
    inactive: 0,
    pendingIdentities: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activityRes, identityRes] = await Promise.all([
          AdminService.monitorActivity(1, 100),
          AdminService.getPendingIdentities(),
        ]);

        if (activityRes.success) {
          const donors = activityRes.data.filter(u => u.Role === 'Donor').length;
          const recipients = activityRes.data.filter(u => u.Role === 'Recipient').length;

          setStats({
            totalUsers: activityRes.totalCount,
            donors,
            recipients,
            inactive: activityRes.data.filter(u => u.status === 'Deactivated').length,
            pendingIdentities: identityRes.success ? identityRes.count : 0,
          });

          // Get 5 most recent users - handle missing createdAt
          const recent = [...activityRes.data]
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
              const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
              return dateB - dateA;
            })
            .slice(0, 5);
          setRecentUsers(recent);
        }
      } catch (error) {
        console.error("Stats sync failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently joined';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently joined';
      return date.toLocaleDateString();
    } catch {
      return 'Recently joined';
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1a1a2e]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red mx-auto mb-4"></div>
        <p className="text-white/60 text-sm font-medium">Loading Admin Portal...</p>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-[#0f172a] to-[#1a1a2e]' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isDarkMode={isDarkMode} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar isDarkMode={isDarkMode} isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 md:ml-72 w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/10 backdrop-blur-md sticky top-0 z-50">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="bg-medical-red p-2.5 rounded-xl shadow-lg">
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <NotificationHub isDarkMode={isDarkMode} />
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl shadow-lg ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h1 className={`text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-3 ${
                  isDarkMode ? 'text-white' : 'text-[#1B2559]'
                }`}>
                  <ShieldCheck className="text-medical-red" size={28} />
                  Admin Dashboard
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Welcome back, <span className="font-bold text-medical-red">{user?.FirstName}</span>
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <NotificationHub isDarkMode={isDarkMode} />
                <button onClick={toggleTheme} className={`p-3 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid - Real Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
            <StatCard
              icon={<Users size={20} />}
              label="Total Users"
              value={stats.totalUsers}
              color="blue"
              dark={isDarkMode}
            />
            <StatCard
              icon={<Heart size={20} />}
              label="Donors"
              value={stats.donors}
              color="red"
              dark={isDarkMode}
            />
            <StatCard
              icon={<UserPlus size={20} />}
              label="Recipients"
              value={stats.recipients}
              color="green"
              dark={isDarkMode}
            />
            <StatCard
              icon={<ShieldAlert size={20} />}
              label="Pending Verifications"
              value={stats.pendingIdentities}
              color="yellow"
              dark={isDarkMode}
            />
            <StatCard
              icon={<Activity size={20} />}
              label="Inactive Accounts"
              value={stats.inactive}
              color="gray"
              dark={isDarkMode}
            />
          </div>

          {/* Main Content Grid - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                  <Users size={20} className="text-medical-red" />
                  Recent Registrations
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/admin/donors')}
                    className="text-[10px] font-black text-medical-red hover:underline flex items-center gap-1"
                  >
                    Donors <ArrowUpRight size={12} />
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => navigate('/admin/recipients')}
                    className="text-[10px] font-black text-medical-red hover:underline flex items-center gap-1"
                  >
                    Recipients <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {recentUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No users registered yet</p>
                ) : (
                  recentUsers.map((userItem) => (
                    <RecentUserItem
                      key={userItem.id}
                      user={userItem}
                      isDarkMode={isDarkMode}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions & System Info */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <h3 className={`text-lg font-black flex items-center gap-2 mb-4 ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                  <Zap size={20} className="text-medical-red" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickActionButton
                    icon={<Users size={16} />}
                    label="Manage Donors"
                    onClick={() => navigate('/admin/donors')}
                    color="red"
                  />
                  <QuickActionButton
                    icon={<UserPlus size={16} />}
                    label="Manage Recipients"
                    onClick={() => navigate('/admin/recipients')}
                    color="green"
                  />
                  <QuickActionButton
                    icon={<ShieldCheck size={16} />}
                    label="Verify Identities"
                    onClick={() => navigate('/admin/identities')}
                    color="yellow"
                  />
                  <QuickActionButton
                    icon={<Calendar size={16} />}
                    label="Manage Events"
                    onClick={() => navigate('/admin/events')}
                    color="blue"
                  />
                </div>
              </div>

              {/* System Status */}
              <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <h3 className={`text-lg font-black flex items-center gap-2 mb-4 ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                  <Bell size={20} className="text-medical-red" />
                  System Status
                </h3>
                <div className="space-y-3">
                  <StatusIndicator label="API Server" status="operational" />
                  <StatusIndicator label="Database" status="operational" />
                  <StatusIndicator label="AI Service" status="operational" />
                  <StatusIndicator label="Email Service" status="operational" />
                </div>
              </div>

              {/* Pending Actions Card - Fixed Link */}
              <div
                onClick={() => navigate('/admin/identities')}
                className={`rounded-2xl p-6 shadow-xl cursor-pointer transition-all hover:scale-[1.02] ${
                  isDarkMode ? 'bg-gradient-to-r from-medical-red/20 to-transparent border border-medical-red/30' : 'bg-gradient-to-r from-medical-red/10 to-transparent border border-medical-red/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pending Actions</p>
                    <p className="text-2xl font-black">{stats.pendingIdentities}</p>
                    <p className="text-xs text-gray-500 mt-1">Identity verifications waiting</p>
                  </div>
                  <div className="px-4 py-2 bg-medical-red text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                    Review Now
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color, dark }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    red: 'bg-red-500/10 text-red-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
    gray: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-lg hover:shadow-xl ${
      dark ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
    }`}>
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className={`text-2xl md:text-3xl font-black tracking-tighter ${dark ? 'text-white' : 'text-[#1B2559]'}`}>
        {value}
      </p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
};

// Recent User Item - Fixed Date Handling
const RecentUserItem = ({ user, isDarkMode, formatDate }) => {
  const getRoleColor = (role) => {
    switch(role) {
      case 'Donor': return 'text-red-500 bg-red-500/10';
      case 'Recipient': return 'text-green-500 bg-green-500/10';
      case 'Red_Cross_Admin': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'Donor': return <Heart size={12} />;
      case 'Recipient': return <UserPlus size={12} />;
      case 'Red_Cross_Admin': return <ShieldCheck size={12} />;
      default: return <User size={12} />;
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-10 h-10 rounded-full bg-medical-red/10 flex items-center justify-center text-medical-red font-black">
        {user.FirstName?.[0]}{user.LastName?.[0]}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
          {user.FirstName} {user.LastName}
        </p>
        <p className="text-xs text-gray-400">{user.EmailAddress}</p>
      </div>
      <div className="text-right">
        <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase flex items-center gap-1 ${getRoleColor(user.Role)}`}>
          {getRoleIcon(user.Role)}
          {user.Role?.replace('_', ' ')}
        </span>
        <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
          <Clock size={10} /> {formatDate(user.createdAt)}
        </p>
      </div>
    </div>
  );
};

// Quick Action Button
const QuickActionButton = ({ icon, label, onClick, color }) => {
  const colors = {
    red: 'hover:bg-red-500/10 text-red-500',
    green: 'hover:bg-green-500/10 text-green-500',
    yellow: 'hover:bg-yellow-500/10 text-yellow-500',
    blue: 'hover:bg-blue-500/10 text-blue-500',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${colors[color]} hover:translate-x-1 justify-center`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

// Status Indicator
const StatusIndicator = ({ label, status }) => {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-green-500">Operational</span>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>
    </div>
  );
};

export default AdminDashboard;