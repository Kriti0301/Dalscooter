// FranchiseChatPage.js - Enhanced main page
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { MessagesSquare, CheckCircle, Clock, User, Search, Filter } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const FranchiseChatPage = () => {
  const [pendingChats, setPendingChats] = useState([]);
  const [acceptedChats, setAcceptedChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { authUser } = useAuth();
  const navigate = useNavigate();

  const FRANCHISE_ID = authUser?.sub;

  // Fetch pending chats
  useEffect(() => {
    const fetchPendingChats = () => {
      axiosInstance
        .get(`${process.env.REACT_APP_BACKEND_BASE_URL}/messages/get-pending-requests`)
        .then((response) => {
          const pendingOnly = response.data.filter((chat) => chat.status === "pending");
          console.log(pendingOnly);
          setPendingChats(pendingOnly);
        })
        .catch((err) => console.error("Error fetching pending requests:", err));
    };

    fetchPendingChats();
    const interval = setInterval(fetchPendingChats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAcceptedChats = () => {
    axiosInstance
      .get(`${process.env.REACT_APP_BACKEND_BASE_URL}/messages/get-accepted-chats`, {
        params: { franchise_id: FRANCHISE_ID },
      })
      .then((response) => setAcceptedChats(response.data))
      .catch((err) => console.error("Error fetching accepted chats:", err));
  };

  useEffect(() => {
    fetchAcceptedChats();
  }, []);

  const handleAccept = async (chat) => {
    try {
      const response = await axiosInstance.post(
        `${process.env.REACT_APP_BACKEND_BASE_URL}/messages/accept-request`,
        {
          trip_id: chat.trip_id,
          created_at: chat.created_at,
          franchise_id: FRANCHISE_ID,
        }
      );

      if (response.status === 200) {
        setPendingChats((prev) => prev.filter((c) => c.trip_id !== chat.trip_id));
        fetchAcceptedChats();
      } else {
        console.error("Accept failed:", response.data);
        alert("Failed to accept chat.");
      }
    } catch (err) {
      console.error("Error accepting chat:", err);
      alert("Error while accepting chat.");
    }
  };

  const openChat = (chat) => {
    navigate('/franchise-chat-conversation', {
      state: {
        tripId: chat.trip_id,
        franchiseId: FRANCHISE_ID,
        customerName: chat.customer_name || chat.customer_id,
        customerId: chat.customer_id
      }
    });
  };

  const formatTime = (timestamp) => {
    const utcDateStr = timestamp.endsWith("Z") ? timestamp : timestamp + "Z";

    return new Date(utcDateStr).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: "America/Halifax"
    });
  };

  const filteredAcceptedChats = acceptedChats.filter(chat => {
    const matchesSearch = chat.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.customer_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat Management</h1>
          <p className="text-gray-600">Manage customer support conversations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Requests */}
          <section className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Pending Requests</h2>
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    {pendingChats.length}
                  </div>
                </div>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {pendingChats.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingChats.map((chat) => (
                      <div key={chat.trip_id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-700" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{chat.customer_name || chat.customer_id}</p>
                              <p className="text-xs text-gray-500">Trip #{chat.trip_id?.slice(-6)}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{formatTime(chat.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{chat.message_preview || chat.message}</p>
                        <button
                          onClick={() => handleAccept(chat)}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept Chat
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Active Chats */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Active Chats</h2>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    {acceptedChats.length}
                  </div>
                </div>
                
                {/* Search and Filter */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                </div>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {filteredAcceptedChats.length === 0 ? (
                  <div className="text-center py-8">
                    <MessagesSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No active chats</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAcceptedChats.map((chat) => (
                      <div
                        key={chat.trip_id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() => openChat(chat)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{chat.customer_name || chat.customer_id}</p>
                              <p className="text-sm text-gray-500">Trip #{chat.trip_id?.slice(-6)}</p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{chat.message_preview || chat.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{formatTime(chat.accepted_at || chat.created_at)}</span>
                            <MessagesSquare className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

// FranchiseChatConversation.js - Dedicated chat page

export default FranchiseChatPage;