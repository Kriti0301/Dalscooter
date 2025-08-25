import React, { useEffect, useState } from 'react';
import { Star, Filter, Search, Calendar, Zap, TrendingUp, Users, MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import { feedbackService } from '../api/feedbackService';

export default function CustomerReviews() {
  // Sample data based on the provided API response structure
  const [feedbacks,setFeedbacks] = useState([
    {
      feedback_id: "fb_85a08d7e",
      user_id: "e4285428-0081-70a1-aeb6-4b3a00767f11",
      trip_id: "8cbd4019-851f-4bad-9d17-f0446b44de46",
      scooter_type: "gyroscooter",
      rating: 5,
      comment: "This is best scooter.",
      sentiment: "positive",
      sentiment_score: 0.9,
      created_at: "2025-08-01T04:13:05.561178Z",
      updated_at: "2025-08-01T04:13:05.561178Z"
    },
    {
      feedback_id: "fb_92b15c3f",
      user_id: "a1234567-1234-5678-9abc-123456789def",
      trip_id: "7abc3018-741e-3cad-8c16-e0335b33cd35",
      scooter_type: "electric",
      rating: 4,
      comment: "Great experience overall. The scooter was smooth and the battery lasted the entire trip. Would definitely use again!",
      sentiment: "positive",
      sentiment_score: 0.8,
      created_at: "2025-07-31T15:22:18.123456Z",
      updated_at: "2025-07-31T15:22:18.123456Z"
    },
    {
      feedback_id: "fb_73c26d4g",
      user_id: "b2345678-2345-6789-abcd-23456789efab",
      trip_id: "6def2017-630d-2bad-7b15-d0224a22bc24",
      scooter_type: "gyroscooter",
      rating: 3,
      comment: "The scooter was okay but took a while to find. The app could be more accurate with location.",
      sentiment: "neutral",
      sentiment_score: 0.5,
      created_at: "2025-07-30T09:45:32.789012Z",
      updated_at: "2025-07-30T09:45:32.789012Z"
    },
    {
      feedback_id: "fb_64d37e5h",
      user_id: "c3456789-3456-789a-bcde-3456789fabcd",
      trip_id: "5ghi1016-529c-1bad-6a14-c0113900ab13",
      scooter_type: "electric",
      rating: 5,
      comment: "Absolutely love DalScooter! Fast, reliable, and eco-friendly. The web platform is so easy to use.",
      sentiment: "positive",
      sentiment_score: 0.95,
      created_at: "2025-07-29T18:30:45.345678Z",
      updated_at: "2025-07-29T18:30:45.345678Z"
    },
    {
      feedback_id: "fb_55e48f6i",
      user_id: "d4567890-4567-890a-bcde-456789abcdef",
      trip_id: "4jkl0015-418b-0bad-5913-b0002800za02",
      scooter_type: "gyroscooter",
      rating: 2,
      comment: "Had issues with the scooter stopping mid-trip. Customer service was helpful though.",
      sentiment: "negative",
      sentiment_score: 0.3,
      created_at: "2025-07-28T12:15:22.567890Z",
      updated_at: "2025-07-28T12:15:22.567890Z"
    }
  ]);

  useEffect(()=>{
    const fetchFeedback = async () => {
        try {
          const data = await feedbackService.getPublicFeedback();
          setFeedbacks(data?.feedbacks);
        } catch (err) {
        } finally {
        }
      };

      fetchFeedback();
  },[])
  const [filterRating, setFilterRating] = useState('all');
  const [filterScooterType, setFilterScooterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Statistics
  const totalReviews = feedbacks.length;
  const averageRating = (feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / totalReviews).toFixed(1);
  const positiveReviews = feedbacks.filter(f => f.sentiment === 'positive').length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: feedbacks.filter(f => f.rating === rating).length,
    percentage: (feedbacks.filter(f => f.rating === rating).length / totalReviews * 100).toFixed(0)
  }));

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesRating = filterRating === 'all' || feedback.rating.toString() === filterRating;
    const matchesScooterType = filterScooterType === 'all' || feedback.scooter_type === filterScooterType;
    const matchesSearch = feedback.comment.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRating && matchesScooterType && matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
                <p className="text-gray-600 mt-1">Real feedback from our DalScooter community</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{averageRating}</div>
                <div className="text-sm text-gray-500">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalReviews}</div>
                <div className="text-sm text-gray-500">Total Reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Statistics and Filters */}
          <div className="lg:col-span-1">
            {/* Overview Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-900">{totalReviews}</div>
                    <div className="text-sm text-gray-500">Total Reviews</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-900">{averageRating}/5</div>
                    <div className="text-sm text-gray-500">Average Rating</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <ThumbsUp className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-900">{positiveReviews}</div>
                    <div className="text-sm text-gray-500">Positive Reviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-8">{rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-2" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-12">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <select 
                    value={filterRating} 
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scooter Type</label>
                  <select 
                    value={filterScooterType} 
                    onChange={(e) => setFilterScooterType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="electric">Electric</option>
                    <option value="gyroscooter">Gyroscooter</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Reviews List */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
              {filteredFeedbacks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
                  <p className="text-gray-600">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                filteredFeedbacks.map((feedback) => (
                  <div key={feedback.feedback_id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {renderStars(feedback.rating)}
                            <span className="text-sm font-medium text-gray-900">({feedback.rating}/5)</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            User ID: {feedback?.user_id}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(feedback.sentiment)}`}>
                          <span className="mr-1">{getSentimentIcon(feedback.sentiment)}</span>
                          {feedback.sentiment}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(feedback.created_date)}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-4">
                      "{feedback.comment}"
                    </p>

                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">Trip ID:</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {feedback.trip_id}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">Scooter Type:</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                            {feedback.scooter_type}
                          </span>
                        </div>
                        {/* <div className="flex items-center">
                          <span className="text-gray-500 mr-2">Sentiment Score:</span>
                          <span className="font-semibold text-gray-900">
                            {(feedback.sentiment_score * 100).toFixed(0)}%
                          </span>
                        </div> */}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load More Button (placeholder) */}
            {filteredFeedbacks.length > 0 && (
              <div className="text-center mt-8">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Load More Reviews
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}