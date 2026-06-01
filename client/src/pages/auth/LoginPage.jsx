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
          navigate('/admin', { replace: true });
        } else {
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

      <div className="relative z-10 w-full max-w-[440px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[45px] p-6 sm:p-10 shadow-2xl text-white animate-in fade-in zoom-in duration-500">

        <div className="flex justify-center mb-6">
          <div className="bg-medical-red p-3.5 rounded-2xl shadow-xl shadow-red-900/40">
            <Heart size={32} fill="white" className="text-white" />
          </div>
        </div>

        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">Welcome Back</h1>
          <p className="text-gray-300 mt-2 text-[10px] font-bold tracking-[0.2em] opacity-70">Please enter your details.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-200 p-4 rounded-2xl mb-6 text-xs font-bold text-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7" autoComplete="off">
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 sm:py-4 pl-12 pr-4 outline-none focus:bg-white/15 focus:border-medical-red transition-all font-bold text-sm"
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 sm:py-4 pl-12 pr-12 outline-none focus:bg-white/15 focus:border-medical-red transition-all font-bold text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
            {/* Forgot Password Link */}
            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-[10px] font-black text-gray-400 hover:text-medical-red transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-medical-red hover:bg-red-700 disabled:bg-gray-700 text-white font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs py-4 sm:py-5 rounded-2xl shadow-xl shadow-red-900/30 transition-all transform active:scale-95 text-center"
          >
            {isLoading ? 'Synchronizing...' : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="relative my-4 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-transparent text-gray-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 sm:py-3.5 border border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group"
          >
            <svg className="h-5 w-5 sm:h-5 sm:w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-white text-xs sm:text-sm font-medium tracking-wide">
              Sign in with Google
            </span>
          </button>
        </form>

        <div className="mt-8 sm:mt-10 text-center text-[10px] font-black tracking-widest text-gray-400">
          Don't have an account?
          <Link to="/signup" className="text-white hover:underline hover:text-medical-red transition-colors ml-1">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;