import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import bgImage from '../../assets/auth-bg.jpg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { EmailAddress: email });
      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative p-4"
         style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="absolute inset-0 bg-black/45"></div>

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111C44] rounded-3xl shadow-2xl p-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-medical-red mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-medical-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-medical-red" />
          </div>
          <h1 className="text-2xl font-black text-[#111C44] dark:text-white">Forgot Password?</h1>
          <p className="text-gray-500 text-sm mt-2">Enter your email and we'll send you a reset link</p>
        </div>

        {success ? (
          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4 text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="text-green-600 dark:text-green-400 font-medium">
              Password reset link has been sent to your email.
            </p>
            <p className="text-green-500/70 text-sm mt-2">
              Check your inbox (and spam folder) for the link.
            </p>
            <Link to="/login" className="block mt-4 text-medical-red font-bold text-sm">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-3 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-medical-red"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-medical-red text-white font-black rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;