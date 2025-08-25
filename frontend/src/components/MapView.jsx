import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr";
import axiosInstance from "../api/axiosInstance";
import scooterImg from "../assets/scooter.ico";
import { 
  MapPin, 
  Zap, 
  Battery, 
  Info, 
  X,
  Target,
  Star,
  ChevronLeft,
  User,
  MessagesSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const statusInfo = {
  available: {
    color: "#16a34a",
    bgColor: "bg-green-500",
    label: "Available",
    icon: "🟢",
    description: "Ready to ride"
  },
  maintenance: {
    color: "#facc15", 
    bgColor: "bg-yellow-400",
    label: "Maintenance",
    icon: "🟡",
    description: "Under maintenance"
  },
  in_use: {
    color: "#ef4444",
    bgColor: "bg-red-500", 
    label: "In Use",
    icon: "🔴",
    description: "Currently rented"
  }
};

export default function MapView() {
  const mapRef = useRef(null);
  const [selectedScooter, setSelectedScooter] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scooterFeedbacks, setScooterFeedbacks] = useState([]);
  const [scooterStats, setScooterStats] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const {authUser} = useAuth();
  const fetcher = url => axiosInstance.get(url).then(r => r.data);
  const { data: scooters = [], isLoading } = useSWR(
    "/scooters?status=available",
    fetcher,
    { refreshInterval: 5000 }
  );

  // Calculate stats for available scooters
  const stats = {
    available: scooters.length,
    nearby: scooters.filter(s => {
      if (!userLocation) return false;
      const distance = calculateDistance(
        userLocation[1], userLocation[0],
        s.lat, s.long
      );
      return distance <= 0.5; // Within 500m
    }).length
  };

  // Calculate distance between two points
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Fetch scooter-specific feedback using the new API endpoint
  const fetchScooterFeedback = async (scooterId) => {
    setFeedbackLoading(true);
    try {
      const response = await axiosInstance.get(`/scooters/${scooterId}/feedbacks`);
      const data = response.data;
      
      setScooterFeedbacks(data.feedbacks);
      setScooterStats({
        average_rating: data.average_rating,
        count: data.count,
        rating_distribution: data.rating_distribution,
        sentiment_distribution: data.sentiment_distribution,
        total_trips: data.total_trips
      });
    } catch (error) {
      console.error('Error fetching scooter feedback:', error);
      // Fallback to scooter type-based feedback if specific scooter endpoint fails
      await fetchScooterTypeFeedback(scooterId);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Fallback method: fetch feedback by scooter type
  const fetchScooterTypeFeedback = async (scooterId) => {
    try {
      const scooter = scooters.find(s => s.scooter_id === scooterId);
      if (!scooter) return;

      // Determine scooter type (you might need to add this to your scooter metadata)
      const scooterType = scooter.metadata?.type || 'gyroscooter'; // Default fallback
      
      const response = await axiosInstance.get(`/feedbacks?scooter_type=${scooterType}&limit=20`);
      const allFeedbacks = response.data.feedbacks;
      
      setScooterFeedbacks(allFeedbacks);
      
      if (allFeedbacks.length > 0) {
        const avgRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length;
        const ratingDist = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        const sentimentDist = {};
        
        allFeedbacks.forEach(f => {
          ratingDist[f.rating.toString()]++;
          sentimentDist[f.sentiment] = (sentimentDist[f.sentiment] || 0) + 1;
        });
        
        setScooterStats({
          average_rating: avgRating,
          count: allFeedbacks.length,
          rating_distribution: ratingDist,
          sentiment_distribution: sentimentDist,
          total_trips: allFeedbacks.length // Approximate
        });
      } else {
        setScooterStats({
          average_rating: 0,
          count: 0,
          rating_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
          sentiment_distribution: {},
          total_trips: 0
        });
      }
    } catch (error) {
      console.error('Error fetching scooter type feedback:', error);
      setScooterStats({
        average_rating: 0,
        count: 0,
        rating_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        sentiment_distribution: {},
        total_trips: 0
      });
      setScooterFeedbacks([]);
    }
  };

  /* Initialize map */
  useEffect(() => {
    if (!mapRef.current) {
      const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-63.5752, 44.6488], // Halifax coordinates
        zoom: 13,
      });
      mapRef.current = map;

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add fullscreen control
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const coords = [pos.coords.longitude, pos.coords.latitude];
            setUserLocation(coords);
            map.flyTo({
              center: coords,
              zoom: 15,
              speed: 1.2,
            });
          },
          () => console.warn("GPS denied — keeping default centre")
        );
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /* Draw/redraw scooter markers */
  useEffect(() => {
    if (!mapRef.current || !scooters.length) return;

    const markers = scooters
      .map(s => {
        const lat = +s.lat, lng = +s.long;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        /* Build enhanced pin */
        const pin = document.createElement("div");
        const statusConfig = statusInfo[s.status] || statusInfo.available;
        
        Object.assign(pin.style, {
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          border: "3px solid #fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          background: statusConfig.color,
          transition: "all 0.2s ease",
          transform: selectedScooter?.scooter_id === s.scooter_id ? "scale(1.2)" : "scale(1)",
          animation: s.status === "available" ? "pulse 2s infinite" : "none"
        });

        /* Inner img */
        const img = document.createElement("img");
        img.src = scooterImg;
        img.alt = "Scooter";
        img.style.width = "28px";
        img.style.height = "28px";
        img.style.userSelect = "none";
        img.style.filter = "brightness(0) invert(1)";
        pin.appendChild(img);

        pin.onclick = e => {
          e.stopPropagation();
          setSelectedScooter(s);
          setShowFeedback(false); // Reset feedback view when selecting new scooter
          fetchScooterFeedback(s.scooter_id);
        };

        return new mapboxgl.Marker(pin)
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      })
      .filter(Boolean);

    return () => markers.forEach(m => m.remove());
  }, [scooters, selectedScooter, userLocation]);

  const findNearestScooter = () => {
    if (!userLocation || !scooters.length) {
      alert("Location not available or no scooters found");
      return;
    }

    let nearest = null;
    let minDistance = Infinity;

    scooters.forEach(scooter => {
      const distance = calculateDistance(
        userLocation[1], userLocation[0],
        scooter.lat, scooter.long
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = scooter;
      }
    });

    if (nearest && mapRef.current) {
      mapRef.current.flyTo({
        center: [nearest.long, nearest.lat],
        zoom: 17,
        speed: 1.2,
      });
      setSelectedScooter(nearest);
      setShowFeedback(false);
      fetchScooterFeedback(nearest.scooter_id);
    }
  };

  async function startTrip(scooter) {
    if (!authUser) return window.location.replace('/'); 
    setBusy(true);
    try {
      await axiosInstance.post("/trip/start", {
        scooter_id: scooter.scooter_id,
        user_id: authUser.sub,
        start_location: { lat: scooter.lat, long: scooter.long },
        email: authUser.email
      });
      window.dispatchEvent(new Event("trip-started"));
      setSelectedScooter(null);
      setShowFeedback(false);
    } catch (e) {
      alert("Could not start trip");
    } finally {
      setBusy(false);
    }
  }

  const renderStars = (rating, size = "w-4 h-4") => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const getSentimentEmoji = (sentiment) => {
    const emojis = {
      positive: '😊',
      negative: '😞',
      neutral: '😐',
      mixed: '🤔'
    };
    return emojis[sentiment] || '😐';
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: 'text-green-600',
      negative: 'text-red-600',
      neutral: 'text-gray-600',
      mixed: 'text-purple-600'
    };
    return colors[sentiment] || 'text-gray-600';
  };

  return (
    <div className="relative w-full h-full">
      {/* Add custom CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
          100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }
      `}</style>

      {/* Map Container */}
      <div id="map" className="w-full h-full" />

      {/* Top Control Panel */}
      <div className="absolute top-4 left-4 z-10 space-y-3">
        {/* Stats Panel */}
        {showInfo && (
          <div className="bg-white rounded-lg shadow-lg p-4 min-w-64">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                Available Scooters
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Total: {stats.available}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Nearby: {stats.nearby}</span>
              </div>
              {isLoading && (
                <div className="col-span-2 flex items-center gap-2 text-gray-500">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <Info className="w-4 h-4" />
            <span className="font-medium">How to ride</span>
          </div>
          <p className="text-green-600">Click on any green scooter to view ratings and start your ride</p>
        </div>
      </div>

      {/* Bottom Left Controls */}
      <div className="absolute bottom-4 left-4 z-10 space-y-2">
        <button
          onClick={findNearestScooter}
          className="bg-blue-600 text-white rounded-lg shadow-lg p-3 hover:bg-blue-700 transition-colors"
          title="Find nearest scooter"
        >
          <Target className="w-5 h-5" />
        </button>
      </div>

      {/* Enhanced Scooter Details Panel */}
      {selectedScooter && !showFeedback && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 min-w-80 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Selected Scooter</h3>
            <button
              onClick={() => setSelectedScooter(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">ID:</span>
              <span className="text-sm text-gray-600 font-mono">#{selectedScooter.scooter_id.slice(0, 8)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusInfo[selectedScooter.status].bgColor} text-white`}>
                {statusInfo[selectedScooter.status].icon} {statusInfo[selectedScooter.status].label}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-gray-600" />
              <span className="text-sm">{selectedScooter.metadata?.battery || selectedScooter.battery || 'N/A'}%</span>
              <div className={`w-2 h-2 rounded-full ${
                (selectedScooter.metadata?.battery || selectedScooter.battery) > 50 ? 'bg-green-500' : 
                (selectedScooter.metadata?.battery || selectedScooter.battery) > 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            </div>

            {/* Enhanced Rating Section */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Customer Rating:</span>
                {feedbackLoading ? (
                  <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  scooterStats && (
                    <button
                      onClick={() => setShowFeedback(true)}
                      className="flex items-center gap-1 hover:bg-gray-50 p-1 rounded transition-colors"
                    >
                      {renderStars(scooterStats.average_rating)}
                      <span className="text-sm text-gray-600 ml-1">
                        {scooterStats.average_rating.toFixed(1)} ({scooterStats.count})
                      </span>
                    </button>
                  )
                )}
              </div>
              
              {/* Rating Distribution Preview */}
              {scooterStats && scooterStats.count > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-1 text-xs">
                    {Object.entries(scooterStats.rating_distribution).reverse().map(([rating, count]) => (
                      <div key={rating} className="flex items-center gap-1">
                        <span>{rating}★</span>
                        <div className="w-8 bg-gray-200 rounded h-1">
                          <div 
                            className="bg-yellow-400 h-1 rounded"
                            style={{ width: `${scooterStats.count > 0 ? (count / scooterStats.count) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {scooterStats && scooterStats.count > 0 && (
                <button
                  onClick={() => setShowFeedback(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <MessagesSquare className="w-3 h-3" />
                  View {scooterStats.count} review{scooterStats.count !== 1 ? 's' : ''} from {scooterStats.total_trips} trip{scooterStats.total_trips !== 1 ? 's' : ''}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm">{selectedScooter.lat?.toFixed(4)}, {selectedScooter.long?.toFixed(4)}</span>
            </div>

            {userLocation && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Distance:</span>
                <span className="text-sm text-blue-600">
                  {(calculateDistance(
                    userLocation[1], userLocation[0],
                    selectedScooter.lat, selectedScooter.long
                  ) * 1000).toFixed(0)}m away
                </span>
              </div>
            )}
            
            <div className="pt-2">
              <button
                onClick={() => startTrip(selectedScooter)}
                className={`w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 justify-center transition-colors
                ${busy ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 active:scale-95 shadow-lg hover:shadow-xl"
                }`}
             >
               {busy ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Starting Trip...</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
              Book This Scooter
          </>
        )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Feedback Modal */}
      {selectedScooter && showFeedback && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFeedback(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-semibold text-gray-900">Customer Reviews</h3>
            </div>
            <div className="flex items-center gap-1">
              {scooterStats && renderStars(scooterStats.average_rating)}
              <span className="text-sm text-gray-600 ml-1">
                {scooterStats?.average_rating.toFixed(1)} ({scooterStats?.count})
              </span>
            </div>
          </div>
          
          {/* Summary Stats */}
          {scooterStats && scooterStats.count > 0 && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-gray-700">Total Reviews:</span>
                  <span className="ml-1">{scooterStats.count}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Trips:</span>
                  <span className="ml-1">{scooterStats.total_trips}</span>
                </div>
              </div>
              {scooterStats.sentiment_distribution && (
                <div className="mt-2 flex gap-2 text-xs">
                  {Object.entries(scooterStats.sentiment_distribution).map(([sentiment, count]) => (
                    <span key={sentiment} className={`${getSentimentColor(sentiment)}`}>
                      {getSentimentEmoji(sentiment)} {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="overflow-y-auto max-h-48">
            {scooterFeedbacks.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {scooterFeedbacks.slice(0, 5).map((feedback) => (
                  <div key={feedback.feedback_id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {renderStars(feedback.rating, "w-3 h-3")}
                        <span className="text-sm font-medium">{feedback.rating}/5</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs ${getSentimentColor(feedback.sentiment)}`}>
                          {getSentimentEmoji(feedback.sentiment)}
                        </span>
                        <User className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {feedback.comment}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                
                {scooterFeedbacks.length > 5 && (
                  <div className="p-3 text-center text-xs text-gray-500 border-t">
                    Showing 5 of {scooterFeedbacks.length} reviews
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <MessagesSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No reviews yet for this scooter</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to leave feedback!</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => startTrip(selectedScooter)}
              className={`w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 justify-center transition-colors
              ${busy ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 active:scale-95 shadow-lg hover:shadow-xl"
              }`}
           >
             {busy ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Starting Trip...</span>
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
            Book This Scooter
        </>
      )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}