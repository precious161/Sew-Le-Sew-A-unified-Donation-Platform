import React, { useState, useContext } from 'react';
import { Mail, Lock, HeartPulse, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AuthService } from '../../services/AuthService';
import authBackgroundImage from "../../assets/auth-bg.jpg";

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ EmailAddress: '', Password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Logic moved to the AuthService Interface
      const userData = await AuthService.login(formData.EmailAddress, formData.Password);
      
      // Update Global State
      login(userData);
      
      // Role-Based Routing
      if (userData.Role === 'Admin') {
        navigate('/admin/control');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      // Using 'error' here clears the "defined but never used" warning
      // It also helps you debug by showing the exact server error in the console
      console.error("Login Interface Error:", error.response?.data?.message || error.message);
      
      alert(error.response?.data?.message || "Authentication Failed. Check credentials or server status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-[#C70417] p-6 font-sans overflow-hidden">
      
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src={authBackgroundImage} 
          alt="Medical Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#C70417]/80 mix-blend-multiply"></div>
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl text-center">
        
        <div className="bg-[#E31E24] w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/40">
          <HeartPulse className="text-white w-8 h-8" />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tighter">Welcome Back</h2>
        <p className="text-white/70 text-sm mb-12 font-medium">Please enter your details.</p>

        <form className="space-y-6 text-left" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white uppercase tracking-widest ml-1 opacity-80">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input 
                name="EmailAddress"
                type="email" 
                required
                value={formData.EmailAddress}
                onChange={(e) => setFormData({...formData, EmailAddress: e.target.value})}
                className="w-full bg-white/30 border border-white/10 pl-11 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-white/30 outline-none focus:bg-white/10 focus:ring-2 focus:ring-white/20 transition-all" 
                placeholder="email@example.com" 
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white uppercase tracking-widest ml-1 opacity-80">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input 
                name="Password"
                type="password" 
                required
                value={formData.Password}
                onChange={(e) => setFormData({...formData, Password: e.target.value})}
                className="w-full bg-white/30 border border-white/10 pl-11 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-white/30 outline-none focus:bg-white/10 focus:ring-2 focus:ring-white/20 transition-all" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <div className="text-right">
            <a href="#" className="text-[11px] text-white/60 hover:text-white transition font-medium">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#E31E24] text-[15px] hover:bg-red-700 text-white font-extrabold py-4 rounded-xl shadow-lg mt-6 tracking-widest uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign In"}
          </button>

          <p className="text-center text-[13px] text-white/50 mt-10 font-bold tracking-tight">
            Don't have an account? <Link to="/signup" className="text-white hover:underline ml-1">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;