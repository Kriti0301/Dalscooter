import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LogOut,
  Home,
  Menu,
  X,
  Clock,
  MessagesSquare,
  Clock1,
  User2,
  Bike,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRole } from "../utils/CheckRoles";

const Sidebar = ({ name }) => {
  const { logout, authUser, token } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userFirstName, setUserFirstName] = useState(authUser?.name);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Get user role for conditional navigation
  const userRole = token ? getRole(token) : null;
  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: "Home", icon: <Home size={20} />, path: `/${userRole}/dashboard` },
      { name: "History", icon: <Clock size={20} />, path: "/history" }
    ];



    if (userRole === "Franchise") {
      baseItems.pop(
            { name: "History", icon: <Clock size={20} />, path: "/history" }
      );

      baseItems.push(
        { name: "Scooters", icon: <Bike size={20} />, path: "/franchise/scooters" }
      );
      baseItems.push(
        { name: "Chat Requests", icon: <MessagesSquare size={20} />, path: "/franchise/chat-requests" }
      );
      baseItems.push(
        { name: "Analytics", icon: <TrendingUp size={20} />, path: "/franchise/analytics" }
      );
    }
    baseItems.push({ name: "Feedback", icon: <BarChart3 size={20} />, path: `/${userRole}/feedback` });

    return baseItems;
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40">
        <div className="flex items-center justify-between p-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Dal Scooter Title */}
          <h1 className="text-xl font-bold text-gray-800">
            <span className="text-blue-600">DAL</span>Scooter
          </h1>

          {/* User Role Badge */}
          {userRole && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              userRole === "Franchise" 
                ? "bg-purple-100 text-purple-800" 
                : "bg-blue-100 text-blue-800"
            }`}>
              {userRole}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white shadow-lg min-h-screen p-6 flex flex-col justify-between fixed lg:static transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
      >
        <div>
          {/* Logo/Brand Section - Hidden on mobile (shown in top bar) */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              <span className="text-blue-600">DAL</span>Scooter
            </h1>
            <p className="text-sm text-gray-600 mt-1">Fleet Management</p>
          </div>

          {/* User Profile Section */}
          {authUser && userFirstName && (
            <div className="flex items-center space-x-3 p-3 rounded-lg mb-6 bg-gray-50">
              <img
                src="https://img.freepik.com/premium-vector/man-avatar-profile-picture-isolated-background-avatar-profile-picture-man_1293239-4866.jpg?w=1480"
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold truncate">{userFirstName}</p>
                {userRole && (
                  <p className={`text-xs font-medium ${
                    userRole === "Franchise" ? "text-purple-600" : "text-blue-600"
                  }`}>
                    {userRole}
                  </p>
                )}
              </div>
            </div>
          )}

          Navigation
          <nav className="space-y-2">
            {getNavigationItems().map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)} // Close sidebar on mobile when a link is clicked
                className={({ isActive }) =>
                  `flex items-center space-x-3 text-gray-700 p-3 rounded-lg w-full text-left transition-all duration-200 ${
                    isActive 
                      ? "bg-blue-100 text-blue-600 border-r-2 border-blue-600" 
                      : "hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
            {/* {getRole(token)?.toLowerCase() == "franchise" && (
              <NavLink
                key= {"/franchise/chat-requests"}
                to={"/franchise/chat-requests"}
                onClick={() => setIsSidebarOpen(false)} // Close sidebar on mobile when a link is clicked
                className={({ isActive }) =>
                  `flex items-center space-x-3 text-gray-700 p-3 rounded-lg w-full text-left transition ${
                    isActive ? "bg-blue-100 text-blue-600" : "hover:bg-blue-50"
                  }`
                }
              >
                <User2 size={20} />
                <span>Chat Requests</span>
              </NavLink>
            )} */}
          </nav>

          {/* Analytics Quick Stats - Only for Franchise
          {userRole === "Franchise" && (
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Stats</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Scooters</span>
                  <span className="font-medium text-green-600">•••</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Today's Trips</span>
                  <span className="font-medium text-blue-600">•••</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-medium text-yellow-600">•••</span>
                </div>
              </div>
              <NavLink
                to="/analytics"
                className="block mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setIsSidebarOpen(false)}
              >
                View Details →
              </NavLink>
            </div>
          )} */}

          {/* Help Section */}
          {/* <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Need Help?</h3>
            <p className="text-xs text-gray-600 mb-3">
              Check our help center for guides and support.
            </p>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </button>
          </div> */}
        </div>

        {/* Bottom Section */}
        <div className="space-y-3">
          {/* System Status */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-700 font-medium">System Online</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="flex items-center space-x-3 text-red-600 hover:bg-red-50 p-3 rounded-lg w-full text-left transition-all duration-200 border border-red-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        ></div>
      )}
    </>
  );
};

export default Sidebar;
