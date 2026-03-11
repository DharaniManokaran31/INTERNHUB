import api from './api';

const progressService = {
    getInternProgress: async (studentId) => {
        const response = await api.get(`/progress/intern/${studentId}`);
        return response.data;
    },

    getMentorStats: async () => {
        const response = await api.get('/progress/mentor/stats');
        return response.data;
    },

    getWeeklyBreakdown: async (studentId) => {
        const response = await api.get(`/progress/weekly/${studentId}`);
        return response.data;
    }
};

export default progressService;
