import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

const OAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);

      const fetchUser = async () => {
        try {
          const response = await api.get('/users/profile/me');

          if (response.data.success && response.data.data) {
            setUser(response.data.data);

            if (response.data.data.Role === 'Red_Cross_Admin') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } else {
            navigate('/login', { replace: true });
          }
        } catch (error) {
          // Silent fail - just redirect to login
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      };

      fetchUser();
    } else {
      navigate('/login', { replace: true });
    }
  }, [location, navigate, setUser]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0f172a]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red mb-4"></div>
      <p className="text-white text-sm font-medium">Processing Google Sign In...</p>
    </div>
  );
};

export default OAuthRedirect;