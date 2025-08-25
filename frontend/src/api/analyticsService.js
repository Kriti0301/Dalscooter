// api/analyticsService.js
import axiosInstance from './axiosInstance';

export const analyticsService = {
  // Get user analytics
  getUserAnalytics: async () => {
    try {
      const response = await axiosInstance.get('/analytics/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  },

  // Get trip analytics
  getTripAnalytics: async () => {
    try {
      const response = await axiosInstance.get('/analytics/trips');
      return response.data;
    } catch (error) {
      console.error('Error fetching trip analytics:', error);
      throw error;
    }
  },

  // Get feedback analytics
  getFeedbackAnalytics: async () => {
    try {
      const response = await axiosInstance.get('/analytics/feedbacks');
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback analytics:', error);
      throw error;
    }
  },

  // Get login analytics
  getLoginAnalytics: async () => {
    try {
      const response = await axiosInstance.get('/analytics/logins');
      return response.data;
    } catch (error) {
      console.error('Error fetching login analytics:', error);
      throw error;
    }
  },

  // Get scooter analytics
  getScooterAnalytics: async () => {
    try {
      const response = await axiosInstance.get('/analytics/scooters');
      return response.data;
    } catch (error) {
      console.error('Error fetching scooter analytics:', error);
      throw error;
    }
  },

  // Get all analytics at once
  getAllAnalytics: async () => {
    try {
      const [users, trips, feedbacks, logins, scooters] = await Promise.allSettled([
        analyticsService.getUserAnalytics(),
        analyticsService.getTripAnalytics(),
        analyticsService.getFeedbackAnalytics(),
        analyticsService.getLoginAnalytics(),
        analyticsService.getScooterAnalytics()
      ]);

      return {
        users: users.status === 'fulfilled' ? users.value : null,
        trips: trips.status === 'fulfilled' ? trips.value : null,
        feedbacks: feedbacks.status === 'fulfilled' ? feedbacks.value : null,
        logins: logins.status === 'fulfilled' ? logins.value : null,
        scooters: scooters.status === 'fulfilled' ? scooters.value : null,
        errors: {
          users: users.status === 'rejected' ? users.reason : null,
          trips: trips.status === 'rejected' ? trips.reason : null,
          feedbacks: feedbacks.status === 'rejected' ? feedbacks.reason : null,
          logins: logins.status === 'rejected' ? logins.reason : null,
          scooters: scooters.status === 'rejected' ? scooters.reason : null
        }
      };
    } catch (error) {
      console.error('Error fetching all analytics:', error);
      throw error;
    }
  },

  // Get analytics summary for quick overview
  getAnalyticsSummary: async () => {
    try {
      const data = await analyticsService.getAllAnalytics();
      
      return {
        totalUsers: data.users?.total_users || 0,
        totalTrips: data.trips?.total_trips || 0,
        totalRevenue: data.trips?.total_revenue || 0,
        totalFeedbacks: data.feedbacks?.total_feedbacks || 0,
        averageRating: data.feedbacks?.average_rating || 0,
        totalScooters: data.scooters?.total_scooters || 0,
        activeScooters: data.scooters?.scooters_by_status?.available?.count || 0,
        activeSessions: data.logins?.active_sessions || 0,
        satisfactionRate: data.feedbacks?.summary?.satisfaction_rate || 0,
        fleetUtilization: data.scooters?.fleet_health?.fleet_utilization_rate || 0
      };
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  }
};

export default analyticsService;