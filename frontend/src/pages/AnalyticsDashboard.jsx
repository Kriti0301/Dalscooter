import React, { useState, useEffect } from 'react';
import { Users, Car, MessagesSquare, ExternalLink, LogIn, TrendingUp, Activity, BarChart3, PieChart, Calendar, Clock } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    users: null,
    trips: null,
    feedbacks: null,
    logins: null,
    scooters: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [usersRes, tripsRes, feedbacksRes, loginsRes, scootersRes] = await Promise.allSettled([
        axiosInstance.get('/analytics/users'),
        axiosInstance.get('/analytics/trips'),
        axiosInstance.get('/analytics/feedbacks'),
        axiosInstance.get('/analytics/logins'),
        axiosInstance.get('/analytics/scooters')
      ]);

      setAnalytics({
        users: usersRes.status === 'fulfilled' ? usersRes.value.data : null,
        trips: tripsRes.status === 'fulfilled' ? tripsRes.value.data : null,
        feedbacks: feedbacksRes.status === 'fulfilled' ? feedbacksRes.value.data : null,
        logins: loginsRes.status === 'fulfilled' ? loginsRes.value.data : null,
        scooters: scootersRes.status === 'fulfilled' ? scootersRes.value.data : null
      });
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchAllAnalytics}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={analytics.users?.total_users || 0}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          subtitle={`${analytics.users?.users_by_role?.customers?.count || 0} customers, ${analytics.users?.users_by_role?.franchises?.count || 0} franchises`}
        />
        <MetricCard
          title="Total Trips"
          value={analytics.trips?.total_trips || 0}
          icon={<Car className="w-6 h-6" />}
          color="green"
          subtitle={`$${analytics.trips?.total_revenue || 0} revenue`}
        />
        <MetricCard
          title="Total Feedbacks"
          value={analytics.feedbacks?.total_feedbacks || 0}
          icon={<MessagesSquare className="w-6 h-6" />}
          color="purple"
          subtitle={`${analytics.feedbacks?.average_rating || 0}/5 avg rating`}
        />
        <MetricCard
          title="Total Scooters"
          value={analytics.scooters?.total_scooters || 0}
          icon={<Activity className="w-6 h-6" />}
          color="orange"
          subtitle={`${analytics.scooters?.scooters_by_status?.available?.count || 0} available`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
          <div className="space-y-3">
            {analytics.users?.users_by_role && Object.entries(analytics.users.users_by_role).map(([role, data]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="capitalize font-medium">{role}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{data.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Trip Status</h3>
          <div className="space-y-3">
            {analytics.trips?.trips_by_status && Object.entries(analytics.trips.trips_by_status).map(([status, data]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize font-medium">{status.replace('_', ' ')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'completed' ? 'bg-green-500' : 
                        status === 'ongoing' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{data.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <LogIn className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">
              {analytics.logins?.active_users_today || 0}
            </div>
            <div className="text-sm text-gray-600">Active Today</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {analytics.scooters?.fleet_health?.fleet_utilization_rate || 0}%
            </div>
            <div className="text-sm text-gray-600">Fleet Utilization</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {analytics.feedbacks?.summary?.satisfaction_rate || 0}%
            </div>
            <div className="text-sm text-gray-600">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">User Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.users?.total_users || 0}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analytics.users?.user_engagement?.user_retention?.retention_rate || 0}%
            </div>
            <div className="text-sm text-gray-600">Retention Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.users?.login_activity?.active_users_week || 0}
            </div>
            <div className="text-sm text-gray-600">Active This Week</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {analytics.users?.login_activity?.average_sessions_per_user || 0}
            </div>
            <div className="text-sm text-gray-600">Avg Sessions/User</div>
          </div>
        </div>

        {/* Sample Users */}
        {analytics.users?.sample_users && (
          <div>
            <h4 className="font-medium mb-3">Recent Users</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Sessions</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.users.sample_users.map((user, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{user.name}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2">{user.total_sessions}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );



  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitor your DALScooter platform performance</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'trips', label: 'Trips', icon: TrendingUp },
            { id: 'feedbacks', label: 'Feedback', icon: MessagesSquare },
            { id: 'looker', label: 'Looker Studio', icon: ExternalLink }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {/* {activeTab === 'scooters' && <ScootersTab />} */}
      {activeTab === 'trips' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Trip Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${analytics.trips?.total_revenue || 0}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.trips?.revenue_breakdown?.completion_rate || 0}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${analytics.trips?.average_trip_price || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Trip Price</div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'feedbacks' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Feedback Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.feedbacks?.average_rating || 0}/5
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.feedbacks?.summary?.satisfaction_rate || 0}%
              </div>
              <div className="text-sm text-gray-600">Satisfaction Rate</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.feedbacks?.total_feedbacks || 0}
              </div>
              <div className="text-sm text-gray-600">Total Feedbacks</div>
            </div>
          </div>

          {/* Sentiment Distribution */}
          {analytics.feedbacks?.sentiment_distribution && (
            <div>
              <h4 className="font-medium mb-3">Sentiment Distribution</h4>
              <div className="space-y-3">
                {Object.entries(analytics.feedbacks.sentiment_distribution).map(([sentiment, data]) => (
                  <div key={sentiment} className="flex items-center justify-between">
                    <span className="capitalize font-medium">{sentiment}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            sentiment === 'positive' ? 'bg-green-500' : 
                            sentiment === 'negative' ? 'bg-red-500' : 
                            sentiment === 'neutral' ? 'bg-gray-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${data.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16">{data.count} ({data.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'looker' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Looker Studio Dashboard</h3>
                  <p className="text-sm text-gray-600">Advanced analytics and visualizations</p>
                </div>
                <button
                  onClick={() => window.open('https://lookerstudio.google.com/embed/reporting/4f3faa76-e4fd-4034-84d9-6e0168554ca4/page/IdLTF', '_blank')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <ExternalLink size={16} />
                  Open Full View
                </button>
              </div>
              <div className="relative">
                <iframe
                  src="https://lookerstudio.google.com/embed/reporting/4f3faa76-e4fd-4034-84d9-6e0168554ca4/page/IdLTF"
                  className="w-full h-[700px] border-0"
                  title="Looker Studio Analytics Dashboard"
                  allowFullScreen
                  sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
    </div>
      )}

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={fetchAllAnalytics}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          <Activity className="w-4 h-4" />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Last updated: {analytics.users?.last_updated ? new Date(analytics.users.last_updated).toLocaleString() : 'Never'}
        </p>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
};

export default AnalyticsDashboard;