import React, { useState, useEffect } from 'react';
import { Star, Filter, Search, Calendar, Trash2, TrendingUp, MessagesSquare } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const FeedbackDisplay = ({ showAnalytics = false, allowDelete = false }) => {
  const { authUser } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    scooter_type: '',
    sentiment: '',
    rating: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    limit: 10,
    lastKey: null,
    hasMore: true
  });

  // Fetch feedbacks
  const fetchFeedbacks = async (reset = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.scooter_type) params.append('scooter_type', filters.scooter_type);
      if (filters.sentiment) params.append('sentiment', filters.sentiment);
      if (filters.rating) params.append('rating', filters.rating);
      if (pagination.limit) params.append('limit', pagination.limit);
      if (!reset && pagination.lastKey) params.append('last_key', pagination.lastKey);

      const response = await axiosInstance.get(`/feedbacks?${params.toString()}`);
      const data = response.data;

      if (reset) {
        setFeedbacks(data.feedbacks);
      } else {
        setFeedbacks(prev => [...prev, ...data.feedbacks]);
      }

      setPagination(prev => ({
        ...prev,
        lastKey: data.last_key,
        hasMore: data.has_more
      }));

    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    if (!showAnalytics) return;
    
    try {
      const response = await axiosInstance.get('/feedbacks/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    fetchFeedbacks(true);
    fetchAnalytics();
  }, [filters]);

  // Delete Feedback
  const deleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      console.log('Deleting feedback:', feedbackId);
      console.log('Current auth user:', authUser);
      console.log('Available token:', localStorage.getItem('token'));
      
      const response = await axiosInstance.delete(`/feedbacks/${feedbackId}`);
      console.log('Delete response:', response);
      
      setFeedbacks(prev => prev.filter(f => f.feedback_id !== feedbackId));
      toast.success('Feedback deleted successfully');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      console.error('Error response:', error.response);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete feedback';
      toast.error(`Delete failed: ${errorMessage}`);
    }
  };

  // Filter feedbacks by search term
  const filteredFeedbacks = feedbacks.filter(feedback =>
    !filters.search || 
    feedback.comment.toLowerCase().includes(filters.search.toLowerCase()) ||
    feedback.feedback_id.toLowerCase().includes(filters.search.toLowerCase())
  );

  const renderStars = (rating) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: 'bg-green-100 text-green-800',
      negative: 'bg-red-100 text-red-800',
      neutral: 'bg-gray-100 text-gray-800',
      mixed: 'bg-purple-100 text-purple-800'
    };
    return colors[sentiment] || 'bg-gray-100 text-gray-800';
  };

  const getSentimentEmoji = (sentiment) => {
    const emojis = {
      positive: '😊',
      negative: '😞',
      neutral: '😐',
      mixed: '🤔'
    };
    return emojis[sentiment] || '😐';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Analytics Section */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Feedback Analytics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{analytics.total_feedbacks}</div>
              <div className="text-sm text-blue-600">Total Feedbacks</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{analytics.average_rating}</div>
              <div className="text-sm text-green-600">Average Rating</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{analytics.average_sentiment_score}</div>
              <div className="text-sm text-purple-600">Sentiment Score</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{analytics.summary?.satisfaction_rate}%</div>
              <div className="text-sm text-orange-600">Satisfaction Rate</div>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Sentiment Distribution</h3>
              <div className="space-y-2">
                {Object.entries(analytics.sentiment_distribution).map(([sentiment, data]) => (
                  <div key={sentiment} className="flex items-center justify-between">
                    <span className="capitalize text-sm text-gray-600">
                      {getSentimentEmoji(sentiment)} {sentiment}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            sentiment === 'positive' ? 'bg-green-500' :
                            sentiment === 'negative' ? 'bg-red-500' :
                            sentiment === 'neutral' ? 'bg-gray-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${data.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{data.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Scooter Type Performance</h3>
              <div className="space-y-2">
                {Object.entries(analytics.scooter_type_stats).map(([type, stats]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="capitalize text-sm font-medium text-gray-700">{type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{stats.total_feedbacks} reviews</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{stats.average_rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search feedbacks..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filters.scooter_type}
            onChange={(e) => setFilters(prev => ({ ...prev, scooter_type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Scooter Types</option>
            <option value="gyroscooter">Gyroscooter</option>
            <option value="eBike">eBike</option>
            <option value="segway">Segway</option>
          </select>

          <select
            value={filters.sentiment}
            onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
            <option value="mixed">Mixed</option>
          </select>

          <select
            value={filters.rating}
            onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <button
            onClick={() => setFilters({ scooter_type: '', sentiment: '', rating: '', search: '' })}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Customer Feedbacks</h2>
            <span className="ml-auto text-sm text-gray-500">
              {filteredFeedbacks.length} feedback{filteredFeedbacks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.feedback_id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {renderStars(feedback.rating)}
                    <span className="font-medium text-gray-900">{feedback.rating}/5</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(feedback.sentiment)}`}>
                    {getSentimentEmoji(feedback.sentiment)} {feedback.sentiment}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {feedback.scooter_type}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </span>
                  {allowDelete && authUser?.sub === feedback.user_id && (
                    <button
                      onClick={() => deleteFeedback(feedback.feedback_id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete feedback"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-3">{feedback.comment}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Trip ID: {feedback.trip_id?.slice(0, 8)}...</span>
                <span>Sentiment Score: {(feedback.sentiment_score * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {pagination.hasMore && (
          <div className="p-6 border-t border-gray-200 text-center">
            <button
              onClick={() => fetchFeedbacks(false)}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredFeedbacks.length === 0 && !loading && (
          <div className="p-12 text-center">
            <MessagesSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedbacks found</h3>
            <p className="text-gray-500">
              {filters.search || filters.scooter_type || filters.sentiment || filters.rating
                ? 'Try adjusting your filters'
                : 'Be the first to leave feedback!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackDisplay;