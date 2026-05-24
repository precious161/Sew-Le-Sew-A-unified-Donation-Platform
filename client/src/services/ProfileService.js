import api from '../api/axios';

const ProfileService = {
    /**
     * GET: Retrieves the current user's full profile.
     * Maps to: /api/users/profile/me
     */
    getMe: async () => {
        const response = await api.get('/users/profile/me');
        return response.data;
    },

    /**
     * PATCH: Updates names, phone number, and blood type.
     * Maps to: /api/users/profile/update-me
     */
    updateMe: async (profileData) => {
        const response = await api.patch('/users/profile/update-me', profileData);
        return response.data;
    },

    /**
     * PATCH: Uploads National ID or Passport to Cloudinary.
     * Maps to: /api/users/profile/verify-identity
     */
    verifyIdentity: async (formData) => {
        const response = await api.patch('/users/profile/verify-identity', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * POST: User self role change (with safety checks)
     * Maps to: /api/users/profile/change-role
     */
    changeRole: async (newRole, reason = '') => {
        const response = await api.post('/users/profile/change-role', { newRole, reason });
        return response.data;
    }
};

export default ProfileService;