import React from "react";
import Sidebar from "../components/Sidebar";
import FeedbackDisplay from "../components/FeedbackDisplay";
import { useAuth } from "../context/AuthContext";
import { getRole } from "../utils/CheckRoles";

const FeedbackPage = () => {
  const { authUser, token } = useAuth();
  const userRole = token ? getRole(token) : null;

  // Check if user is authenticated
  if (!authUser || !token) {
    return (
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />
        <main className="flex-1 pt-20 lg:pt-0 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Authentication Required</h2>
              <p className="text-red-600">Please log in to access feedback.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Get user permissions based on role
  // Both "Franchise" and "franchise" should have analytics access
  const showAnalytics = userRole === "Franchise" || userRole === "franchise" || 
                       authUser?.["custom:role"] === "franchise" ||
                       authUser?.["custom:role"] === "Franchise";

  // Allow deletion for authenticated users (both customers and franchise)
  const allowDelete = !!authUser;

  return (
    
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 pt-20 lg:pt-10 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {showAnalytics ? "Feedback Analytics" : "Customer Feedback"}
            </h1>
            <p className="text-gray-600">
              {showAnalytics 
                ? "Monitor customer satisfaction and service performance" 
                : "View customer experiences and leave your own feedback"}
            </p>
            

          </div>

          {/* Feedback Display Component */}
          <FeedbackDisplay 
            showAnalytics={showAnalytics} 
            allowDelete={allowDelete} 
          />
        </div>
      </main>
    </div>
  );
};

export default FeedbackPage;