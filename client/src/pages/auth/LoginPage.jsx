import React, { useState } from 'react';
import { Mail, Lock, Heart, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import { useAuth } from '../../hooks/useAuth';
import bgImage from '../../assets/auth-bg.jpg';

const LoginPage = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth(); 
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ EmailAddress: '', Password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await AuthService.login(formData.EmailAddress, formData.Password);
      
      if (result.success) {
      
        await checkAuth(); 
        
        const userRole = result.data.user.Role;
        
        if (userRole === 'Red_Cross_Admin') {
          console.log("Admin detected. Redirecting to Admin Panel...");
          navigate('/admin', { replace: true });
        } else {
          console.log("User detected. Redirecting to Dashboard...");
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Email Address or Password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative p-4 overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 w-full max-w-[440px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[45px] p-10 shadow-2xl text-white animate-in fade-in zoom-in duration-500">
        
        <div className="flex justify-center mb-6">
          <div className="bg-medical-red p-3.5 rounded-2xl shadow-xl shadow-red-900/40">
            <Heart size={32} fill="white" className="text-white" />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tighter ">Welcome Back</h1>
          <p className="text-gray-300 mt-2 text-[10px] font-bold  tracking-[0.2em] opacity-70">Please enter your details.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-200 p-4 rounded-2xl mb-8 text-xs font-bold text-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7" autoComplete="off">
          <div className="space-y-2">
            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-white transition-colors">
                <Mail size={18} />
              </div>
              <input 
                name="EmailAddress"
                type="email" 
                placeholder="Enter your email"
                value={formData.EmailAddress}
                onChange={handleChange}
                required
                autoComplete="new-user-email" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white/15 focus:border-medical-red transition-all font-bold text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-white transition-colors">
                <Lock size={18} />
              </div>
              <input 
                name="Password"
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={formData.Password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 outline-none focus:bg-white/15 focus:border-medical-red transition-all font-bold text-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-medical-red hover:bg-red-700 disabled:bg-gray-700 text-white font-black uppercase tracking-[0.3em] text-xs py-5 rounded-2xl shadow-xl shadow-red-900/30 transition-all transform active:scale-95 text-center"
          >
            {isLoading ? 'Synchronizing...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-10 text-center text-[10px] font-black  tracking-widest text-gray-400">
          Don't have an account? <Link to="/signup" className="text-white hover:underline hover:text-medical-red transition-colors ml-1">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;