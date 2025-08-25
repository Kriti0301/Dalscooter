import axiosInstance from './axiosInstance';

export const feedbackService = {
  // Submit new feedback
  submitFeedback: async (feedbackData) => {
    const response = await axiosInstance.post('/feedbacks', feedbackData);
    return response.data;
  },

  // Get feedbacks with filters
  getFeedbacks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.scooter_type) params.append('scooter_type', filters.scooter_type);
    if (filters.sentiment) params.append('sentiment', filters.sentiment);
    if (filters.rating) params.append('rating', filters.rating);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.last_key) params.append('last_key', filters.last_key);
    
    const response = await axiosInstance.get(`/feedbacks?${params.toString()}`);
    return response.data;
  },

  // Get analytics
  getAnalytics: async () => {
    const response = await axiosInstance.get('/feedbacks/analytics');
    return response.data;
  },

  // Delete feedback
  deleteFeedback: async (feedbackId) => {
    const response = await axiosInstance.delete(`/feedbacks/${feedbackId}`);
    return response.data;
  },
  getPublicFeedback: async () => {
    const response = await axiosInstance.get('/feedbacks/public');
    return response.data;
  },

};