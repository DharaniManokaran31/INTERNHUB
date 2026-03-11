// frontend-react/src/services/hrService.js
import api from './api';

const hrService = {
  // ===== DASHBOARD =====
  getDashboardStats: async () => {
    const response = await api.get('/hr/dashboard');
    return response.data;
  },

  // ===== RECRUITER MANAGEMENT (CRUD Operations) =====
  getAllRecruiters: async () => {
    const response = await api.get('/hr/recruiters');
    return response.data;
  },

  getRecruiterById: async (id) => {
    const response = await api.get(`/hr/recruiters/${id}`);
    return response.data;
  },

  updateRecruiter: async (id, data) => {
    const response = await api.put(`/hr/recruiters/${id}`, data);
    return response.data;
  },

  updateRecruiterStatus: async (id, isActive) => {
    const endpoint = isActive ? 'activate' : 'deactivate';
    const response = await api.patch(`/hr/recruiters/${id}/${endpoint}`);
    return response.data;
  },

  deactivateRecruiter: async (id) => {
    const response = await api.patch(`/hr/recruiters/${id}/deactivate`);
    return response.data;
  },

  activateRecruiter: async (id) => {
    const response = await api.patch(`/hr/recruiters/${id}/activate`);
    return response.data;
  },

  revokeInvitation: async (id) => {
    const response = await api.delete(`/hr/recruiters/${id}/revoke`);
    return response.data;
  },

  // ===== VIEW ALL DATA (HR Oversight) =====
  getAllInternships: async () => {
    const response = await api.get('/hr/internships');
    return response.data;
  },

  getInternshipById: async (id) => {
    const response = await api.get(`/hr/internships/${id}`);
    return response.data;
  },

  getInternshipApplications: async (id) => {
    const response = await api.get(`/hr/internships/${id}/applications`);
    return response.data;
  },

  getAllApplications: async () => {
    const response = await api.get('/hr/applications');
    return response.data;
  },

  getApplicationById: async (id) => {
    const response = await api.get(`/hr/applications/${id}`);
    return response.data;
  },

  updateApplicationStatus: async (id, status) => {
    const response = await api.patch(`/hr/applications/${id}/status`, { status });
    return response.data;
  },

  // ===== STUDENT MANAGEMENT =====
  getAllStudents: async () => {
    const response = await api.get('/hr/students');
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await api.get(`/hr/students/${id}`);
    return response.data;
  },

  // ===== CERTIFICATES =====
  getCertificateStats: async () => {
    const response = await api.get('/hr/certificates/stats');
    return response.data;
  },

  getCertificateEligible: async () => {
    const response = await api.get('/hr/certificates/eligible');
    return response.data;
  },

  issueCertificate: async (data) => {
    const response = await api.post('/hr/certificates/issue', data);
    return response.data;
  },

  verifyCertificate: async (id) => {
    const response = await api.get(`/hr/certificates/verify/${id}`);
    return response.data;
  },

  // ===== INTERN TRACKING & PROGRESS =====
  getActiveInterns: async () => {
    const response = await api.get('/hr/active-interns');
    return response.data;
  },

  getActiveInternsStats: async () => {
    const response = await api.get('/hr/active-interns/stats');
    return response.data;
  },

  getInternProgress: async (id) => {
    const response = await api.get(`/hr/active-interns/${id}/progress`);
    return response.data;
  },

  markInternComplete: async (id) => {
    const response = await api.patch(`/hr/active-interns/${id}/complete`);
    return response.data;
  },

  getCompletedInterns: async () => {
    const response = await api.get('/hr/completed-interns');
    return response.data;
  },

  // ===== REPORTS & ANALYTICS =====
  getReportsStats: async () => {
    const response = await api.get('/hr/reports/overview');
    return response.data;
  },

  getDepartmentDistribution: async () => {
    const response = await api.get('/hr/reports/departments');
    return response.data;
  },

  getReportsTrends: async (period = 'month') => {
    const response = await api.get(`/hr/reports/trends?period=${period}`);
    return response.data;
  },

  getReportsConversion: async () => {
    const response = await api.get('/hr/reports/conversion');
    return response.data;
  },

  // ===== NOTIFICATIONS & ACTIVITY =====
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getRecentActivity: async () => {
    const response = await api.get('/hr/activity/recent');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};

export default hrService;