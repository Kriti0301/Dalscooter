import React from "react";
import { Route, Routes } from "react-router-dom";
import { Roles } from "../constants/AccessConstants";
import PrivateRoute from "../components/PrivateRoute";
import { FranchiseDashboard } from "../pages/FranchiseDashboard";
import { CustomerDashboard } from "../pages/CustomerDashboard";
import TripHistory from "../components/TripHistory";
import ChatPageWrapper from "../pages/ChatWrapper";
import FranchiseChatConversation from "../pages/FranchiseChatConversation";
import FranchiseChatPage from "../pages/FranchiseChatPage";
import FeedbackPage from "../pages/FeedbackPage";
import AnalyticsDashboard from "../pages/AnalyticsDashboard";
import ScooterListDashboard from "../components/ScooterListDashboard";
import FranchiseMap from "../components/FranchiseMap";
import FranchiseScooterManager from "../pages/FranchiseScooterManager";
import FranchiseAnalytics from "../pages/FranchiseAnalytics";

const ProtectedRoutes = () => {
  return (
    <Routes>
      {/* User/Customer Routes */}
      <Route element={<PrivateRoute allowedRoles={[Roles.USER]} />}>
        <Route path="/user/dashboard" element={<CustomerDashboard />} />
        <Route path="/history" element={<TripHistory />} />
        <Route path="/chat" element={<ChatPageWrapper />} />

        <Route path="/user/feedback" element={<FeedbackPage />} />
      </Route>

      {/* Franchise Routes */}
      <Route element={<PrivateRoute allowedRoles={[Roles.FRANCHISE]} />}>
        <Route path="/franchise/dashboard" element={<FranchiseDashboard />} />
        {/* <Route path="/franchise/chat-requests" element={<FranchiseChatPage />} /> */}
        <Route path="/franchise/scooters" element={<FranchiseScooterManager />} />
        <Route path="/franchise/analytics" element={<FranchiseAnalytics />} />

        <Route path="/franchise/chat-requests" element={<FranchiseChatPage />} />
        <Route path="/franchise-chat-conversation" element={<FranchiseChatConversation />} />
        <Route path="/history" element={<TripHistory />} />
        <Route path="/franchise/feedback" element={<FeedbackPage />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/fleet" element={<ScooterListDashboard />} />
        <Route path="/map" element={<FranchiseMap />} />
      </Route>

      {/* Shared Routes - Accessible by both user types */}
      <Route element={<PrivateRoute allowedRoles={[Roles.USER, Roles.FRANCHISE]} />}>
        {/* Add any shared routes here if needed */}
      </Route>
    </Routes>
  );
};

export default ProtectedRoutes;