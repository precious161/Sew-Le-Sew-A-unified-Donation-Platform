import React, { useContext, useState, useEffect } from 'react'; // Added useEffect
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProfileService from '../services/ProfileService'; // Import your service
import LogoutButton from '../components/LogoutButton';
import NotificationHub from '../components/notifications/NotificationHub'; 
import authBackgroundImage from "../assets/auth-bg.jpg"; 
import { HeartPulse, User as UserIcon, LayoutDashboard, ArrowRight, ShieldAlert, Sun, Moon, Activity, Menu, X } from 'lucide-react';

const Dashboard = () => {
  const { user, theme, toggleTheme } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [liveHealthData, setLiveHealthData] = useState(user?.HealthInfo || {}); // State for fetched data
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const isNight = theme === 'night';
  const isAdmin = user?.Role === 'Admin';

  // --- NEW INTEGRATION LOGIC ---
  useEffect(() => {
    const fetchLatestData = async () => {
      if (!isAdmin && user?.UserId) {
        try {
          setIsLoading(true);
          const freshData = await ProfileService.getUserProfile(user.UserId);
          setLiveHealthData(freshData.HealthInfo || {});
        } catch (error) {
          console.error("Dashboard: Error fetching live stats", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchLatestData();
  }, [user, isAdmin]); 
  // --- END INTEGRATION LOGIC ---

  const handleProfileClick = () => {
    setIsMenuOpen(false);
    navigate('/profile');
  };

  const sidebarBg = isNight ? "bg-slate-900/95 border-white/10" : "bg-white/90 border-slate-200 shadow-2xl";
  const cardGlassBg = isNight ? "bg-white/5 border-white/10" : "bg-white/40 border-white/30 backdrop-blur-md shadow-xl";
  const headerBg = isNight ? "bg-slate-900/40 border-white/10" : "bg-white/30 border-white/20";

  return (
    <div className={`min-h-screen w-full flex transition-colors duration-500 relative overflow-hidden ${isNight ? 'bg-slate-900 text-white' : 'bg-[#F9FAFB] text-slate-900'}`}>
      <div className="absolute inset-0 z-0">
         <img src={authBackgroundImage} alt="BG" className={`w-full h-full object-cover transition-opacity duration-700 ${isNight ? 'opacity-20' : 'opacity-[0.12]'}`} />
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 ${sidebarBg} border-r p-6 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} backdrop-blur-xl`}>
        <div className="flex items-center justify-between mb-10 px-2">
             <div className="flex items-center gap-3">
                <HeartPulse className={`w-8 h-8 ${isAdmin ? 'text-blue-500' : 'text-[#E31E24]'}`} />
                <span className="text-xl font-black tracking-tighter ">Sew Le Sew</span>
             </div>
             <button className="md:hidden" onClick={() => setIsMenuOpen(false)}><X size={20} /></button>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white font-bold text-sm uppercase tracking-widest shadow-lg transition-all ${isAdmin ? 'bg-blue-600 shadow-blue-500/20' : 'bg-[#E31E24] shadow-red-500/20'}`}>
            <LayoutDashboard size={18} /> {isAdmin ? "System Home" : "Dashboard"}
          </Link>
          
          {isAdmin && (
            <Link to="/admin/control" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-widest text-blue-500 hover:bg-blue-500/10">
              <ShieldAlert size={18} /> Admin Control
            </Link>
          )}

          <button onClick={handleProfileClick} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-widest opacity-60 hover:opacity-100">
            <UserIcon size={18} /> Profile
          </button>
        </nav>

        <div className="mt-auto">
            <LogoutButton />
        </div>
      </aside>

      <main className="relative z-10 flex-1 flex flex-col overflow-y-auto">
        <header className={`h-20 border-b ${headerBg} backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-20`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 rounded-lg bg-black/5 hover:bg-black/10 transition-colors">
              <Menu size={20} />
            </button>
            <div className="text-[9px] font-black tracking-[0.2em] uppercase opacity-40 hidden xs:block">Status: <span className="text-green-500">Authorized Access</span></div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                {isNight ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
            </button>
            
            {!isAdmin && <NotificationHub user={user} isNight={isNight} />}
            
            <div className="flex items-center gap-3 ml-2">
              <div className="text-right hidden sm:block"> 
                <p className={`text-[9px] font-black uppercase ${isAdmin ? 'text-blue-500' : 'text-[#E31E24]'}`}>{user?.Role}</p>
                <p className="text-sm font-black uppercase tracking-tight">{user?.FirstName} {user?.LastName}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg ${isAdmin ? 'bg-blue-600' : 'bg-[#E31E24]'}`}>
                {user?.FirstName?.[0]}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          <h1 className="text-5xl font-black tracking-tighter italic uppercase text-left">
            {isAdmin ? "System Command" : "Health Overview"}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isAdmin ? (
              <Link to="/admin/control" className={`${cardGlassBg} border p-7 rounded-[2.5rem] group hover:scale-[1.02] transition-all border-dashed text-left`}>
                <p className="text-[10px] font-black opacity-40 uppercase">Quick Access</p>
                <h3 className="text-2xl font-black mt-2 uppercase">Manage <br /> Registry</h3>
                <div className="mt-4 flex items-center gap-2 text-blue-500 text-[10px] font-bold">LAUNCH CONTROL <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></div>
              </Link>
            ) : (
              <>
                <div className={`${cardGlassBg} border p-7 rounded-[2.5rem] border-l-8 border-l-[#E31E24] text-left relative overflow-hidden`}>
                  {isLoading && <div className="absolute top-2 right-4 animate-pulse text-[8px] font-bold">SYNCING...</div>}
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Blood Type</p>
                  <h3 className="text-6xl font-black mt-2 text-[#E31E24]">{liveHealthData.BloodType || "--"}</h3>
                </div>

                <div className="bg-gradient-to-br from-[#E31E24] to-red-900 p-7 rounded-[2.5rem] text-white shadow-xl text-left">
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Metrics</p>
                  <h3 className="text-3xl font-black mt-2 uppercase">
                    {liveHealthData.Weight ? `${liveHealthData.Weight}kg` : '--'} / {liveHealthData.Height ? `${liveHealthData.Height}cm` : '--'}
                  </h3>
                  <div className="mt-4 text-[10px] font-bold opacity-80 uppercase italic flex items-center gap-2">
                    <Activity size={12}/> {isLoading ? "Updating..." : "Health Synchronized"}
                  </div>
                </div>

                <button onClick={() => navigate('/profile')} className={`${cardGlassBg} border p-7 rounded-[2.5rem] group hover:scale-[1.02] transition-all border-dashed text-left w-full`}>
                  <p className="text-[10px] font-black opacity-40 uppercase">Action</p>
                  <h3 className="text-2xl font-black mt-2 uppercase text-red-500">Update <br /> Medicals</h3>
                  <div className="mt-4 flex items-center gap-2 text-red-500 text-[10px] font-bold">EDIT PROFILE <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></div>
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;