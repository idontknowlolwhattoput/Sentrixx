import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, Calendar, User, Stethoscope, 
  Clock, CheckCircle, XCircle, MoreVertical, Eye,
  RefreshCw, Download, Plus
} from 'lucide-react';

export default function AppointmentsTable() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    visit_status: '',
    visit_type: '',
    date_from: '',
    date_to: '',
    employee_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all appointments
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/patient/visits/filtered', {
        params: filters
      });
      
      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors for filter
  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fetch-doctors');
      if (response.data.result) {
        setDoctors(response.data.result);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      visit_status: '',
      visit_type: '',
      date_from: '',
      date_to: '',
      employee_id: ''
    });
    setSearchTerm('');
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'Completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'In-progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Scheduled':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'In-progress':
        return <Clock className="w-3 h-3 text-blue-600" />;
      case 'Cancelled':
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return <Clock className="w-3 h-3 text-gray-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Walk-in':
        return 'text-purple-600 bg-purple-50';
      case 'Scheduled/Follow-Up':
        return 'text-blue-600 bg-blue-50';
      case 'Emergency':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Filter appointments by search term
  const filteredAppointments = appointments.filter(appointment =>
    appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.appointment_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 bg-gray-50 h-full overflow-auto">
      {/* Compact Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-600">Patient visits and schedules</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded text-sm hover:bg-gray-800 transition-colors">
            <Plus className="w-3 h-3" />
            New
          </button>
        </div>
      </div>

      {/* Compact Filters */}
      {showFilters && (
        <div className="bg-white rounded border border-gray-200 p-3 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.visit_status}
                onChange={(e) => handleFilterChange('visit_status', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In-progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.visit_type}
                onChange={(e) => handleFilterChange('visit_type', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Scheduled/Follow-Up">Scheduled</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            {/* Doctor Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Doctor</label>
              <select
                value={filters.employee_id}
                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor.employee_id} value={doctor.employee_id}>
                    Dr. {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Patient, doctor, code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear all filters
            </button>
            <div className="flex gap-2">
              <button
                onClick={fetchAppointments}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Table */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-600">
            {filteredAppointments.length} appointments
          </span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.record_no} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <div>
                        <div className="font-medium text-gray-900 text-xs">
                          {appointment.patient_name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {appointment.appointment_code}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-900">
                        {appointment.doctor_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {appointment.doctor_department}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-900">
                        {formatDate(appointment.date_scheduled)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {appointment.time_scheduled}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(appointment.visit_type)}`}>
                        {appointment.visit_type}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(appointment.visit_status)}
                        <span className={getStatusBadge(appointment.visit_status)}>
                          {appointment.visit_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="w-3 h-3" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredAppointments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No appointments</h3>
                <p className="text-xs text-gray-500">
                  {Object.values(filters).some(val => val) 
                    ? 'Adjust filters or try different dates' 
                    : 'No appointments scheduled'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}