import api from '../api/axios';

const Profileservice = {
    
    getMe: async () => {
        const response=  await api.get('/users/profile/me');
        return response.data;

    },

    updateMe: async (profileData) => {
        const response = await api.patch('/users/profile/update-me', profileData);
        return response.data;
    }
};

export default Profileservice;