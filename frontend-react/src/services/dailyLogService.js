// src/services/dailyLogService.js
import api from './api';

const dailyLogService = {
    // Student functions
    submitDailyLog: async (logData) => {
        try {
            const response = await api.post('/daily-logs', logData);
            return response.data;
        } catch (error) {
            console.error('Error in submitDailyLog:', error);
            throw error;
        }
    },

    getMyLogs: async (internshipId = null) => {
        try {
            const url = internshipId ? `/daily-logs/my-logs?internshipId=${internshipId}` : '/daily-logs/my-logs';
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error in getMyLogs:', error);
            throw error;
        }
    },

    // Mentor functions
    getPendingLogs: async () => {
        try {
            console.log('🔍 Fetching pending logs from /daily-logs/pending');
            const response = await api.get('/daily-logs/pending');
            console.log('📊 Pending logs response:', response.data);
            
            // Handle different response structures
            if (response.data.success) {
                return {
                    success: true,
                    logs: response.data.data?.logs || response.data.logs || []
                };
            } else {
                // If API returns success: false but has data
                return {
                    success: false,
                    logs: response.data.logs || response.data.data?.logs || []
                };
            }
        } catch (error) {
            console.error('❌ Error in getPendingLogs:', error.response || error);
            // Return empty array instead of throwing
            return {
                success: false,
                logs: [],
                error: error.message
            };
        }
    },

    getInternLogs: async (studentId) => {
        try {
            const response = await api.get(`/daily-logs/intern/${studentId}`);
            return response.data;
        } catch (error) {
            console.error('Error in getInternLogs:', error);
            throw error;
        }
    },

    approveLog: async (logId, feedback = '') => {
        try {
            const response = await api.put(`/daily-logs/${logId}/approve`, { feedback });
            return response.data;
        } catch (error) {
            console.error('Error in approveLog:', error);
            throw error;
        }
    },

    rejectLog: async (logId, reason) => {
        try {
            const response = await api.put(`/daily-logs/${logId}/reject`, { reason });
            return response.data;
        } catch (error) {
            console.error('Error in rejectLog:', error);
            throw error;
        }
    },

    addFeedback: async (logId, feedbackData) => {
        try {
            const response = await api.put(`/daily-logs/${logId}/feedback`, feedbackData);
            return response.data;
        } catch (error) {
            console.error('Error in addFeedback:', error);
            throw error;
        }
    },

    // Shared
    getStats: async () => {
        try {
            const response = await api.get('/daily-logs/stats');
            return response.data;
        } catch (error) {
            console.error('Error in getStats:', error);
            throw error;
        }
    }
};

export default dailyLogService;