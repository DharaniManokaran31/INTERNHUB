// frontend-react/src/services/companyService.js
import api from './api';

const companyService = {
  // ===== COMPANY REGISTRATION & PROFILE (Used during setup) =====
  // Register Zoyaraa company (first time - only HR does this once)
  registerCompany: async (companyData) => {
    const response = await api.post('/company/register', companyData);
    return response.data;
  },

  // Get company profile (used by HR dashboard)
  getCompanyProfile: async () => {
    const response = await api.get('/company/profile');
    return response.data;
  },

  // Update company profile (HR only)
  updateCompanyProfile: async (companyData) => {
    const response = await api.put('/company/profile', companyData);
    return response.data;
  },

  // ===== INVITATION MANAGEMENT (Used by HR) =====
  // Invite a new recruiter (HR only)
  inviteRecruiter: async (recruiterData) => {
    const response = await api.post('/company/invite', recruiterData);
    return response.data;
  },

  // Resend invitation to a pending recruiter (HR only)
  resendInvitation: async (recruiterId) => {
    const response = await api.post(`/company/recruiters/${recruiterId}/resend`);
    return response.data;
  },

  // Accept invitation (public - used by recruiters)
  acceptInvitation: async (token, password) => {
    const response = await api.post(`/company/accept-invitation/${token}`, { password });
    return response.data;
  }
};

export default companyService;