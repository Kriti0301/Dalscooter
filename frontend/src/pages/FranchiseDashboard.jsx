import React, { useState } from "react";
import { Map, List, User, BarChart3, TrendingUp, Activity, MessagesSquare } from "lucide-react";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import FeedbackDisplay from "../components/FeedbackDisplay";
import AnalyticsDashboard from "../pages/AnalyticsDashboard";
import { useAnalyticsSummary } from "../hooks/useAnalytics";
import { useNavigate } from "react-router-dom";

export const FranchiseDashboard = () => {
  const { authUser } = useAuth();
  const [view, setView] = useState("overview"); // "overview" | "list" | "map" | "feedback" | "analytics"
  const navigate = useNavigate();
  // Get analytics summary for the overview
  const { 
    data: analyticsSummary, 
    loading: analyticsLoading, 
    error: analyticsError,
    refresh: refreshAnalytics,
    lastUpdated 
  } = useAnalyticsSummary({ 
    autoRefresh: true, 
    refreshInterval: 300000 // 5 minutes
  });

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Welcome Section with Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">
              {analyticsSummary?.fleetUtilization || 0}% utilized
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analyticsSummary?.activeScooters || 0}
          </div>
          <div className="text-sm text-gray-600">Available Scooters</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${analyticsSummary?.fleetUtilization || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-blue-600 font-medium">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analyticsSummary?.totalTrips || 0}
          </div>
          <div className="text-sm text-gray-600">Total Trips</div>
          <div className="text-xs text-gray-500 mt-1">
            ${analyticsSummary?.totalRevenue || 0} revenue
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-purple-600 font-medium">
              {analyticsSummary?.satisfactionRate || 0}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analyticsSummary?.averageRating || 0}/5
          </div>
          <div className="text-sm text-gray-600">Customer Rating</div>
          <div className="text-xs text-gray-500 mt-1">
            {analyticsSummary?.totalFeedbacks || 0} reviews
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-orange-600 font-medium">Active</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analyticsSummary?.activeSessions || 0}
          </div>
          <div className="text-sm text-gray-600">User Sessions</div>
          <div className="text-xs text-gray-500 mt-1">
            {analyticsSummary?.totalUsers || 0} total users
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() =>navigate('/franchise/scooters')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <List className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-medium text-gray-900">Manage Fleet</div>
            <div className="text-sm text-gray-600">Add, edit, or remove scooters</div>
          </button>
          <button
            onClick={() =>navigate('/franchise/scooters')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <Map className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-medium text-gray-900">View Map</div>
            <div className="text-sm text-gray-600">See scooter locations</div>
          </button>
          <button
            onClick={() =>navigate('/franchise/analytics')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <TrendingUp className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-medium text-gray-900">View Analytics</div>
            <div className="text-sm text-gray-600">Detailed insights & reports</div>
          </button>
          <button
            onClick={() =>navigate('/franchise/feedback')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <BarChart3 className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-medium text-gray-900">View Feedback</div>
            <div className="text-sm text-gray-600">Detailed insights of Feedback</div>
          </button>
          <button
            onClick={() =>navigate('/franchise/chat-requests')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <MessagesSquare className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-medium text-gray-900">View Chat requests</div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 pt-20 lg:pt-0 flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            {/* Welcome Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {authUser.name}!
                  </h1>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">System Online</span>
                </div>
                {analyticsLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Updating...</span>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="h-full">
           
              <div className="p-6">
                <OverviewTab />
              </div>
           
          </div>
        </div>
      </main>
    </div>
  );
};

export default FranchiseDashboard;