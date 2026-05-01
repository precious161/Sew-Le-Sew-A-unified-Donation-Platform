import React, { useState } from 'react';
import { Mail, Phone, Lock, User, Heart, Eye, EyeOff, CheckCircle2 } from 'lucide-react'; 
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import bgImage from '../../assets/auth-bg.jpg'; 

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    FirstName: '', 
    LastName: '', 
    EmailAddress: '', 
    PhoneNumber: '+251', 
    Role: 'Donor', 
    Password: ''
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const result = await AuthService.signup(formData);
      if (result.success) {
        setSuccessMsg("Account Created Successfully! Redirecting to login...");
        // Delay for 2.5 seconds to show the success UI before navigating
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative p-6 overflow-hidden" 
         style={{ backgroundImage: `url(${bgImage})` }}>
      
      {/* Dark overlay for background image depth */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Main Card: Fixed max-height creates internal scroll on the right side */}
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* Left Side Branding - Branded Red with slight transparency */}
        <div className="md:w-5/12 bg-medical-red/90 p-10 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-20">
              <div className="bg-white p-1 rounded-lg">
                <Heart className="text-medical-red fill-medical-red" size={24} />
              </div>
              <span className="text-2xl font-bold tracking-tighter ">Sew Le Sew</span>
            </div>
            <h1 className="text-5xl font-black leading-tight mb-6 italic">Save a Life, <br /> Give Hope.</h1>
            <p className="text-sm font-medium opacity-90 leading-relaxed">
              Join Ethiopia's centralized healthcare donation platform. Your registration is the first step in saving a life at Tikur Anbessa or St. Paul's.
            </p>
          </div>
          <div className="mt-10">
            <p className="text-3xl font-black ">100%</p>
            <p className="uppercase tracking-[0.3em] text-[10px] font-bold opacity-80">Secure </p>
          </div>
        </div>

        {/* Right Side Form: Solid White with internal scrollbar */}
        <div className="md:w-7/12 p-10 overflow-y-auto custom-scrollbar bg-white">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-black text-[#111C44] tracking-tighter ">Create Account</h2>
            <p className="text-gray-500 text-xs font-bold  tracking-widest mt-1">Enter your details to join the network</p>
          </div>

          {/* Feedback UI (Replaces standard alerts) */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-xs font-bold border border-red-100 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl mb-6 text-xs font-bold border border-green-100 flex items-center gap-3 animate-in zoom-in">
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                <input 
                  name="FirstName" 
                  value={formData.FirstName} 
                  onChange={handleChange} 
                  required
                  className="w-full mt-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-medical-red outline-none text-sm font-bold" 
                />
              </div>
              <div className="w-1/2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                <input 
                  name="LastName" 
                  value={formData.LastName} 
                  onChange={handleChange} 
                  required
                  className="w-full mt-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-medical-red outline-none text-sm font-bold" 
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="absolute top-[38px] left-4 text-gray-400"><Mail size={18}/></div>
              <input 
                name="EmailAddress" 
                type="email" 
                value={formData.EmailAddress} 
                onChange={handleChange} 
                required
                autoComplete="off" // FIX: Prevents browser from showing your personal email
                className="w-full mt-1 p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold" 
              />
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="absolute top-[38px] left-4 text-gray-400"><Phone size={18}/></div>
              <input 
                name="PhoneNumber" 
                value={formData.PhoneNumber} 
                onChange={handleChange} 
                required
                className="w-full mt-1 p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold" 
              />
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role</label>
              <div className="absolute top-[38px] left-4 text-gray-300"><User size={18}/></div>
              <select 
                name="Role" 
                value={formData.Role} 
                onChange={handleChange}
                className="w-full mt-1 p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none appearance-none text-sm font-black uppercase tracking-tighter cursor-pointer"
              >
                <option value="Donor">Donor </option>
                <option value="Recipient">Recipient </option>
              </select>
            </div>

            <div className="relative pb-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="absolute top-[38px] left-4 text-gray-400"><Lock size={18}/></div>
              <input 
                name="Password" 
                type={showPassword ? "text" : "password"} 
                value={formData.Password} 
                onChange={handleChange} 
                required
                autoComplete="new-password" // FIX: Prevents browser from suggesting old passwords
                className="w-full mt-1 p-4 pl-12 pr-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-[38px] text-gray-400 hover:text-medical-red transition-colors"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            <button 
              type="submit" 
              className="w-full py-5 bg-medical-red text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all mt-6 active:scale-95"
            >
              Create Account
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Already have an account? <Link to="/login" className="text-medical-red font-black hover:underline ml-1">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;