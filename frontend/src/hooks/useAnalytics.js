// src/hooks/useAnalytics.js

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

/**
 * Custom hook for fetching and managing analytics data
 */
export const useAnalytics = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes default
    dependencies = []
  } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(endpoint);
      setData(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(`Error fetching analytics from ${endpoint}:`, err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated
  };
};

/**
 * Hook for fetching scooter analytics
 */
export const useScooterAnalytics = (options = {}) => {
  return useAnalytics('/analytics/scooters', options);
};

/**
 * Hook for fetching trip analytics
 */
export const useTripAnalytics = (options = {}) => {
  return useAnalytics('/analytics/trips', options);
};

/**
 * Hook for fetching user analytics
 */
export const useUserAnalytics = (options = {}) => {
  return useAnalytics('/analytics/users', options);
};

/**
 * Hook for fetching login analytics
 */
export const useLoginAnalytics = (options = {}) => {
  return useAnalytics('/analytics/logins', options);
};

/**
 * Hook for fetching feedback analytics
 */
export const useFeedbackAnalytics = (options = {}) => {
  return useAnalytics('/feedbacks/analytics', options);
};

/**
 * Hook for comprehensive analytics summary
 */
export const useAnalyticsSummary = (options = {}) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const {
    autoRefresh = false,
    refreshInterval = 300000,
    dependencies = []
  } = options;

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics in parallel
      const [
        scooterResponse,
        tripResponse,
        userResponse,
        feedbackResponse,
        loginResponse
      ] = await Promise.allSettled([
        axiosInstance.get('/analytics/scooters'),
        axiosInstance.get('/analytics/trips'),
        axiosInstance.get('/analytics/users'),
        axiosInstance.get('/feedbacks/analytics'),
        axiosInstance.get('/analytics/logins')
      ]);

      // Process successful responses
      const scooterData = scooterResponse.status === 'fulfilled' ? scooterResponse.value.data : {};
      const tripData = tripResponse.status === 'fulfilled' ? tripResponse.value.data : {};
      const userData = userResponse.status === 'fulfilled' ? userResponse.value.data : {};
      const feedbackData = feedbackResponse.status === 'fulfilled' ? feedbackResponse.value.data : {};
      const loginData = loginResponse.status === 'fulfilled' ? loginResponse.value.data : {};

      // Create summary object
      const summaryData = {
        // Scooter metrics
        totalScooters: scooterData.total_scooters || 0,
        activeScooters: scooterData.operational_summary?.ready_for_use || 0,
        fleetUtilization: scooterData.fleet_health?.fleet_utilization_rate || 0,
        averageBattery: scooterData.battery_analytics?.average_battery_level || 0,

        // Trip metrics
        totalTrips: tripData.total_trips || 0,
        totalRevenue: tripData.total_revenue || 0,
        averageTripPrice: tripData.average_trip_price || 0,
        completionRate: tripData.revenue_breakdown?.completion_rate || 0,

        // User metrics
        totalUsers: userData.total_users || 0,
        activeUsers: userData.login_activity?.active_users_week || 0,
        customerCount: userData.users_by_role?.customers?.count || 0,
        franchiseCount: userData.users_by_role?.franchises?.count || 0,

        // Feedback metrics
        totalFeedbacks: feedbackData.total_feedbacks || 0,
        averageRating: feedbackData.average_rating || 0,
        satisfactionRate: feedbackData.summary?.satisfaction_rate || 0,
        
        // Login metrics
        totalSessions: loginData.total_sessions || 0,
        activeSessions: loginData.active_sessions || 0,
        averageSessionDuration: loginData.session_analytics?.average_duration_minutes || 0,

        // Health indicators
        systemHealth: {
          scootersOnline: scooterData.fleet_health?.availability_rate || 0,
          activeTrips: tripData.revenue_breakdown?.pending_trips || 0,
          userEngagement: userData.user_engagement?.user_retention?.retention_rate || 0,
          feedbackSentiment: feedbackData.summary?.overall_sentiment || 'neutral'
        },

        // Raw data for detailed views
        rawData: {
          scooters: scooterData,
          trips: tripData,
          users: userData,
          feedback: feedbackData,
          logins: loginData
        },

        lastUpdated: new Date().toISOString()
      };

      setSummary(summaryData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics summary:', err);
      setError(err.message || 'Failed to fetch analytics summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Initial fetch
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, ...dependencies]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(fetchSummary, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSummary]);

  return {
    data: summary,
    loading,
    error,
    refresh,
    lastUpdated
  };
};

/**
 * Hook for real-time dashboard metrics
 */
export const useDashboardMetrics = (options = {}) => {
  const [metrics, setMetrics] = useState({
    scooters: { available: 0, inUse: 0, maintenance: 0 },
    trips: { today: 0, ongoing: 0, revenue: 0 },
    users: { online: 0, total: 0 },
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds for real-time
    dependencies = []
  } = options;

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch key metrics quickly
      const responses = await Promise.allSettled([
        axiosInstance.get('/scooters?status=available'),
        axiosInstance.get('/scooters?status=in_use'),
        axiosInstance.get('/scooters?status=maintenance'),
        axiosInstance.get('/analytics/trips'),
        axiosInstance.get('/analytics/users')
      ]);

      const [availableScooters, inUseScooters, maintenanceScooters, tripData, userData] = responses;

      const newMetrics = {
        scooters: {
          available: availableScooters.status === 'fulfilled' ? availableScooters.value.data.length : 0,
          inUse: inUseScooters.status === 'fulfilled' ? inUseScooters.value.data.length : 0,
          maintenance: maintenanceScooters.status === 'fulfilled' ? maintenanceScooters.value.data.length : 0
        },
        trips: {
          today: tripData.status === 'fulfilled' ? tripData.value.data.total_trips : 0,
          ongoing: tripData.status === 'fulfilled' ? (tripData.value.data.revenue_breakdown?.pending_trips || 0) : 0,
          revenue: tripData.status === 'fulfilled' ? tripData.value.data.total_revenue : 0
        },
        users: {
          online: userData.status === 'fulfilled' ? (userData.value.data.login_activity?.active_users_today || 0) : 0,
          total: userData.status === 'fulfilled' ? userData.value.data.total_users : 0
        },
        alerts: [], // Could be populated based on business rules
        lastUpdated: new Date().toISOString()
      };

      setMetrics(newMetrics);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics, ...dependencies]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  return {
    data: metrics,
    loading,
    error,
    refresh
  };
};

/**
 * Hook for fetching analytics with caching
 */
export const useCachedAnalytics = (endpoint, cacheTime = 300000) => {
  const [cache, setCache] = useState(new Map());
  
  const getCachedData = useCallback((key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }
    return null;
  }, [cache, cacheTime]);

  const setCachedData = useCallback((key, data) => {
    setCache(prev => new Map(prev.set(key, {
      data,
      timestamp: Date.now()
    })));
  }, []);

  const analytics = useAnalytics(endpoint, {
    transform: (data) => {
      setCachedData(endpoint, data);
      return data;
    }
  });

  // Check cache first
  const cachedData = getCachedData(endpoint);
  if (cachedData && !analytics.loading) {
    return {
      ...analytics,
      data: cachedData,
      fromCache: true
    };
  }

  return {
    ...analytics,
    fromCache: false
  };
};

export default {
  useAnalytics,
  useScooterAnalytics,
  useTripAnalytics,
  useUserAnalytics,
  useLoginAnalytics,
  useFeedbackAnalytics,
  useAnalyticsSummary,
  useDashboardMetrics,
  useCachedAnalytics
};