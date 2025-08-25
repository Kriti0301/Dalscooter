import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import scooterImg from "../assets/scooter.ico";
import { 
  MapPin, 
  Plus, 
  Zap, 
  Battery, 
  Info, 
  Filter,
  X,
  Edit3,
  Trash2,
  Locate
} from "lucide-react";

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

export default function FranchiseMap() {
  const mapRef = useRef(null);
  const { authUser } = useAuth();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selectedScooter, setSelectedScooter] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // fetch scooters for *this* franchise
  const { data: scooters = [], mutate } = useSWR(
    authUser ? `/scooters` : null,
    url => axiosInstance.get(url).then(r => r.data)
  );

  // Filter scooters based on status
  const filteredScooters = scooters.filter(scooter => 
    statusFilter === "all" || scooter.status === statusFilter
  );

  // Calculate stats
  const stats = {
    total: scooters.length,
    available: scooters.filter(s => s.status === "available").length,
    in_use: scooters.filter(s => s.status === "in_use").length,
    maintenance: scooters.filter(s => s.status === "maintenance").length
  };

  /* initialise map once */
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-63.5752, 44.6488],
      zoom: 13,
    });
    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add fullscreen control
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    /* ---------- Zoom to user location ---------- */
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          map.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 15,
            speed: 1.2,
          });
        },
        () => console.warn("GPS denied — keeping default centre")
      );
    }

    /* click-to-add handler */
    map.on("click", e => {
      if (!authUser) return;
      setSelectedScooter(null); // Clear selection
      setForm({
        franchise_id: authUser.sub,
        lat: e.lngLat.lat.toFixed(5),
        long: e.lngLat.lng.toFixed(5),
        battery: 100,
        model: "",
        status: "available",
      });
    });

    return () => map.remove();
  }, [authUser]);

  useEffect(() => {
    if (!mapRef.current) return;

    const markers = filteredScooters
      .map(s => {
        const lat = +s.lat, lng = +s.long;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        /* ---------- build enhanced pin ---------- */
        const pin = document.createElement("div");
        const statusConfig = statusInfo[s.status];
        
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
          transform: selectedScooter?.scooter_id === s.scooter_id ? "scale(1.2)" : "scale(1)"
        });

        /* inner img */
        const img = document.createElement("img");
        img.src = scooterImg;
        img.alt = "Scooter";
        img.style.width = "28px";
        img.style.height = "28px";
        img.style.userSelect = "none";
        img.style.filter = "brightness(0) invert(1)"; // Make icon white
        pin.appendChild(img);

        // Add pulse animation for available scooters
        if (s.status === "available") {
          pin.style.animation = "pulse 2s infinite";
        }

        pin.onclick = e => {
          e.stopPropagation();
          setSelectedScooter(s);
          setForm({ ...s, ...s.metadata });
        };

        return new mapboxgl.Marker(pin)
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      })
      .filter(Boolean);

    return () => markers.forEach(m => m.remove());
  }, [filteredScooters, selectedScooter]);

  /* -------- modal save -------- */
  async function save() {
    setBusy(true);
    try {
      const body = {
        ...form,
        lat: parseFloat(form.lat),
        long: parseFloat(form.long),
        battery: parseInt(form.battery, 10),
        metadata: { battery: parseInt(form.battery, 10), model: form.model },
      };
      if (form.scooter_id) {
        await axiosInstance.put(`/scooters/${form.scooter_id}`, body).catch(err => console.log(err));
      } else {
        await axiosInstance.post("/scooters", body).catch(err => console.log(err));
      }
      await mutate();
      setForm(null);
      setSelectedScooter(null);
    } finally {
      setBusy(false);
    }
  }

  async function deleteScooter(id) {
    if (!window.confirm("Are you sure you want to delete this scooter?")) return;
    try {
      await axiosInstance.delete(`/scooters/${id}`);
      await mutate();
      setForm(null);
      setSelectedScooter(null);
    } catch (err) {
      console.error("Error deleting scooter:", err);
    }
  }

  const centerOnUserLocation = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          mapRef.current.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 15,
            speed: 1.2,
          });
        },
        () => alert("Unable to get your location")
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Add custom CSS for pulse animation */}
      <style jsx>{`
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
                Fleet Overview
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
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span>Total: {stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Available: {stats.available}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>In Use: {stats.in_use}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span>Maintenance: {stats.maintenance}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Panel */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">Filter</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <Info className="w-4 h-4" />
            <span className="font-medium">Instructions</span>
          </div>
          <p className="text-blue-600">Click anywhere on the map to add a new scooter</p>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="absolute bottom-12 left-4 z-10 space-y-2">
        {!showInfo && (
          <button
            onClick={() => setShowInfo(true)}
            className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
            title="Show fleet overview"
          >
            <Info className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        <button
          onClick={centerOnUserLocation}
          className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
          title="Center on your location"
        >
          <Locate className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Scooter Details Panel */}
      {selectedScooter && !form && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 min-w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Scooter Details</h3>
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
              <span className="text-sm text-gray-600">{selectedScooter.scooter_id.slice(0, 8)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusInfo[selectedScooter.status].bgColor} text-white`}>
                {statusInfo[selectedScooter.status].icon} {statusInfo[selectedScooter.status].label}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-gray-600" />
              <span className="text-sm">{selectedScooter.metadata?.battery || selectedScooter.battery}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm">{selectedScooter.lat?.toFixed(4)}, {selectedScooter.long?.toFixed(4)}</span>
            </div>
            
            {selectedScooter.model && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Model:</span>
                <span className="text-sm text-gray-600">{selectedScooter.model}</span>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setForm({ ...selectedScooter, ...selectedScooter.metadata })}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 justify-center"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => deleteScooter(selectedScooter.scooter_id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 justify-center"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Modal */}
      {form && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {form.scooter_id ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {form.scooter_id ? "Edit Scooter" : "Add New Scooter"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {form.scooter_id ? "Update scooter information" : "Add a new scooter to your fleet"}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.0000"
                    value={form.lat}
                    onChange={e => setForm({ ...form, lat: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.0000"
                    value={form.long}
                    onChange={e => setForm({ ...form, long: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Battery className="w-4 h-4 inline mr-1" />
                  Battery Level (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={form.battery}
                  onChange={e => setForm({ ...form, battery: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Model
                </label>
                <input
                  type="text"
                  placeholder="e.g., Xiaomi Pro 2"
                  value={form.model}
                  onChange={e => setForm({ ...form, model: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(statusInfo).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setForm(null);
                  setSelectedScooter(null);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Save Scooter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}