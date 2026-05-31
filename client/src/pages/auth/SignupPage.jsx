import React, { useState } from 'react';
import { Mail, Phone, Lock, User, Heart, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import bgImage from '../../assets/auth-bg.jpg';

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' });
  const [formData, setFormData] = useState({
    FirstName: '', LastName: '', EmailAddress: '', PhoneNumber: '+251', Role: 'Donor', Password: ''
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) message = 'Weak password';
    else if (score <= 3) message = 'Fair password';
    else if (score <= 4) message = 'Good password';
    else message = 'Strong password';

    setPasswordStrength({ score, message });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'Password') {
      checkPasswordStrength(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (formData.Password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      const result = await AuthService.signup(formData);
      if (result.success) {
        setSuccessMsg("Account Created Successfully! Redirecting...");
        setTimeout(() => {
          const role = result.data?.user?.Role;
          if (role === 'Red_Cross_Admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration Failed");
    }
  };

  const getStrengthColor = () => {
    const score = passwordStrength.score;
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative p-4 sm:p-6 md:p-8 overflow-y-auto"
         style={{ backgroundImage: `url(${bgImage})` }}>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45"></div>

      {/* Main Card - Stacked on mobile, side by side on desktop */}
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-[30px] sm:rounded-[40px] shadow-2xl overflow-hidden my-8 md:my-0">

        {/* Left Branding - Hidden on very small screens? No, but make it compact */}
        <div className="md:w-5/12 bg-medical-red/80 p-6 sm:p-8 md:p-10 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-8 sm:mb-12 md:mb-20">
              <div className="bg-white p-1.5 sm:p-2 rounded-lg">
                <Heart className="text-medical-red fill-medical-red" size={20} />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter">Sew Le Sew</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 sm:mb-6 italic">
              Save a Life, <br /> Give Hope.
            </h1>
            <p className="text-xs sm:text-sm font-medium opacity-80 leading-relaxed tracking-wider">
              Join Ethiopia's centralized healthcare donation platform.
            </p>
          </div>
          <div className="mt-8 sm:mt-10">
            <p className="text-2xl sm:text-3xl font-black tracking-tighter">100%</p>
            <p className="uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[8px] sm:text-[10px] font-black opacity-60">Secure</p>
          </div>
        </div>

        {/* Right Form - Scrollable */}
        <div className="md:w-7/12 p-5 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar bg-white max-h-[80vh] md:max-h-none">
          <div className="mb-6 sm:mb-8 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-[#111C44] tracking-tighter">Create Account</h2>
            <p className="text-gray-500 text-[9px] sm:text-[10px] font-black tracking-[0.15em] sm:tracking-[0.2em] mt-1">
              Enter your details to join the network.
            </p>
          </div>

          {/* Error & Success Messages - Responsive */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-2xl mb-5 sm:mb-6 text-[10px] sm:text-xs font-bold border border-red-100 flex items-center gap-2">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-green-600 p-3 sm:p-4 rounded-2xl mb-5 sm:mb-6 text-[10px] sm:text-xs font-bold border border-green-100 flex items-center gap-2 sm:gap-3">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" autoComplete="off">
            {/* Name Row - Stack on mobile, side by side on tablet+ */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="w-full sm:w-1/2">
                <label className="text-[8px] sm:text-[9px] font-black text-gray-500 tracking-widest ml-1">First Name</label>
                <input
                  name="FirstName"
                  value={formData.FirstName}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 p-3 sm:p-4 bg-gray-100 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-medical-red outline-none text-sm font-bold"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="text-[8px] sm:text-[9px] font-black text-gray-500 tracking-widest ml-1">Last Name</label>
                <input
                  name="LastName"
                  value={formData.LastName}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 p-3 sm:p-4 bg-gray-100 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-medical-red outline-none text-sm font-bold"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="relative">
              <label className="text-[8px] sm:text-[9px] font-black text-gray-500 tracking-widest ml-1">Email Address</label>
              <div className="absolute top-[30px] sm:top-[38px] left-4 text-gray-400">
                <Mail size={16} />
              </div>
              <input
                name="EmailAddress"
                type="email"
                value={formData.EmailAddress}
                onChange={handleChange}
                required
                autoComplete="new-user-email"
                className="w-full mt-1 p-3 sm:p-4 pl-10 sm:pl-12 bg-gray-100 border border-gray-300 rounded-2xl outline-none text-sm font-bold"
              />
            </div>

            {/* Phone Field */}
            <div className="relative">
              <label className="text-[8px] sm:text-[9px] font-black text-gray-500 tracking-widest ml-1">Phone Number</label>
              <div className="absolute top-[30px] sm:top-[38px] left-4 text-gray-400">
                <Phone size={16} />
              </div>
              <input
                name="PhoneNumber"
                value={formData.PhoneNumber}
                onChange={handleChange}
                required
                className="w-full mt-1 p-3 sm:p-4 pl-10 sm:pl-12 bg-gray-100 border border-gray-300 rounded-2xl outline-none text-sm font-bold"
              />
            </div>

            {/* Role Select */}
            <div className="relative">
              <label className="text-[8px] sm:text-[9px] font-black text-gray-500 tracking-widest ml-1">Role</label>
              <div className="absolute top-[30px] sm:top-[38px] left-4 text-gray-400">
                <User size={16} />
              </div>
              <select
                name="Role"
                value={formData.Role}
                onChange={handleChange}
                className="w-full mt-1 p-3 sm:p-4 pl-10 sm:pl-12 bg-gray-100 border border-gray-300 rounded-2xl outline-none appearance-none text-sm font-black uppercase tracking-tighter cursor-pointer"
              >
                <option value="Donor">Donor</option>
                <option value="Recipient">Recipient</option>
              </select>
            </div>

            {/* Password Field */}
            <div className="relative pb-1 sm:pb-2">
              <label className="text-[8px] sm:text-[9px] font-black text-gray-500 tracking-widest ml-1">Password</label>
              <div className="absolute top-[30px] sm:top-[38px] left-4 text-gray-400">
                <Lock size={16} />
              </div>
              <input
                name="Password"
                type={showPassword ? "text" : "password"}
                value={formData.Password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full mt-1 p-3 sm:p-4 pl-10 sm:pl-12 pr-10 sm:pr-12 bg-gray-100 border border-gray-300 rounded-2xl outline-none text-sm font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 sm:right-4 top-[30px] sm:top-[38px] text-gray-400 hover:text-medical-red"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength Indicator - Responsive text */}
            {formData.Password && (
              <div className="mt-0">
                <div className="flex gap-1 h-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all ${
                        i <= passwordStrength.score ? getStrengthColor() : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {passwordStrength.score <= 2 ? (
                    <AlertCircle size={10} className="text-red-500" />
                  ) : passwordStrength.score <= 3 ? (
                    <AlertCircle size={10} className="text-yellow-500" />
                  ) : (
                    <CheckCircle2 size={10} className="text-green-500" />
                  )}
                  <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                    passwordStrength.score <= 2 ? 'text-red-500' :
                    passwordStrength.score <= 3 ? 'text-yellow-500' :
                    passwordStrength.score <= 4 ? 'text-blue-500' : 'text-green-500'
                  }`}>
                    {passwordStrength.message}
                  </span>
                  {passwordStrength.score <= 2 && (
                    <span className="text-[7px] sm:text-[8px] text-gray-400 ml-auto">
                      Min 8 chars, 1 uppercase, 1 number
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 sm:py-5 bg-medical-red text-white font-black tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all mt-2 sm:mt-4 active:scale-95"
            >
              Create Account
            </button>
          </form>

          <div className="text-center mt-6 sm:mt-10 pb-2 sm:pb-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 tracking-widest">
              Already have an account? <Link to="/login" className="text-medical-red hover:underline ml-1">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;