import React, { useState, useContext } from 'react';
import { HeartPulse, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AuthService } from '../../services/AuthService'; // IMPORT SERVICE
import authBackgroundImage from "../../assets/auth-bg.jpg";

const SignupPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    EmailAddress: '',
    PhoneNumber: '',
    Password: '',
    Role: 'Donor'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // PREPARE DATA: Clean up the phone number format before sending
      const submissionData = {
        ...formData,
        PhoneNumber: `+251${formData.PhoneNumber.replace(/^0/, '')}` // Ensures no double zeros
      };

      // INTEGRATION: Send to backend
      const userData = await AuthService.register(submissionData);
      
      // AUTO-LOGIN: After successful signup, log them in
      // Note: Check if your friend's signup returns the User + Token
      if (userData) {
        login(userData);
        navigate('/dashboard');
      } else {
        // If signup only returns a success message, redirect to login
        navigate('/login');
      }

    } catch (err) {
      // Use the actual error from the backend if available
      const backendMessage = err.response?.data?.message || "Registration failed. Email or Phone might be in use.";
      setErrorMessage(backendMessage);
      console.error("Signup Interface Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center relative bg-[#C70417] p-4 font-sans overflow-hidden text-slate-900">
      
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <img src={authBackgroundImage} alt="Medical Background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/90 via-red-800/40 to-transparent"></div>
      </div>

      {/* STATIC CARD */}
      <div className="relative z-10 w-full max-w-[1050px] h-[650px] flex flex-col md:flex-row bg-white rounded-[3rem] shadow-2xl overflow-hidden">
        
        {/* LEFT SECTION */}
        <div className="hidden md:flex md:w-[40%] flex-col justify-between p-14 bg-[#8B0000] text-white">
          <div>
            <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/20">
              <HeartPulse className="text-white w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-20">Sew Le Sew</h2>
            <h1 className="text-4xl font-black mb-6 leading-[1.1] tracking-tight ">Save a Life, <br /> Give Hope.</h1>
            <p className="text-white/70 text-lg leading-relaxed font-medium max-w-[320px]">
              Join Ethiopia's centralized healthcare donation platform. Your registration is the first step in saving a life.
            </p>
          </div>
          <div className="mt-12">
            <h3 className="text-4xl font-black tracking-tight leading-none">100%</h3>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60 mt-1">Secure</p>
          </div>
        </div>

        {/* RIGHT FORM SECTION */}
        <div className="w-full md:w-[60%] bg-white h-full overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-scroll p-10 md:p-16 scroll-area">
            <style>
              {`
                .scroll-area::-webkit-scrollbar { width: 10px; display: block !important; }
                .scroll-area::-webkit-scrollbar-track { background: #f8fafc; border-radius: 0 0 3rem 0; }
                .scroll-area::-webkit-scrollbar-thumb { background-color: #E31E24; border-radius: 20px; border: 2px solid #f8fafc; }
                .scroll-area { scrollbar-width: auto; scrollbar-color: #E31E24 #f8fafc; }
              `}
            </style>
            
            <h2 className="text-2xl font-black tracking-tighter uppercase text-slate-800">Create Account</h2>
            
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl">
                {errorMessage}
              </div>
            )}
            
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <input name="FirstName" type="text" placeholder="First Name" required value={formData.FirstName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-sm outline-none focus:border-red-500/50" />
                <input name="LastName" type="text" placeholder="Last Name" required value={formData.LastName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-sm outline-none focus:border-red-500/50" />
              </div>
              <input name="EmailAddress" type="email" placeholder="Email Address" required value={formData.EmailAddress} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-sm outline-none focus:border-red-500/50" />
              
              <div className="relative flex items-center">
                <span className="absolute left-5 text-slate-400 text-sm font-bold border-r border-slate-200 pr-3">+251</span>
                <input name="PhoneNumber" type="tel" placeholder="911223344" required value={formData.PhoneNumber} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 pl-20 pr-4 py-3.5 rounded-2xl text-sm outline-none focus:border-red-500/50" />
              </div>

              <select name="Role" value={formData.Role} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-sm outline-none cursor-pointer">
                <option value="Donor">Donor</option>
                <option value="Recipient">Recipient</option>
              </select>

              <input name="Password" type="password" placeholder="Password" required value={formData.Password} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-sm outline-none focus:border-red-500/50" />
              
              <button type="submit" disabled={isLoading} className="w-full bg-[#E31E24] hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-xl mt-4 transition-all active:scale-[0.98] disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={18}/> : "CREATE ACCOUNT"}
              </button>
            </form>

            <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Already have an account? <Link to="/login" className="text-[#E31E24] hover:underline ml-1">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;