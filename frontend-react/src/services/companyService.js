import api from './api';

const companyService = {
  // Register Zoyaraa company (first time)
  registerCompany: async (companyData) => {
    const response = await api.post('/company/register', companyData);
    return response.data;
  },

  // Get company profile
  getCompanyProfile: async () => {
    const response = await api.get('/company/profile');
    return response.data;
  },

  // Update company profile
  updateCompanyProfile: async (companyData) => {
    const response = await api.put('/company/profile', companyData);
    return response.data;
  },

  // Invite a new recruiter
  inviteRecruiter: async (recruiterData) => {
    const response = await api.post('/company/invite', recruiterData);
    return response.data;
  },

  // Get all recruiters (active + pending)
  getAllRecruiters: async () => {
    const response = await api.get('/company/recruiters');
    return response.data;
  },

  // Resend invitation to a pending recruiter
  resendInvitation: async (recruiterId) => {
    const response = await api.post(`/company/recruiters/${recruiterId}/resend`);
    return response.data;
  },

  // Accept invitation (public route - no auth needed)
  acceptInvitation: async (token, password) => {
    const response = await api.post(`/company/accept-invitation/${token}`, { password });
    return response.data;
  }
};

export default companyService;