// src/components/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle,
  Bed,
  Stethoscope,
  Clock,
  Download,
  RefreshCw,
  PieChart,
  BarChart3,
  LineChart,
  UserCheck,
  TestTube,
  ChevronRight,
  Search,
  Filter,
  Menu,
  X,
  Thermometer,
  Heart,
  Droplets,
  Brain,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
  Server,
  Network,
  Cpu
} from 'lucide-react';
import Chart from 'react-apexcharts';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper functions
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat().format(Math.round(num * 100) / 100);
};

const formatPercentage = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return `${Math.round(num * 100) / 100}%`;
};

const safeArray = (data) => {
  return Array.isArray(data) ? data : [];
};

const safeObject = (data) => {
  return data && typeof data === 'object' ? data : {};
};

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Initialize with safe defaults
  const [dashboardData, setDashboardData] = useState({
    keyMetrics: {
      total_patients: 0,
      active_admissions: 0,
      pending_tests: 0,
      today_consultations: 0,
      total_staff: 0,
      active_wards: 0
    },
    recentActivity: [],
    systemHealth: []
  });
  
  const [alerts, setAlerts] = useState({
    criticalPatients: [],
    overdueTests: [],
    bedShortage: [],
    medicationAlerts: []
  });
  
  const [analytics, setAnalytics] = useState({
    patients: {},
    admissions: {},
    medical: {},
    laboratory: {},
    consultations: {}
  });

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'patients', label: 'Patients', icon: <Users className="w-4 h-4" /> },
    { id: 'admissions', label: 'Admissions', icon: <Bed className="w-4 h-4" /> },
    { id: 'medical', label: 'Medical', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'laboratory', label: 'Laboratory', icon: <TestTube className="w-4 h-4" /> },
    { id: 'consultations', label: 'Consultations', icon: <UserCheck className="w-4 h-4" /> },
  ];

  // Mock data for development
  const mockDashboardData = {
    keyMetrics: [
      {
        total_patients: 1247,
        active_admissions: 86,
        pending_tests: 23,
        today_consultations: 45,
        total_staff: 156,
        active_wards: 12
      }
    ],
    recentActivity: [
      { type: 'Admission', description: 'Patient #1024 - Emergency', date: new Date(Date.now() - 300000) },
      { type: 'Test', description: 'MRI completed for Patient #2048', date: new Date(Date.now() - 900000) },
      { type: 'Consultation', description: 'Follow-up consultation - Dr. Smith', date: new Date(Date.now() - 1800000) },
      { type: 'Discharge', description: 'Patient #3072 discharged', date: new Date(Date.now() - 3600000) },
      { type: 'Lab', description: 'Blood test results received', date: new Date(Date.now() - 7200000) }
    ],
    systemHealth: [
      { metric: 'Patient Records', value: 98.5 },
      { metric: 'Admission System', value: 99.2 },
      { metric: 'Lab System', value: 97.8 },
      { metric: 'Billing System', value: 99.5 }
    ]
  };

  const mockAlerts = {
    criticalPatients: [
      { patient_id: 4, patient_name: 'Juan Dela Cruz', triage_category: 'resuscitation', pain_score: 9 },
      { patient_id: 1024, patient_name: 'John Doe', issue: 'Critical BP: 180/110' }
    ],
    overdueTests: [
      { record_no: 35, test_name: 'X-Ray', patient_name: 'Renato Torres', hours_pending: 28 }
    ],
    bedShortage: [
      { ward_id: 'emergency', occupied_beds: 18, total_beds: 20, occupancy_rate: 90 }
    ],
    medicationAlerts: [
      { patient_id: 4, patient_name: 'Juan Dela Cruz', allergen: 'Peanuts', severity: 'Moderate' }
    ]
  };

  // Fetch data from API or use mock data
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch from API
      const [dashboardRes, alertsRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/analytics/dashboard`),
        axios.get(`${API_BASE_URL}/analytics/alerts`)
      ]);

      // Use API data if available, otherwise use mock data
      if (dashboardRes.status === 'fulfilled') {
        const apiData = dashboardRes.value.data;
        setDashboardData({
          keyMetrics: apiData.keyMetrics?.[0] || mockDashboardData.keyMetrics[0],
          recentActivity: safeArray(apiData.recentActivity),
          systemHealth: safeArray(apiData.systemHealth)
        });
      } else {
        console.log('Using mock dashboard data');
        setDashboardData({
          keyMetrics: mockDashboardData.keyMetrics[0],
          recentActivity: mockDashboardData.recentActivity,
          systemHealth: mockDashboardData.systemHealth
        });
      }

      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data || {});
      } else {
        console.log('Using mock alerts data');
        setAlerts(mockAlerts);
      }

      // Fetch tab-specific data
      if (activeTab !== 'dashboard') {
        try {
          const endpoint = `/analytics/${activeTab}`;
          const res = await axios.get(`${API_BASE_URL}${endpoint}?timeframe=${dateRange}`);
          setAnalytics(prev => ({
            ...prev,
            [activeTab]: res.data || {}
          }));
        } catch (err) {
          console.log(`No data for ${activeTab}, using empty dataset`);
          setAnalytics(prev => ({
            ...prev,
            [activeTab]: {}
          }));
        }
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error in data fetch:', err);
      setError('Failed to load analytics data. Using demo data.');
      
      // Fallback to mock data
      setDashboardData({
        keyMetrics: mockDashboardData.keyMetrics[0],
        recentActivity: mockDashboardData.recentActivity,
        systemHealth: mockDashboardData.systemHealth
      });
      setAlerts(mockAlerts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchAllData();
    }, 300000);

    return () => clearInterval(interval);
  }, [activeTab, dateRange]);

  // Chart configurations
  const getAdmissionTrendsChart = () => ({
    options: {
      chart: {
        type: 'area',
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Inter, sans-serif'
      },
      colors: ['#2563eb'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.1,
        }
      },
      xaxis: {
        type: 'datetime',
        labels: { style: { colors: '#6b7280', fontSize: '11px' } }
      },
      yaxis: {
        labels: { style: { colors: '#6b7280', fontSize: '11px' } },
        min: 0
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 4,
      },
      tooltip: {
        x: { format: 'dd MMM yyyy' },
        style: { fontSize: '12px' }
      }
    },
    series: [{
      name: 'Admissions',
      data: [
        { x: new Date('2025-12-01').getTime(), y: 12 },
        { x: new Date('2025-12-02').getTime(), y: 18 },
        { x: new Date('2025-12-03').getTime(), y: 15 },
        { x: new Date('2025-12-04').getTime(), y: 22 },
        { x: new Date('2025-12-05').getTime(), y: 19 },
        { x: new Date('2025-12-06').getTime(), y: 16 }
      ]
    }]
  });

  const getGenderDistributionChart = () => ({
    options: {
      chart: {
        type: 'donut',
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      colors: ['#3b82f6', '#ec4899', '#8b5cf6'],
      labels: ['Male', 'Female', 'Other'],
      legend: {
        position: 'bottom',
        labels: { colors: '#6b7280' }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val.toFixed(1) + "%"
        },
        style: {
          colors: ['#fff'],
          fontSize: '12px'
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: { show: true, fontSize: '14px' },
              value: { 
                show: true,
                fontSize: '20px',
                fontWeight: 'bold',
                formatter: () => formatNumber(dashboardData.keyMetrics?.total_patients || 0)
              },
              total: {
                show: true,
                label: 'Total Patients',
                fontSize: '12px',
                color: '#6b7280'
              }
            }
          }
        }
      }
    },
    series: [57, 43, 0] // Mock percentages
  });

  const getTestStatusChart = () => ({
    options: {
      chart: {
        type: 'bar',
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      colors: ['#10b981', '#f59e0b', '#ef4444'],
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
          distributed: true
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val + " tests"
        },
        style: {
          fontSize: '11px',
          colors: ['#fff']
        }
      },
      xaxis: {
        categories: ['Completed', 'In Progress', 'Requested'],
        labels: { style: { colors: '#6b7280', fontSize: '11px' } }
      },
      yaxis: {
        labels: { style: { colors: '#6b7280', fontSize: '11px' } }
      }
    },
    series: [{
      name: 'Tests',
      data: [65, 23, 12]
    }]
  });

  // Component: Stat Card
  const StatCard = ({ title, value, change, icon: Icon, color = 'gray' }) => {
    const colorClasses = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
    }[color];

    return (
      <div className={`bg-white border ${colorClasses.border} rounded-lg p-5 hover:shadow-sm transition-all duration-200`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {change !== undefined && change !== null && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  change > 0 ? 'bg-green-100 text-green-700' : 
                  change < 0 ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              )}
            </div>
          </div>
          <div className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  };

  // Component: Alert Item
  const AlertItem = ({ type = 'critical', title, description, time, patientId }) => {
    const config = {
      critical: { icon: AlertTriangle, color: 'red', bg: 'bg-red-50', border: 'border-l-red-500' },
      warning: { icon: AlertCircle, color: 'amber', bg: 'bg-amber-50', border: 'border-l-amber-500' },
      info: { icon: AlertCircle, color: 'blue', bg: 'bg-blue-50', border: 'border-l-blue-500' }
    }[type];

    const Icon = config.icon;

    return (
      <div className={`p-4 rounded border-l-4 ${config.border} ${config.bg} mb-3 last:mb-0 hover:opacity-90 transition-opacity`}>
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Icon className={`w-4 h-4 text-${config.color}-600`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-gray-900 truncate">{title}</p>
              {patientId && (
                <span className="text-xs text-gray-500 px-2 py-1 bg-white rounded">ID: {patientId}</span>
              )}
            </div>
            <p className="text-sm text-gray-600">{description}</p>
            {time && <p className="text-xs text-gray-500 mt-2">{time}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Component: Activity Item
  const ActivityItem = ({ type, description, date }) => {
    const icons = {
      Admission: { icon: Bed, color: 'text-blue-600', bg: 'bg-blue-50' },
      Test: { icon: TestTube, color: 'text-purple-600', bg: 'bg-purple-50' },
      Consultation: { icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
      Discharge: { icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
      Lab: { icon: TestTube, color: 'text-indigo-600', bg: 'bg-indigo-50' }
    }[type] || { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50' };

    const Icon = icons.icon;
    const timeAgo = (date) => {
      const diff = Date.now() - new Date(date).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    };

    return (
      <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
        <div className={`p-2 rounded ${icons.bg}`}>
          <Icon className={`w-4 h-4 ${icons.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{description}</p>
          <p className="text-sm text-gray-500 truncate">{type}</p>
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">{timeAgo(date)}</span>
      </div>
    );
  };

  // Component: System Health Meter
  const SystemHealthMeter = ({ metric, value }) => {
    const getStatus = (val) => {
      if (val >= 99) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent' };
      if (val >= 95) return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Good' };
      if (val >= 90) return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Fair' };
      return { color: 'text-red-600', bg: 'bg-red-100', label: 'Poor' };
    };

    const status = getStatus(value);

    return (
      <div className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded ${status.bg}`}>
            <Cpu className={`w-3.5 h-3.5 ${status.color}`} />
          </div>
          <span className="text-sm text-gray-700">{metric}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${status.color}`}>{formatPercentage(value)}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
    );
  };

  // Loading State
  if (loading && !dashboardData.keyMetrics?.total_patients) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Activity className="w-12 h-12 text-gray-400 mx-auto animate-pulse" />
            <RefreshCw className="w-6 h-6 text-gray-600 absolute top-3 left-1/2 transform -translate-x-1/2 animate-spin" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Initializing analytics dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Loading hospital data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Sentrix Analytics</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-1 ml-4">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === tab.id 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-4 py-1.5 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-40 lg:w-56"
                />
              </div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="week">7 days</option>
                <option value="month">30 days</option>
                <option value="quarter">90 days</option>
                <option value="year">1 year</option>
              </select>
              <button 
                onClick={fetchAllData}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tabs */}
      <div className="lg:hidden pt-16 px-4 bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto gap-1 py-2 -mx-4 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 bg-white border border-gray-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 z-40 overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:top-0 lg:pt-16`}>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Patients</span>
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {formatNumber(dashboardData.keyMetrics?.total_patients || 0)}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Admissions</span>
                  <Bed className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {formatNumber(dashboardData.keyMetrics?.active_admissions || 0)}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Staff</span>
                  <UserCheck className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {formatNumber(dashboardData.keyMetrics?.total_staff || 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">System Health</h3>
            <div className="bg-white border border-gray-200 rounded-lg">
              {safeArray(dashboardData.systemHealth).length > 0 ? (
                safeArray(dashboardData.systemHealth).map((item, index) => (
                  <SystemHealthMeter
                    key={index}
                    metric={item.metric || item.name || `System ${index + 1}`}
                    value={item.value || item.percentage || 95}
                  />
                ))
              ) : (
                <div className="p-4 text-center">
                  <Server className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Health data loading...</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Active Alerts</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Critical</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {safeArray(alerts.criticalPatients).length + safeArray(alerts.critical || []).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm">Warnings</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {safeArray(alerts.overdueTests).length + safeArray(alerts.warnings || []).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Capacity</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {safeArray(alerts.bedShortage).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-20 lg:pt-16 min-h-screen transition-all duration-300 ${
        sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
      }`}>
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">{error}</p>
                <p className="text-xs text-amber-700 mt-1">Showing demo data. Check API connection.</p>
              </div>
              <button 
                onClick={fetchAllData}
                className="text-sm text-amber-700 hover:text-amber-900 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Dynamic Content */}
          {activeTab === 'dashboard' ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total Patients"
                  value={formatNumber(dashboardData.keyMetrics?.total_patients)}
                  change={5}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Active Admissions"
                  value={formatNumber(dashboardData.keyMetrics?.active_admissions)}
                  change={-2}
                  icon={Bed}
                  color="purple"
                />
                <StatCard
                  title="Pending Tests"
                  value={formatNumber(dashboardData.keyMetrics?.pending_tests)}
                  change={12}
                  icon={TestTube}
                  color="red"
                />
                <StatCard
                  title="Today's Consultations"
                  value={formatNumber(dashboardData.keyMetrics?.today_consultations)}
                  change={8}
                  icon={UserCheck}
                  color="green"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Admission Trends */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Admission Trends</h3>
                        <p className="text-sm text-gray-500">Daily admission count</p>
                      </div>
                      <div className="text-sm text-gray-500">Last 7 days</div>
                    </div>
                    <Chart
                      options={getAdmissionTrendsChart().options}
                      series={getAdmissionTrendsChart().series}
                      type="area"
                      height={280}
                    />
                  </div>
                </div>

                {/* Gender Distribution */}
                <div>
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-gray-900">Patient Demographics</h3>
                      <p className="text-sm text-gray-500">Gender distribution</p>
                    </div>
                    <Chart
                      options={getGenderDistributionChart().options}
                      series={getGenderDistributionChart().series}
                      type="donut"
                      height={280}
                    />
                  </div>
                </div>
              </div>

              {/* Alerts & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Critical Alerts */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        {safeArray(alerts.criticalPatients).length + safeArray(alerts.critical || []).length} active
                      </span>
                    </div>
                    <div className="space-y-3">
                      {[...safeArray(alerts.criticalPatients), ...safeArray(alerts.critical || [])]
                        .slice(0, 4)
                        .map((alert, index) => (
                          <AlertItem
                            key={index}
                            type="critical"
                            title={alert.patient_name || alert.patient || `Patient #${alert.patient_id || index}`}
                            description={alert.issue || alert.triage_category || 'Critical condition'}
                            patientId={alert.patient_id}
                          />
                        ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                      <button className="text-sm text-gray-500 hover:text-gray-900 font-medium">
                        View all
                      </button>
                    </div>
                    <div>
                      {safeArray(dashboardData.recentActivity)
                        .slice(0, 5)
                        .map((activity, index) => (
                          <ActivityItem
                            key={index}
                            type={activity.type}
                            description={activity.description}
                            date={activity.date}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                {loading ? (
                  <>
                    <RefreshCw className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading {activeTab} data...</h3>
                    <p className="text-gray-500">Fetching analytics from database</p>
                  </>
                ) : (
                  <>
                    <div className={`p-3 rounded-full w-12 h-12 mx-auto mb-4 ${
                      activeTab === 'patients' ? 'bg-blue-100 text-blue-600' :
                      activeTab === 'admissions' ? 'bg-purple-100 text-purple-600' :
                      activeTab === 'medical' ? 'bg-green-100 text-green-600' :
                      activeTab === 'laboratory' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {tabs.find(t => t.id === activeTab)?.icon || <Activity className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {tabs.find(t => t.id === activeTab)?.label || 'Analytics'} Dashboard
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Detailed analytics for {activeTab} will appear here
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                      <Database className="w-4 h-4" />
                      <span>Connected to Sentrix Database</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;