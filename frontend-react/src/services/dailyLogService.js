import api from './api';

const dailyLogService = {
    // Student functions
    submitDailyLog: async (logData) => {
        const response = await api.post('/daily-logs', logData);
        return response.data;
    },

    getMyLogs: async (internshipId = null) => {
        const url = internshipId ? `/daily-logs/my-logs?internshipId=${internshipId}` : '/daily-logs/my-logs';
        const response = await api.get(url);
        return response.data;
    },

    // Mentor functions
    getPendingLogs: async () => {
        const response = await api.get('/daily-logs/pending');
        return response.data;
    },

    getInternLogs: async (studentId) => {
        const response = await api.get(`/daily-logs/intern/${studentId}`);
        return response.data;
    },

    approveLog: async (logId, feedback = '') => {
        const response = await api.put(`/daily-logs/${logId}/approve`, { feedback });
        return response.data;
    },

    rejectLog: async (logId, reason) => {
        const response = await api.put(`/daily-logs/${logId}/reject`, { reason });
        return response.data;
    },

    addFeedback: async (logId, feedbackData) => {
        const response = await api.put(`/daily-logs/${logId}/feedback`, feedbackData);
        return response.data;
    },

    // Shared
    getStats: async () => {
        const response = await api.get('/daily-logs/stats');
        return response.data;
    }
};

export default dailyLogService;
