import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; // Add this import
import axiosInstance from "../api/axiosInstance";
import { safeGeolocate } from "../utils/getGeoLocation";
import {
  Zap,
  MapPin,
  Clock,
  Battery,
  StopCircle,
  AlertCircle,
  MessagesSquare
} from "lucide-react";

export default function RideStatus() {
  const [trip, setTrip] = useState(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  
  const navigate = useNavigate(); // Add navigation hook
  const api = axiosInstance;
  const { authUser, token } = useAuth();
  
  console.log("authUser", authUser.name);

  useEffect(() => {
    if (!authUser) return;

    const fetch = async () => {
      try {
        const { data } = await api.get(`/trips/${authUser.sub}`);
        setTrip(data.find(t => t.status === "ongoing") || null);
      } catch (error) {
        console.error("Failed to fetch trip:", error);
      }
    };

    fetch();
    const id = setInterval(fetch, 5000);
    return () => clearInterval(id);
  }, [authUser, api]);

  // Update elapsed time every second
  useEffect(() => {
    if (!trip) return;

    const updateElapsed = () => {
      const mins = Math.round(
        (Date.now() - Date.parse(trip.start_time)) / 60000
      );
      setElapsed(mins);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [trip]);

  if (!trip) return null;

  async function endTrip() {
    setBusy(true);
    try {
      let coords = await safeGeolocate();
      if (!coords) {
        console.warn("No GPS – falling back to trip.start_location");
        coords = trip.start_location;
      }

      await api.post("/trip/end", {
        trip_id: trip.trip_id,
        end_location: coords,
        email: authUser.email
      });

      setTrip(null);
    } catch (err) {
      alert(err.message || "End-trip failed");
    } finally {
      setBusy(false);
    }
  }

  // Navigate to chat page
  const openChat = () => {
    navigate('/chat', { 
      state: { 
        tripId: trip.trip_id,
        customerId: authUser?.sub,
        customerName: authUser.name 
      }
    });
  };

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mx-auto max-w-md backdrop-blur-sm">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Active Ride
          </span>
        </div>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          #{trip.trip_id?.slice(-6)}
        </div>
      </div>

      {/* Trip Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Duration</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatTime(elapsed)}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Started</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {new Date(trip.start_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {trip.scooter_id && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-sm">Scooter</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 font-mono">
              #{trip.scooter_id.slice(0, 8)}
            </div>
          </div>
        )}

        {trip.metadata?.battery && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Battery className="w-4 h-4" />
              <span className="text-sm">Battery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-gray-900">
                {trip.metadata.battery}%
              </div>
              <div className={`w-2 h-2 rounded-full ${trip.metadata.battery > 50 ? 'bg-green-500' :
                trip.metadata.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* End Trip Button */}
        <button
          onClick={endTrip}
          disabled={busy}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${busy
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600 active:scale-95 shadow-lg hover:shadow-xl"
            }`}
        >
          {busy ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Ending Trip...</span>
            </>
          ) : (
            <>
              <StopCircle className="w-5 h-5" />
              End Trip
            </>
          )}
        </button>

        {/* Chat Button */}
        <button
          onClick={openChat}
          className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
        >
          <MessagesSquare className="w-5 h-5" />
          Chat with Support
        </button>
      </div>

      {/* Safety Notice */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Safety Reminder</span>
        </div>
        <p className="text-xs text-amber-600 mt-1">
          Please park safely and responsibly in designated areas
        </p>
      </div>
    </div>
  );
}