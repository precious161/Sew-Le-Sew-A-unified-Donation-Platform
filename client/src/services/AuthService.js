import API from '../api/axios';

/**
 * AuthService Implementation
 * Includes the "Me" Pattern for session persistence.
 */
export const AuthService = {
    
    // Task: AuthenticateUser
    login: async (email, password) => {
        try {
            console.log(`AuthService: Connecting to backend for ${email}...`);
            const response = await API.post('/auth/login', { email, password });

            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data.user; 
        } catch (error) {
            console.error("AuthService Login Error:", error?.response?.data || error.message);
            throw error;
        }
    },

    // Task: "Me" Pattern (Persistence Check)
    // Validates the existing token with the backend authMiddleware
    getCurrentUser: async () => {
        try {
            // Your friend's backend will validate the token via authMiddleware
            const response = await API.get('/users/me'); 
            return response.data; 
        } catch (error) {
            // If token is invalid/expired, clean up local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            throw error;
        }
    },

    // Task: RegisterUser
    register: async (userData) => {
        try {
            const response = await API.post('/auth/signup', userData);
            return response.data;
        } catch (error) {
            console.error("AuthService Signup Error:", error);
            throw error;
        }
    },

    // Task: TerminateSession
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log("AuthService: Session Terminated");
    }
};

export default AuthService;