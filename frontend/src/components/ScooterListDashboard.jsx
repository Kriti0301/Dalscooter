import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Battery, 
  MapPin, 
  Zap, 
  Search,
  Filter
} from "lucide-react";

/* ---------- helpers ---------- */
const statuses = ["available", "in_use", "maintenance"];

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-200",
  in_use: "bg-blue-100 text-blue-800 border-blue-200",
  maintenance: "bg-orange-100 text-orange-800 border-orange-200"
};

const statusIcons = {
  available: "🟢",
  in_use: "🔵", 
  maintenance: "🟡"
};

function emptyForm(franchise_id) {
  return { franchise_id, lat: "", long: "", battery: 100, model: "", status: "available" };
}

function getBatteryColor(battery) {
  if (battery >= 80) return "text-green-600";
  if (battery >= 50) return "text-yellow-600";
  if (battery >= 20) return "text-orange-600";
  return "text-red-600";
}

function getBatteryIcon(battery) {
  if (battery >= 80) return "🔋";
  if (battery >= 50) return "🔋";
  if (battery >= 20) return "🪫";
  return "🪫";
}

/* ----------------------------- */

export default function ScooterListDashboard() {
  const api = axiosInstance;
  const { authUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);   // null = closed modal
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* load scooters */
  useEffect(() => {
    if (!authUser) return;
    api.get(`/scooters`).then(r => setRows(r.data));
  }, [authUser, api]);

  /* create or update */
  async function save() {
    setBusy(true);
    const body = {
      ...form,
      lat: parseFloat(form.lat),
      long: parseFloat(form.long),
      metadata: { battery: parseInt(form.battery, 10), model: form.model },
    };
    try {
      if (form.scooter_id) {
        await api.put(`/scooters/${form.scooter_id}`, body);
      } else {
        await api.post("/scooters", body);
      }
      // refresh list
      const { data } = await api.get(`/scooters`);
      setRows(data);
      setForm(null);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete scooter?")) return;
    await api.delete(`/scooters/${id}`);
    setRows(rows.filter(r => r.scooter_id !== id));
  }

  // Filter scooters based on search and status
  const filteredRows = rows.filter(scooter => {
    const matchesSearch = scooter.scooter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scooter.metadata.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || scooter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: rows.length,
    available: rows.filter(r => r.status === "available").length,
    in_use: rows.filter(r => r.status === "in_use").length,
    maintenance: rows.filter(r => r.status === "maintenance").length,
    avgBattery: rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + (r.metadata?.battery || r.battery || 0), 0) / rows.length) : 0
  };

  if (!authUser) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="text-6xl mb-4">🔐</div>
        <p className="text-xl text-gray-600">Sign in as Franchise to manage scooters</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fleet Management</h2>
            <p className="text-gray-600">Monitor and manage your scooter fleet</p>
          </div>
          <button
            onClick={() => setForm(emptyForm(authUser.sub))}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Scooter
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Scooters</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-green-600">Available</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.in_use}</div>
            <div className="text-sm text-blue-600">In Use</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.maintenance}</div>
            <div className="text-sm text-orange-600">Maintenance</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.avgBattery}%</div>
            <div className="text-sm text-purple-600">Avg Battery</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search scooters by ID or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scooter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRows.map(scooter => {
          const battery = scooter.metadata?.battery ?? scooter.battery ?? 0;
          return (
            <div key={scooter.scooter_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      ID: {scooter.scooter_id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">{scooter.metadata.model || 'No model'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setForm({ ...scooter, ...scooter.metadata })}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(scooter.scooter_id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[scooter.status]}`}>
                  {statusIcons[scooter.status]}
                  {scooter.status.charAt(0).toUpperCase() + scooter.status.slice(1).replace('_', ' ')}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {scooter.lat?.toFixed(4)}, {scooter.long?.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Battery className={`w-4 h-4 ${getBatteryColor(battery)}`} />
                  <span className={`text-sm font-medium ${getBatteryColor(battery)}`}>
                    {battery}% {getBatteryIcon(battery)}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        battery >= 80 ? 'bg-green-500' : 
                        battery >= 50 ? 'bg-yellow-500' : 
                        battery >= 20 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${battery}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredRows.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🛴</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter !== "all" ? "No scooters found" : "No scooters yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria" 
              : "Get started by adding your first scooter to the fleet"}
          </p>
          {(!searchTerm && statusFilter === "all") && (
            <button
              onClick={() => setForm(emptyForm(authUser.sub))}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors">
              <Plus className="w-4 h-4" />
              Add Your First Scooter
            </button>
          )}
        </div>
      )}

      {/* ---------- Enhanced Modal ---------- */}
      {form && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {form.scooter_id ? "Edit Scooter" : "Add New Scooter"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {form.scooter_id ? "Update scooter information" : "Add a new scooter to your fleet"}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Battery Level (%)</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
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
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setForm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50 transition-colors">
                {busy ? "Saving..." : "Save Scooter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}