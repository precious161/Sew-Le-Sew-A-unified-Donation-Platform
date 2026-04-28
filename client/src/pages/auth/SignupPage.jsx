import React, { useState } from 'react';
import { Mail, Phone, Lock, User, Heart, Eye, EyeOff } from 'lucide-react'; // Added Eye icons
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../../services/AuthService';

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false); // State for toggle
  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    EmailAddress: '',
    PhoneNumber: '+251',
    Role: 'Donor',
    Password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await AuthService.signup(formData);
      if (result.success) {
        alert("Account Created! Please Login.");
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center p-4" 
         style={{ backgroundImage: `url('/path-to-your-bg.jpg')` }}>
      
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden min-h-[600px]">
        
        {/* Left Side Branding */}
        <div className="md:w-5/12 bg-medical-red/80 p-10 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-20">
              <div className="bg-white p-1 rounded-lg">
                <Heart className="text-medical-red fill-medical-red" size={24} />
              </div>
              <span className="text-2xl font-bold">Sew Le Sew</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">Save a Life, <br /> Give Hope.</h1>
            <p className="text-lg opacity-90">Join Ethiopia's centralized healthcare donation platform.</p>
          </div>
          <div className="mt-10">
            <p className="text-3xl font-bold">100%</p>
            <p className="uppercase tracking-widest text-sm">Secure</p>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="md:w-7/12 p-10 overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-500">Enter your details to join the network.</p>
          </div>

          {error && <p className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-sm font-semibold text-gray-600 ml-1">First Name</label>
                <input name="FirstName" value={formData.FirstName} onChange={handleChange} required
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-red outline-none" />
              </div>
              <div className="w-1/2">
                <label className="text-sm font-semibold text-gray-600 ml-1">Last Name</label>
                <input name="LastName" value={formData.LastName} onChange={handleChange} required
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-red outline-none" />
              </div>
            </div>

            <div className="relative">
              <label className="text-sm font-semibold text-gray-600 ml-1">Email Address</label>
              <div className="absolute top-9 left-3 text-gray-400"><Mail size={20}/></div>
              <input name="EmailAddress" type="email" value={formData.EmailAddress} onChange={handleChange} required
                className="w-full mt-1 p-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            </div>

            <div className="relative">
              <label className="text-sm font-semibold text-gray-600 ml-1">Phone Number</label>
              <div className="absolute top-9 left-3 text-gray-400"><Phone size={20}/></div>
              <input name="PhoneNumber" value={formData.PhoneNumber} onChange={handleChange} required
                className="w-full mt-1 p-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            </div>

            <div className="relative">
              <label className="text-sm font-semibold text-gray-600 ml-1">Role</label>
              <div className="absolute top-9 left-3 text-gray-400"><User size={20}/></div>
              <select name="Role" value={formData.Role} onChange={handleChange}
                className="w-full mt-1 p-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl outline-none appearance-none">
                <option value="Donor">Donor </option>
                <option value="Recipient">Recipient</option>
              </select>
            </div>

            {/* Password with Toggle */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-600 ml-1">Password</label>
              <div className="absolute top-9 left-3 text-gray-400"><Lock size={20}/></div>
              <input 
                name="Password" 
                type={showPassword ? "text" : "password"} 
                value={formData.Password} 
                onChange={handleChange} 
                required
                className="w-full mt-1 p-3 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-medical-red transition-colors"
              >
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            <button type="submit" 
              className="w-full py-4 bg-medical-red text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors mt-6">
              Create Account
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-medical-red font-bold hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;