import React, { useState } from "react";
import { Map, List, User, BarChart3, TrendingUp, Activity, RefreshCw, AlertCircle } from "lucide-react";

import Sidebar from "../components/Sidebar";
import FranchiseMap from "../components/FranchiseMap";
import { useAuth } from "../context/AuthContext";
import ScooterListDashboard from "../components/ScooterListDashboard";

export const FranchiseScooterManager = () => {
  const { authUser } = useAuth();
  const [view, setView] = useState("map"); //  | "list" | "map" 
  
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
            </div>
            
            {/* Enhanced View Toggle */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    view === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Fleet
                </button>
                <button
                  onClick={() => setView("map")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    view === "map"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Map className="w-4 h-4" />
                  Map
                </button>
               
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="h-full">
            {view === "list" ? (
              <div className="p-6">
                <ScooterListDashboard />
              </div>
            ) : view === "map" ? (
              <div className="h-full">
                <FranchiseMap />
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FranchiseScooterManager;