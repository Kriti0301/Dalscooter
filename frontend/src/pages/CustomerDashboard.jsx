import React from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import MapView from "../components/MapView";
import RideStatus from "../components/RideStatus";

export const CustomerDashboard = () => {
  const { authUser } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 pt-20 lg:pt-0 flex flex-col relative">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {authUser.name}! 🛴
              </h1>
              <p className="text-gray-600 mt-1">Find and ride available scooters nearby</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ● Online
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapView />
          {/* Ride Status - positioned as overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <RideStatus />
          </div>
        </div>
      </div>
    </div>
  );
};