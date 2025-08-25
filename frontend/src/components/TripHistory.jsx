import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import Sidebar from "./Sidebar";
import {
  Calendar,
  Clock,
  DollarSign,
  Car,
  MessagesSquare,
  CheckCircle,
  HelpCircle,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import FeedbackForm from "./FeedbackForm";

export default function TripHistory() {
  const [rows, setRows] = useState([]);
  const api = axiosInstance;
  const { authUser } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authUser) return;
    api.get(`/trips/${authUser.sub}`).then((r) => {
      const trips = r.data;
      trips.sort((b,a) => new Date(a.start_time) - new Date(b.start_time));
      setRows(trips)
    });
  },[]);
  
  // New state for feedback modal and tracking
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState(new Set()); // Track which trips have feedback

  useEffect(() => {
    if (!authUser) return;
    api.get(`/trips/${authUser.sub}`).then(r => setRows(r.data));
    
    // Load existing feedbacks to check which trips already have feedback
    loadExistingFeedbacks();
  }, [authUser, api]);

  // Load existing feedbacks to track which trips already have feedback
  const loadExistingFeedbacks = async () => {
    try {
      // Get feedbacks for this user (you might need to modify your API to filter by user)
      const response = await api.get('/feedbacks');
      const userFeedbacks = response.data.feedbacks.filter(f => f.user_id === authUser.sub);
      const tripIds = new Set(userFeedbacks.map(f => f.trip_id));
      setSubmittedFeedbacks(tripIds);
    } catch (error) {
      console.error('Error loading existing feedbacks:', error);
    }
  };

  // helper to turn ISO strings with microseconds into a valid JS Date
const toDate = (isoString) => {
  // 1) truncate fraction to 3 digits (milliseconds)
  // 2) ensure there's a 'Z' at the end so JS treats it as UTC
  const normalized = isoString
    // e.g. "2025-07-13T20:57:45.594010" → "2025-07-13T20:57:45.594"
    .replace(/(\.\d{3})\d+/, '$1')
    // if it doesn't already end in Z or an offset, append Z
    .replace(/(?<!Z|[+\-]\d{2}:\d{2})$/, 'Z');

    return new Date(normalized);
  };

  const formatDate = (dateString) => {
    const date = toDate(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = toDate(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mins = (r) => {
    const start = toDate(r.start_time).getTime();
    const end = toDate(r.end_time).getTime();
    return Math.round((end - start) / 60000);
  };

  const completedTrips = rows.filter((r) => r.status === "completed");
  const totalSpent = completedTrips.reduce((sum, trip) => sum + trip.price, 0);
  const totalTrips = completedTrips.length;

  // Function to open feedback modal
  const openFeedbackModal = (trip) => {
    setSelectedTrip(trip);
    setShowFeedbackModal(true);
  };

  // Function to close feedback modal
  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedTrip(null);
  };

  // Function to handle successful feedback submission
  const handleFeedbackSuccess = (feedbackData) => {
    // Add the trip ID to submitted feedbacks set
    setSubmittedFeedbacks(prev => new Set([...prev, selectedTrip.trip_id]));
    closeFeedbackModal();
  };

  // Check if feedback has been submitted for a trip
  const hasFeedback = (tripId) => {
    return submittedFeedbacks.has(tripId);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 pt-20 lg:pt-10 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trip History
            </h1>
            <p className="text-gray-600">
              View your completed rides and travel summary
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Trips
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalTrips}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Spent
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Avg. Duration
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalTrips > 0
                      ? Math.round(
                          completedTrips.reduce(
                            (sum, trip) => sum + mins(trip),
                            0
                          ) / totalTrips
                        )
                      : 0}{" "}
                    min
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trip History Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Trips
              </h2>
            </div>

            {completedTrips.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No trips yet
                </h3>
                <p className="text-gray-500">
                  Your completed trips will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Start Date & Time</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>End Date & Time</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Duration</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Price</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <MessagesSquare className="w-4 h-4" />
                          <span>Feedback</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4" />
                          <span>Help</span>
                       </div>
                       </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {completedTrips.map((trip) => (
                      <tr
                        key={trip.trip_id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {formatDate(trip.start_time)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(trip.start_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {formatDate(trip.end_time)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(trip.end_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {mins(trip)} min
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            ${trip.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                         
                          {hasFeedback(trip.trip_id) ? (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-lg">
                              <CheckCircle className="w-4 h-4" />
                              Feedback Submitted
                            </div>
                          ) : (
                            <button
                              onClick={() => openFeedbackModal(trip)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <MessagesSquare className="w-4 h-4" />
                              Leave Feedback
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <button
                            onClick={() => {
                              navigate("/chat", {
                                state: {
                                  tripId: trip.trip_id,
                                  customerId: authUser?.sub,
                                  customerName: authUser.name,
                                },
                              });
                            }}
                            className="w-full py-3 px-4 bg-500 text-blue rounded-xl hover:bg-600 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                          >
                            <MessagesSquare className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Modal */}
        {showFeedbackModal && selectedTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Leave Feedback</h3>
                  <p className="text-sm text-gray-600">Trip on {formatDate(selectedTrip.start_time)}</p>
                </div>
                <button
                  onClick={closeFeedbackModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <FeedbackForm
                  tripId={selectedTrip.trip_id}
                  scooterType="gyroscooter"
                  onSuccess={handleFeedbackSuccess}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}