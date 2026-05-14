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
     * Note: We use 'multipart/form-data' because this request contains a physical file.
     */
    verifyIdentity: async (formData) => {
        const response = await api.patch('/users/profile/verify-identity', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};

export default ProfileService;