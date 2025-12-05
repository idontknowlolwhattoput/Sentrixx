import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download, Printer, Eye, CheckCircle, XCircle, Clock, AlertCircle, User, Calendar, FileText, ChevronRight, ChevronDown, RefreshCw, Image as ImageIcon, BarChart3, Activity, Heart, Droplets, Microscope, TrendingUp, AlertTriangle, Shield } from 'lucide-react';

// Base API URL
const API_BASE_URL = 'http://localhost:5000';

export default function LabTechnicianDashboard() {
  const [userPosition, setUserPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [xrayTests, setXrayTests] = useState([]);
  const [cbcTests, setCbcTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get user position from localStorage
    const position = localStorage.getItem('position');
    setUserPosition(position);
    setLoading(false);
  }, []);

  const normalizedPosition = userPosition?.toLowerCase();
  const isRadiologist = normalizedPosition === 'radiologist';
  const isMedTech = normalizedPosition === 'medtech';
  const isAdmin = normalizedPosition = 'admin';

  // Fetch tests based on user position
  useEffect(() => {
    const fetchTests = async () => {
      if (!normalizedPosition) return;

      setLoadingTests(true);
      setError(null);

      try {
        if (isRadiologist) {
          const response = await axios.get(`${API_BASE_URL}/lab/xray`);
          if (response.data.success) {
            setXrayTests(response.data.tests || []);
          }
        } else if (isMedTech) {
          const response = await axios.get(`${API_BASE_URL}/lab/cbc`);
          if (response.data.success) {
            setCbcTests(response.data.tests || []);
          }
        }
      } catch (err) {
        console.error('Error fetching tests:', err);
        setError('Failed to load tests. Please try again.');
      } finally {
        setLoadingTests(false);
      }
    };

    fetchTests();
  }, [normalizedPosition, isRadiologist, isMedTech]);

  const refreshTests = async () => {
    setLoadingTests(true);
    setError(null);
    
    try {
      if (isRadiologist) {
        const response = await axios.get(`${API_BASE_URL}/lab/xray`);
        if (response.data.success) {
          setXrayTests(response.data.tests || []);
        }
      } else if (isMedTech) {
        const response = await axios.get(`${API_BASE_URL}/lab/cbc`);
        if (response.data.success) {
          setCbcTests(response.data.tests || []);
        }
      }
    } catch (err) {
      console.error('Error refreshing tests:', err);
      setError('Failed to refresh tests. Please try again.');
    } finally {
      setLoadingTests(false);
    }
  };

  // Filter tests based on search and status
  const filterTests = (tests) => {
    return tests.filter(test => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        test.patient_name?.toLowerCase().includes(searchLower) ||
        test.patient_id?.toString().includes(searchLower) ||
        test.record_no?.toString().includes(searchLower) ||
        test.test_name?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        test.status?.toLowerCase() === statusFilter.toLowerCase() ||
        (statusFilter === 'in-progress' && test.status?.toLowerCase().includes('progress'));

      return matchesSearch && matchesStatus;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!normalizedPosition || (normalizedPosition !== 'radiologist' && normalizedPosition !== 'medtech' && normalizedPosition !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the laboratory dashboard.
          </p>
          <p className="text-sm text-gray-500">Required positions: Radiologist or MedTech</p>
          <p className="text-xs text-gray-400 mt-2">Current position: {userPosition || 'Not set'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isRadiologist ? 'Radiology Dashboard' : 'MedTech Laboratory'}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-gray-600">
                  {isRadiologist ? 'Medical Imaging Department' : 'Clinical Laboratory'}
                </p>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full border border-gray-300">
                  {userPosition}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {isRadiologist ? 'Radiologist' : 'Medical Technologist'}
                </p>
                <p className="text-xs text-gray-600">
                  ID: {isRadiologist ? 'RAD-001' : 'MT-001'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    isRadiologist 
                      ? "Search by patient name, ID, or record number..." 
                      : "Search by patient name, ID, or record number..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button
                onClick={refreshTests}
                disabled={loadingTests}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${loadingTests ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content based on position */}
        {loadingTests ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tests...</p>
            </div>
          </div>
        ) : isRadiologist ? (
          <XRayDashboard 
            tests={filterTests(xrayTests)} 
            refreshTests={refreshTests}
          />
        ) : (
          <CBCDashboard 
            tests={filterTests(cbcTests)}
            refreshTests={refreshTests}
          />
        )}
      </div>
    </div>
  );
}

// X-Ray Dashboard Component - Simplified with only required columns
function XRayDashboard({ tests, refreshTests }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [testImages, setTestImages] = useState({});

  // Function to fetch images for a specific test
  const fetchTestImages = async (recordNo) => {
    try {
      // Mock image data - replace with actual API call
      const mockImages = [
        { 
          id: 1, 
          name: 'X-Ray Image 1', 
          url: 'https://health.osu.edu/-/media/health/images/stories/2023/02/x-ray.jpg',
          uploaded_at: new Date().toISOString(),
          size: '2.4 MB'
        },
        { 
          id: 2, 
          name: 'X-Ray Image 2', 
          url: 'https://glassboxmedicine.files.wordpress.com/2019/02/normal_cxr.jpg',
          uploaded_at: new Date().toISOString(),
          size: '3.1 MB'
        }
      ];
      
      setTestImages(prev => ({
        ...prev,
        [recordNo]: mockImages
      }));
      return mockImages;
    } catch (err) {
      console.error('Error fetching images:', err);
      return [];
    }
  };

  const handleUpdateStatus = async (recordNo, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [recordNo]: true }));
    try {
      await axios.put(`${API_BASE_URL}/lab/xray/${recordNo}`, {
        status: newStatus
      });
      await refreshTests();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [recordNo]: false }));
    }
  };

  const handleViewImages = async (test) => {
    setCurrentTest(test);
    
    // Try to fetch images if we haven't already
    if (!testImages[test.record_no]) {
      const images = await fetchTestImages(test.record_no);
      if (images.length > 0) {
        setSelectedImage(images[0]);
      }
    } else if (testImages[test.record_no].length > 0) {
      setSelectedImage(testImages[test.record_no][0]);
    }
    
    setShowImageModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'requested':
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full border border-gray-300">Pending</span>;
      case 'in-progress':
      case 'processing':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">In Progress</span>;
      case 'completed':
      case 'done':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-300">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full border border-gray-300">{status}</span>;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate statistics
  const stats = {
    total: tests.length,
    pending: tests.filter(t => t.status?.toLowerCase() === 'requested' || t.status?.toLowerCase() === 'pending').length,
    inProgress: tests.filter(t => t.status?.toLowerCase() === 'in-progress' || t.status?.toLowerCase() === 'processing').length,
    completed: tests.filter(t => t.status?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'done').length
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Today" value={stats.total} icon={ImageIcon} color="bg-gray-100" textColor="text-gray-700" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="bg-gray-100" textColor="text-gray-700" />
        <StatCard title="In Progress" value={stats.inProgress} icon={Activity} color="bg-gray-100" textColor="text-gray-700" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="bg-gray-100" textColor="text-gray-700" />
      </div>

      {/* Test List - SIMPLIFIED with only required columns */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">X-Ray Imaging Queue</h2>
          <p className="text-sm text-gray-600 mt-1">Review and interpret medical images</p>
        </div>
        <div className="overflow-x-auto">
          {tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No X-Ray tests found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Record No.</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lab Test Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Special Instruction</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tests.map((test) => (
                  <tr key={test.record_no} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{test.record_no}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {test.first_name && test.last_name 
                          ? `${test.first_name} ${test.last_name}`
                          : `Patient #${test.patient_id}`}
                      </div>
                      {test.patient_id && (
                        <div className="text-xs text-gray-600 mt-1">
                          ID: {test.patient_id}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{test.lab_test_code || 'N/A'}</div>
                      {test.test_name && test.test_name !== 'X-Ray' && (
                        <div className="text-xs text-gray-600 mt-1">
                          {test.test_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(test.date_requested)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm text-gray-900">{test.special_instruction || 'None'}</div>
                        {test.additional_notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            Note: {test.additional_notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(test.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewImages(test)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          title="View Test Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        {test.status?.toLowerCase() !== 'completed' && test.status?.toLowerCase() !== 'done' && (
                          <button
                            onClick={() => handleUpdateStatus(test.record_no, 'completed')}
                            disabled={updatingStatus[test.record_no]}
                            className="px-3 py-2 text-sm border border-gray-800 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            {updatingStatus[test.record_no] ? 'Updating...' : 'Mark Complete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && currentTest && (
        <ImageModal 
          test={currentTest} 
          images={testImages[currentTest.record_no] || []}
          selectedImage={selectedImage}
          onImageSelect={setSelectedImage}
          onClose={() => {
            setShowImageModal(false);
            setSelectedImage(null);
          }}
          onStatusUpdate={refreshTests}
          onImagesUpdate={(images) => {
            setTestImages(prev => ({
              ...prev,
              [currentTest.record_no]: images
            }));
          }}
        />
      )}
    </div>
  );
}

// CBC Dashboard Component
function CBCDashboard({ tests, refreshTests }) {
  const [expandedTest, setExpandedTest] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  const defaultResults = {
    wbc: { value: '', unit: '10³/μL', range: '4.0-11.0', status: 'normal' },
    rbc: { value: '', unit: '10⁶/μL', range: '4.5-6.0', status: 'normal' },
    hemoglobin: { value: '', unit: 'g/dL', range: '13.5-17.5', status: 'normal' },
    hematocrit: { value: '', unit: '%', range: '40-52', status: 'normal' },
    platelets: { value: '', unit: '10³/μL', range: '150-450', status: 'normal' },
    mcv: { value: '', unit: 'fL', range: '80-100', status: 'normal' },
    mch: { value: '', unit: 'pg', range: '27-33', status: 'normal' },
    mchc: { value: '', unit: 'g/dL', range: '32-36', status: 'normal' }
  };

  const handleUpdateStatus = async (recordNo, newStatus, results = null) => {
    setUpdatingStatus(prev => ({ ...prev, [recordNo]: true }));
    try {
      const updateData = { status: newStatus };
      if (results) {
        updateData.results = results;
        updateData.completed_at = new Date().toISOString();
      }
      
      await axios.put(`${API_BASE_URL}/lab/cbc/${recordNo}`, updateData);
      await refreshTests();
      setExpandedTest(null);
    } catch (err) {
      console.error('Error updating test:', err);
      alert('Failed to update test');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [recordNo]: false }));
    }
  };

  const handleInputChange = (testId, parameter, value) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [parameter]: {
          ...(prev[testId]?.[parameter] || defaultResults[parameter]),
          value: value,
          status: getResultStatus(parameter, value, defaultResults[parameter].range)
        }
      }
    }));
  };

  const getResultStatus = (parameter, value, range) => {
    if (!value) return 'normal';
    const [min, max] = range.split('-').map(Number);
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'normal';
    if (numValue < min) return 'low';
    if (numValue > max) return 'high';
    return 'normal';
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'requested':
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full border border-gray-300">Pending</span>;
      case 'in-progress':
      case 'processing':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">In Progress</span>;
      case 'completed':
      case 'done':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-300">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full border border-gray-300">{status}</span>;
    }
  };

  const handleViewResults = (test) => {
    setSelectedTest(test);
    setShowResultsModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate statistics
  const stats = {
    total: tests.length,
    pending: tests.filter(t => t.status?.toLowerCase() === 'requested' || t.status?.toLowerCase() === 'pending').length,
    inProgress: tests.filter(t => t.status?.toLowerCase() === 'in-progress' || t.status?.toLowerCase() === 'processing').length,
    completed: tests.filter(t => t.status?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'done').length
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Today" value={stats.total} icon={Activity} color="bg-gray-100" textColor="text-gray-700" />
        <StatCard title="Pending" value={stats.pending} icon={Droplets} color="bg-gray-100" textColor="text-gray-700" />
        <StatCard title="In Progress" value={stats.inProgress} icon={Microscope} color="bg-gray-100" textColor="text-gray-700" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="bg-gray-100" textColor="text-gray-700" />
      </div>

      {/* Test List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Complete Blood Count Tests</h2>
          <p className="text-sm text-gray-600 mt-1">Process blood samples and enter test results</p>
        </div>
        <div className="overflow-x-auto">
          {tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No CBC tests found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Test Details</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Instructions</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tests.map((test) => (
                  <React.Fragment key={test.record_no}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-gray-700" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{test.test_name || 'CBC'}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Record: {test.record_no}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">Patient #{test.patient_id}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Employee: {test.employee_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 truncate">{test.special_instruction || 'No special instructions'}</div>
                          <div className="text-xs text-gray-600 mt-1 truncate">{test.additional_notes || 'No additional notes'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(test.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(test.date_requested)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {test.status?.toLowerCase() === 'completed' || test.status?.toLowerCase() === 'done' ? (
                            <button
                              onClick={() => handleViewResults(test)}
                              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              title="View Results"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setExpandedTest(expandedTest === test.record_no ? null : test.record_no)}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                title="Enter Results"
                              >
                                <FileText className="w-4 h-4 text-gray-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Results Input */}
                    {expandedTest === test.record_no && test.status?.toLowerCase() !== 'completed' && test.status?.toLowerCase() !== 'done' && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <div className="max-w-4xl">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Enter Test Results for Record #{test.record_no}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {Object.entries(defaultResults).map(([key, param]) => (
                                <div key={key} className="space-y-1">
                                  <label className="block text-xs font-medium text-gray-700">
                                    {key.toUpperCase()}
                                  </label>
                                  <input
                                    type="text"
                                    value={testResults[test.record_no]?.[key]?.value || ''}
                                    onChange={(e) => handleInputChange(test.record_no, key, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                    placeholder={`Range: ${param.range}`}
                                  />
                                  <div className="text-xs text-gray-500">
                                    {param.unit} • Ref: {param.range}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 flex justify-end space-x-3">
                              <button
                                onClick={() => setExpandedTest(null)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                className="px-4 py-2 text-sm border border-gray-800 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                                onClick={() => {
                                  const results = testResults[test.record_no];
                                  if (results) {
                                    handleUpdateStatus(test.record_no, 'completed', results);
                                  } else {
                                    alert('Please enter results before saving');
                                  }
                                }}
                                disabled={updatingStatus[test.record_no]}
                              >
                                {updatingStatus[test.record_no] ? 'Saving...' : 'Save & Complete'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {showResultsModal && selectedTest && (
        <ResultsModal
          test={selectedTest}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedTest(null);
          }}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, textColor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>
    </div>
  );
}

// Updated Image Modal Component with real images
// Updated Image Modal Component with working image upload and display
function ImageModal({ test, images = [], selectedImage, onImageSelect, onClose, onStatusUpdate, onImagesUpdate }) {
  const [findings, setFindings] = useState(test.findings || '');
  const [impression, setImpression] = useState(test.impression || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Handle file selection for upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, GIF, BMP, or WebP)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to API - Fixed version
  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setUploading(true);
    
    try {
      // Create a unique image ID
      const imageId = Date.now();
      
      // Create image object with data URL
      const newImage = {
        id: imageId,
        name: selectedFile.name,
        url: previewUrl, // Use the data URL from FileReader
        uploaded_at: new Date().toISOString(),
        size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
        type: selectedFile.type
      };
      
      // For demo - in production you would upload to your API
      // const formData = new FormData();
      // formData.append('image', selectedFile);
      // formData.append('record_no', test.record_no);
      // const response = await axios.post(`${API_BASE_URL}/lab/xray/${test.record_no}/upload`, formData);
      
      // Add new image to the list
      const updatedImages = [...images, newImage];
      onImagesUpdate(updatedImages);
      
      // Select the new image
      onImageSelect(newImage);
      
      // Reset file selection
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      alert('Image uploaded successfully!');
    } catch (err) {
      console.error('Error uploading image:', err);
      alert(`Failed to upload image: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Delete image
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      // Remove image from list
      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesUpdate(updatedImages);
      
      // Select another image if we deleted the currently selected one
      if (selectedImage && selectedImage.id === imageId) {
        if (updatedImages.length > 0) {
          onImageSelect(updatedImages[0]);
        } else {
          onImageSelect(null);
        }
      }
      
      alert('Image deleted successfully!');
    } catch (err) {
      console.error('Error deleting image:', err);
      alert(`Failed to delete image: ${err.message}`);
    }
  };

 const handleSaveFindings = async () => {
  setSaving(true);
  try {
    // Create FormData object
    const formData = new FormData();
    
    // Add findings and impression
    if (findings) formData.append('findings', findings);
    if (impression) formData.append('impression', impression);
    
    // Add image if available (from uploaded images)
    if (images && images.length > 0 && images[0].file) {
      // If we have a file object from upload
      formData.append('image', images[0].file);
    } else if (selectedFile) {
      // If user just uploaded a new file
      formData.append('image', selectedFile);
    } else if (images && images.length > 0 && images[0].url) {
      // If image already exists as a URL, we need to convert it
      // Note: This requires additional handling if re-uploading is needed
      console.log('Image already exists, skipping upload');
    }
    
    // Send the request
    const response = await axios.put(
      `${API_BASE_URL}/lab/xray/${test.record_no}/update`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Optional: Add timeout and progress
        timeout: 30000, // 30 seconds timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
          // You could add a progress bar here
        }
      }
    );

    if (response.data.success) {
      // Show success message with details
      const message = `Results saved successfully!${
        response.data.image ? 
          `\nImage: ${response.data.image.filename}` : 
          '\nNo image uploaded.'
      }`;
      alert(message);
      
      // Refresh the test list
      if (onStatusUpdate) {
        onStatusUpdate();
      }
      
      // Close the modal
      if (onClose) {
        onClose();
      }
    
    } else {
      throw new Error(response.data.message || 'Update failed');
    }
    
  } catch (err) {
    console.error('Error saving findings:', err);
    
    // Show more detailed error message
    let errorMessage = 'Failed to save results';
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage = `Server error: ${err.response.data.message || err.response.statusText}`;
      console.error('Response data:', err.response.data);
    } else if (err.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Check your connection.';
      console.error('Request error:', err.request);
    } else {
      // Something happened in setting up the request
      errorMessage = `Error: ${err.message}`;
    }
    
    alert(errorMessage);
  } finally {
    setSaving(false);
  }
};

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  // Reset image error when image changes
  useEffect(() => {
    setImageError(false);
  }, [selectedImage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-6xl bg-white rounded-lg border border-gray-200 shadow-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">X-Ray Test Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Record #{test.record_no} • Patient #{test.patient_id} • {test.test_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-5rem)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              {/* Test Info */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Test Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Record No:</span>
                    <span className="font-medium">{test.record_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="font-medium">{test.patient_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="font-medium">{test.employee_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{test.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requested:</span>
                    <span className="font-medium">
                      {new Date(test.date_requested).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {test.special_instruction && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Special Instructions</h3>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                    {test.special_instruction}
                  </p>
                </div>
              )}

              {/* Additional Notes */}
              {test.additional_notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Additional Notes</h3>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                    {test.additional_notes}
                  </p>
                </div>
              )}

              {/* Image Upload Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Upload Image</h3>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-32 object-contain rounded border border-gray-300 bg-white"
                      />
                    </div>
                  )}
                  <button
                    onClick={handleUploadImage}
                    disabled={!selectedFile || uploading}
                    className="w-full px-4 py-2 text-sm border border-blue-600 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
              </div>

              {/* Image List */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Images ({images.length})
                </h3>
                <div className="space-y-2">
                  {images.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No images uploaded yet</p>
                  ) : (
                    images.map((image) => (
                      <div
                        key={image.id}
                        className={`w-full p-3 rounded-lg transition-colors ${selectedImage?.id === image.id
                            ? 'bg-white border border-gray-300 shadow-sm'
                            : 'hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => onImageSelect(image)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-700" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">{image.name}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {image.uploaded_at ? formatDate(image.uploaded_at) : 'Unknown date'}
                                </div>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete image"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Findings */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Findings</h3>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  rows="3"
                  placeholder="Enter your findings..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                />
              </div>

              {/* Impression */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Impression</h3>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  rows="3"
                  placeholder="Enter your impression..."
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                />
              </div>

              <button
                onClick={handleSaveFindings}
                disabled={saving}
                className="w-full px-4 py-2 text-sm border border-gray-800 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Complete Test'}
              </button>
            </div>
          </div>

          {/* Main Image View */}
          <div className="flex-1 flex flex-col">
            {/* Image Display */}
            <div className="flex-1 bg-gray-900 flex items-center justify-center p-4">
              {selectedImage && selectedImage.url ? (
                <div className="relative max-w-full max-h-full">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg bg-white"
                    onError={handleImageError}
                  />
                  {/* Image Overlay Text */}
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
                    {selectedImage.name} • {selectedImage.size || 'Unknown size'}
                  </div>
                </div>
              ) : imageError ? (
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <p className="text-white text-lg">Image failed to load</p>
                  <p className="text-gray-400 mt-2">The image file may be corrupted or in an unsupported format</p>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-white text-lg">No images available</p>
                  <p className="text-gray-400 mt-2">Upload images using the panel on the left</p>
                </div>
              ) : (
                <div className="text-center">
                  <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-white text-lg">Select an image to view</p>
                  <p className="text-gray-400 mt-2">Choose from the list on the left</p>
                </div>
              )}
            </div>

            {/* Image Controls */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedImage && selectedImage.url && (
                    <>
                      <a
                        href={selectedImage.url}
                        download={selectedImage.name}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Download Image"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </a>
                      <button
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>${selectedImage.name}</title>
                                  <style>
                                    body { margin: 0; padding: 20px; }
                                    img { max-width: 100%; max-height: 90vh; }
                                    .info { margin-top: 20px; font-family: Arial; }
                                  </style>
                                </head>
                                <body>
                                  <img src="${selectedImage.url}" alt="${selectedImage.name}" />
                                  <div class="info">
                                    <p><strong>Record No:</strong> ${test.record_no}</p>
                                    <p><strong>Patient ID:</strong> ${test.patient_id}</p>
                                    <p><strong>Image Name:</strong> ${selectedImage.name}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                                  </div>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                            printWindow.focus();
                            printWindow.print();
                          }
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Print Image"
                      >
                        <Printer className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          const newWindow = window.open('', '_blank');
                          if (newWindow) {
                            newWindow.document.write(`
                              <html>
                                <head>
                                  <title>${selectedImage.name}</title>
                                  <style>
                                    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #333; }
                                    img { max-width: 100%; max-height: 100vh; }
                                  </style>
                                </head>
                                <body>
                                  <img src="${selectedImage.url}" alt="${selectedImage.name}" />
                                </body>
                              </html>
                            `);
                            newWindow.document.close();
                          }
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Open in New Tab"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {selectedImage && images.length > 1 && (
                    <>
                      <button
                        onClick={() => {
                          const currentIndex = images.findIndex(img => img.id === selectedImage.id);
                          const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                          onImageSelect(images[prevIndex]);
                        }}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        {images.findIndex(img => img.id === selectedImage.id) + 1} of {images.length}
                      </span>
                      <button
                        onClick={() => {
                          const currentIndex = images.findIndex(img => img.id === selectedImage.id);
                          const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                          onImageSelect(images[nextIndex]);
                        }}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Results Modal Component (for CBC results)
function ResultsModal({ test, onClose }) {
  // Parse results if stored as JSON string
  const results = typeof test.results === 'string' 
    ? JSON.parse(test.results) 
    : test.results;

  const getResultStatusClass = (status) => {
    switch (status) {
      case 'high':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getResultStatusIcon = (status) => {
    switch (status) {
      case 'high':
      case 'low':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-4xl bg-white rounded-lg border border-gray-200 shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">CBC Test Results</h2>
              <p className="text-sm text-gray-600 mt-1">
                Record #{test.record_no} • Patient #{test.patient_id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Test Info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Test Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Record No:</span>
                  <span className="font-medium">{test.record_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient ID:</span>
                  <span className="font-medium">{test.patient_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee ID:</span>
                  <span className="font-medium">{test.employee_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{test.status}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Timestamps</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested:</span>
                  <span className="font-medium">{formatDate(test.date_requested)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium">{formatDate(test.completed_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {test.special_instruction && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Special Instructions</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{test.special_instruction}</p>
              </div>
            </div>
          )}

          {/* Results Table */}
          {results && (
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 mb-4">Test Results</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Parameter</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Result</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Units</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reference Range</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(results).map(([key, result]) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{key.toUpperCase()}</div>
                          <div className="text-xs text-gray-500">
                            {key === 'wbc' && 'White Blood Cells'}
                            {key === 'rbc' && 'Red Blood Cells'}
                            {key === 'hemoglobin' && 'Hemoglobin'}
                            {key === 'hematocrit' && 'Hematocrit'}
                            {key === 'platelets' && 'Platelets'}
                            {key === 'mcv' && 'Mean Corpuscular Volume'}
                            {key === 'mch' && 'Mean Corpuscular Hemoglobin'}
                            {key === 'mchc' && 'Mean Corpuscular Hemoglobin Concentration'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-lg font-bold ${result.status === 'normal' ? 'text-gray-900' : result.status === 'high' ? 'text-yellow-700' : 'text-red-700'
                            }`}>
                            {result.value}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{result.unit}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{result.range}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium ${getResultStatusClass(result.status)}`}>
                            {getResultStatusIcon(result.status)}
                            <span className="ml-1 capitalize">{result.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Interpretation */}
          {test.interpretation && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Interpretation</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{test.interpretation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm border border-gray-800 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}