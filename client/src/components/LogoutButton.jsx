import React, { useContext, useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const LogoutButton = () => {
  const { logout } = useContext(AuthContext);
  const [isPending, setIsPending] = useState(false);

  const handleLogout = () => {
    setIsPending(true);
    // Brief delay to simulate "Secure Termination" (UC-003)
    setTimeout(() => {
      logout();
      setIsPending(false);
    }, 800);
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-red-500/20 border border-white/10 rounded-2xl text-white transition-all group disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <LogOut className="w-5 h-5 text-red-400 group-hover:rotate-12 transition-transform" />
      )}
      <span className="font-bold text-sm">LOGOUT</span>
    </button>
  );
};

export default LogoutButton;