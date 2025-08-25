import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Car, MessagesSquare, Activity, Eye, EyeOff } from 'lucide-react';
import analyticsService from '../api/analyticsService';

const AnalyticsWidget = ({ 
  showTitle = true, 
  compact = false, 
  metrics = ['users', 'trips', 'feedbacks', 'scooters'],
  refreshInterval = 300000 // 5 minutes
}) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchSummary();
    
    // Set up auto-refresh
    const interval = setInterval(fetchSummary, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalyticsSummary();
      setSummary(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics widget error:', err);
    } finally {
      setLoading(false);
    }
  };

  const metricConfigs = {
    users: {
      label: 'Total Users',
      value: summary?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      trend: '+12%'
    },
    trips: {
      label: 'Total Trips',
      value: summary?.totalTrips || 0,
      icon: Car,
      color: 'green',
      trend: '+8%',
      subtitle: `${summary?.totalRevenue || 0} revenue`
    },
    feedbacks: {
      label: 'Feedback Score',
      value: `${summary?.averageRating || 0}/5`,
      icon: MessagesSquare,
      color: 'purple',
      trend: `${summary?.satisfactionRate || 0}% satisfaction`
    },
    scooters: {
      label: 'Fleet Status',
      value: `${summary?.activeScooters || 0}/${summary?.totalScooters || 0}`,
      icon: Activity,
      color: 'orange',
      trend: `${summary?.fleetUtilization || 0}% utilized`
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Show Analytics"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (loading && !summary) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${compact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg ${compact ? 'p-4' : 'p-6'}`}>
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={fetchSummary}
          className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredMetrics = metrics.filter(metric => metricConfigs[metric]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${compact ? 'p-4' : 'p-6'} relative`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
            Analytics Overview
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Refresh"
            >
              <TrendingUp className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
              title="Hide Analytics"
            >
              <EyeOff className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
            </button>
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${
        compact 
          ? 'grid-cols-2' 
          : filteredMetrics.length <= 2 
            ? 'grid-cols-1 md:grid-cols-2' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {filteredMetrics.map(metricKey => {
          const metric = metricConfigs[metricKey];
          const IconComponent = metric.icon;
          
          return (
            <div key={metricKey} className={`${compact ? 'p-3' : 'p-4'} rounded-lg bg-gray-50`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${getColorClasses(metric.color)}`}>
                  <IconComponent className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </div>
                {!compact && metric.trend && (
                  <span className="text-xs text-green-600 font-medium">
                    {metric.trend}
                  </span>
                )}
              </div>
              <div className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
                {metric.value}
              </div>
              <div className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                {metric.label}
              </div>
              {!compact && metric.subtitle && (
                <div className="text-xs text-gray-500 mt-1">
                  {metric.subtitle}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lastUpdated && !compact && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

const getColorClasses = (color) => {
  const classes = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };
  return classes[color] || classes.blue;
};

export default AnalyticsWidget;