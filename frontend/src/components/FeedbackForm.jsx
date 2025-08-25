import React, { useState } from 'react';
import { Star, Send, MessagesSquare, Loader } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const FeedbackForm = ({ tripId, scooterType, onSuccess }) => {
  const { authUser } = useAuth();
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    scooter_type: scooterType || 'gyroscooter'
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.rating) {
      toast.error('Please provide a rating');
      return;
    }
    
    if (!formData.comment.trim()) {
      toast.error('Please provide a comment');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        user_id: authUser.sub,
        trip_id: tripId,
        scooter_type: formData.scooter_type,
        rating: formData.rating,
        comment: formData.comment.trim()
      };

      console.log('Submitting feedback payload:', payload); 

      const response = await axiosInstance.post('/feedbacks', payload);
      
      console.log('Feedback response:', response.data); 
      
      toast.success('Feedback submitted successfully!');
      
      // Reset form
      setFormData({
        rating: 0,
        comment: '',
        scooter_type: scooterType || 'gyroscooter'
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      console.error('Error response:', error.response?.data); 
      
      const errorMessage = error.response?.data?.error || 'Failed to submit feedback';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return texts[rating] || '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <MessagesSquare className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Share Your Experience</h3>
          <p className="text-sm text-gray-600">Help us improve our service</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scooter Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scooter Type
          </label>
          <select
            value={formData.scooter_type}
            onChange={(e) => setFormData(prev => ({ ...prev, scooter_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="gyroscooter">Gyroscooter</option>
            <option value="eBike">eBike</option>
            <option value="segway">Segway</option>
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-colors"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || formData.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {formData.rating > 0 && (
            <p className="text-sm text-gray-600">{getRatingText(formData.rating)}</p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Tell us about your experience..."
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.comment.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.rating || !formData.comment.trim()}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            isSubmitting || !formData.rating || !formData.comment.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-lg hover:shadow-xl'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Feedback
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;