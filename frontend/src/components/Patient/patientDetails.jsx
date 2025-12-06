import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Phone, Mail, MapPin, Calendar, Heart, 
  AlertTriangle, Users, Activity, Edit, FileText,
  ChevronRight, Star, Stethoscope, Plus, Clock, UserCheck, CheckCircle, XCircle,
  DoorClosed, Eye, RefreshCw, FlaskRound, Beaker, // Changed Flask to FlaskRound
  TestTube, Microscope, Printer, AlertCircle // Added more lab-related icons
} from 'lucide-react';

export default function PatientDetails({ patientId, onBack }) {
  
  const [doctorList, setDoctorList] = useState([])
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visits, setVisits] = useState([]);
  const [doctorTypes, setDoctorTypes] = useState([]);
  const [loadingDoctorTypes, setLoadingDoctorTypes] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
      fetchVisits();
      localStorage.setItem("selected_patient_id", patientId)
    }
  }, [patientId]);

  const fetchPatientDetails = async () => {
    setLoading(true);
    try { 
      const response = await fetch(`http://localhost:5000/api/patients/${patientId}`);
      const data = await response.json();
      console.log('Patient API Response:', data);
      if (data.success) {
        setPatient(data.patient);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Updated fetchVisits function with correct API endpoint
  const fetchVisits = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/patient/visits/patient/${patientId}`);
      if (response.data.success) {
        setVisits(response.data.data || []);
      } else {
        setVisits([]);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
    }
  };

  // Navigation items - Added laboratory section
  const navItems = [
    { id: 'personal', label: 'PERSONAL DETAILS', icon: User },
    { id: 'medical', label: 'MEDICAL DETAILS', icon: Heart },
    { id: 'contacts', label: 'CONTACTS DETAILS', icon: Users },
    { id: 'allergies', label: 'ALLERGIES DETAILS', icon: AlertTriangle },
    { id: 'visits', label: 'VISITS', icon: FileText },
    { id: 'laboratory', label: 'LABORATORY TESTS', icon: FlaskRound }, 
    { id: 'admittance', label: 'ADMITTANCE HISTORY', icon: DoorClosed },
  ];

  if (loading) {
    return (
      <div className="w-full h-full bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-t-lg"></div>
          <div className="flex">
            <div className="w-64 border-r border-gray-200 p-4 space-y-4">
              {[...Array(6)].map((_, i) => ( // Increased to 6 for new item
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="flex-1 p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="w-full h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Patient not found</p>
          <p className="text-sm">Please select a valid patient</p>
        </div>
      </div>
    );
  }

  // Safe data access functions
  const getPersonalData = () => patient.personal || patient || {};
  const getMedicalData = () => patient.medical || {};
  const getContactData = () => patient.contact || patient || {};
  const getVitalsData = () => patient.vitals || {};
  const getEmergencyData = () => patient.emergency_contact || {};
  const getAllergiesData = () => patient.allergies || [];

  const getFullName = () => {
    const personal = getPersonalData();
    const names = [
      personal.first_name,
      personal.middle_name,
      personal.last_name
    ].filter(Boolean);
    return names.join(' ') || 'Unknown Patient';
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalDetails patient={patient} getPersonalData={getPersonalData} calculateAge={calculateAge} formatDate={formatDate} />;
      case 'medical':
        return <MedicalDetails patient={patient} getMedicalData={getMedicalData} getVitalsData={getVitalsData} formatDate={formatDate} />;
      case 'contacts':
        return <ContactDetails patient={patient} getPersonalData={getPersonalData} getContactData={getContactData} getEmergencyData={getEmergencyData} />;
      case 'allergies':
        return <AllergyDetails patient={patient} getAllergiesData={getAllergiesData} />;
      case 'visits':
        return <VisitDetails patient={patient} visits={visits} formatDate={formatDate} onAddVisit={() => setShowVisitModal(true)} fetchVisits={fetchVisits} />;
      case 'laboratory':
        return <LaboratoryDetails patientId={patientId} patientName={getFullName()} formatDate={formatDate} formatDateTime={formatDateTime} />;
      case 'admittance': // Added this case
        return <AdmittanceHistory patientId={patientId} patientName={getFullName()} formatDate={formatDate} formatDateTime={formatDateTime} />;
      default:
        return <PersonalDetails patient={patient} getPersonalData={getPersonalData} calculateAge={calculateAge} formatDate={formatDate} />;
    }
  };

  return (
    <div className="w-full h-150 bg-white rounded-lg border border-gray-200 flex flex-col">
      {/* Thin Top Navbar - Patient Basic Info */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getFullName()}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {calculateAge(getPersonalData().date_of_birth)} years
                  </span>
                  <span>{getPersonalData().gender || 'N/A'}</span>
                  <span>ID: {patient.patient_id}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>{isEditing ? 'Save' : 'Edit'}</span>
            </button>
            {onBack && (
              <button 
                onClick={onBack}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to List
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 text-left rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                      : 'text-gray-700 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto ${
                    activeSection === item.id ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Add Visit Modal */}
      {showVisitModal && (
        <AddVisitModal 
          onClose={() => setShowVisitModal(false)}
          onSave={(newVisit) => {
            // Refresh visits after adding a new one
            fetchVisits();
            setShowVisitModal(false);
          }}
          patientName={getFullName()}
          patientId={patientId}
        />
      )}
    </div>
  );
}

// Personal Details Component
function PersonalDetails({ patient, getPersonalData, calculateAge, formatDate }) {
  const personal = getPersonalData();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        <div className="text-sm text-gray-500">
          Last updated: {formatDate(patient.created_at)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard
          icon={User}
          title="Basic Info"
          items={[
            { label: 'Full Name', value: [
              personal.first_name,
              personal.middle_name,
              personal.last_name
            ].filter(Boolean).join(' ') || 'Not provided' },
            { label: 'Date of Birth', value: formatDate(personal.date_of_birth) },
            { label: 'Age', value: `${calculateAge(personal.date_of_birth)} years` },
            { label: 'Gender', value: personal.gender },
          ]}
        />

        <InfoCard
          icon={Calendar}
          title="Demographics"
          items={[
            { label: 'Nationality', value: personal.nationality || 'Not provided' },
            { label: 'Occupation', value: personal.occupation || 'Not provided' },
            { label: 'Marital Status', value: personal.marital_status || 'Not provided' },
          ]}
        />

        <InfoCard
          icon={Star}
          title="Identification"
          items={[
            { label: 'Patient ID', value: patient.patient_id },
            { label: 'Registration Date', value: formatDate(patient.created_at) },
          ]}
        />
      </div>
    </div>
  );
}

// Medical Details Component
function MedicalDetails({ patient, getMedicalData, getVitalsData, formatDate }) {
  const medical = getMedicalData();
  const vitals = getVitalsData();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard
          icon={Heart}
          title="Vital Statistics"
          items={[
            { label: 'Blood Type', value: medical.blood_type || 'Not recorded' },
            { label: 'Height', value: medical.height ? `${medical.height} cm` : 'Not recorded' },
            { label: 'Weight', value: medical.weight ? `${medical.weight} kg` : 'Not recorded' },
          ]}
        />

        <div className="md:col-span-2 lg:col-span-1">
          <InfoCard
            icon={Stethoscope}
            title="Care Team"
            items={[
              { label: 'Primary Physician', value: medical.primary_physician || 'Not assigned' },
            ]}
          />
        </div>
      </div>

      {/* Medical History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Medical History
          </h4>
          <div className="text-sm text-gray-600">
            {medical.medical_history || 'No medical history recorded.'}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Current Medications
          </h4>
          <div className="text-sm text-gray-600">
            {medical.current_medications || 'No current medications recorded.'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact Details Component
function ContactDetails({ patient, getPersonalData, getContactData, getEmergencyData }) {
  const personal = getPersonalData();
  const contact = getContactData();
  const emergency = getEmergencyData();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard
          icon={Mail}
          title="Contact Details"
          items={[
            { label: 'Email', value: personal.email || contact.email || 'Not provided' },
            { label: 'Mobile', value: contact.mobile_number || 'Not provided' },
            { label: 'Telephone', value: contact.telephone || 'Not provided' },
          ]}
        />

        <InfoCard
          icon={MapPin}
          title="Address"
          items={[
            { label: 'Street', value: contact.street_address || 'Not provided' },
            { label: 'Barangay', value: contact.barangay || 'Not provided' },
            { label: 'City/Municipality', value: contact.city_municipality || 'Not provided' },
            { label: 'Province', value: contact.province || 'Not provided' },
            { label: 'Postal Code', value: contact.postal_code || 'Not provided' },
          ]}
        />

        <InfoCard
          icon={Users}
          title="Emergency Contact"
          items={[
            { label: 'Name', value: emergency.contact_name || 'Not provided' },
            { label: 'Relation', value: emergency.relation || 'Not provided' },
            { label: 'Phone', value: emergency.phone || 'Not provided' },
            { label: 'Email', value: emergency.email || 'Not provided' },
          ]}
        />
      </div>
    </div>
  );
}

// Allergy Details Component
function AllergyDetails({ patient, getAllergiesData }) {
  const allergies = getAllergiesData();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Allergies & Reactions</h3>
      
      {allergies && allergies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allergies.map((allergy, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">{allergy.allergen || 'Unknown Allergen'}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  allergy.severity === 'Severe' ? 'bg-red-100 text-red-800' :
                  allergy.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {allergy.severity || 'Unknown'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Reaction:</strong> {allergy.reaction || 'Not specified'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No allergies recorded for this patient.</p>
        </div>
      )}
    </div>
  );
}

// Visit Details Component
function VisitDetails({ patient, visits, formatDate, onAddVisit, fetchVisits }) {
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showVisitModal, setShowVisitModal] = useState(false);

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs rounded font-medium border";
    switch (status) {
      case 'In-progress':
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-400`;
      case 'Completed':
        return `${baseClasses} bg-white text-gray-900 border-gray-400`;
      case 'Cancelled':
        return `${baseClasses} bg-gray-50 text-gray-600 border-gray-300`;
      case 'Scheduled':
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-400`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'In-progress':
        return <Activity className="w-4 h-4 text-gray-700" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-gray-700" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'Scheduled':
        return <Clock className="w-4 h-4 text-gray-700" />;
      default:
        return <Clock className="w-4 h-4 text-gray-700" />;
    }
  };

  const handleViewVisit = (visit) => {
    setSelectedVisit(visit);
    setShowVisitModal(true);
  };

  const handleCloseModal = () => {
    setShowVisitModal(false);
    setSelectedVisit(null);
  };

  const handleRefresh = async () => {
    setLoadingVisits(true);
    await fetchVisits();
    setLoadingVisits(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Visit History</h3>
          <p className="text-sm text-gray-600 mt-1">Patient visit records and appointments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loadingVisits}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${loadingVisits ? 'animate-spin' : ''}`} />
            <span>{loadingVisits ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={onAddVisit}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border border-black text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Visit</span>
          </button>
        </div>
      </div>

      {visits.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Physician
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visits.map((visit) => (
                <tr key={visit.record_no} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 border-r border-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(visit.date_scheduled)}
                    </div>
                    {visit.time_scheduled && (
                      <div className="text-xs text-gray-600 mt-1">
                        {visit.time_scheduled}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 border-r border-gray-200">
                    <span className="text-sm text-gray-900 font-medium">
                      {visit.visit_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-r border-gray-200">
                    <div className="text-sm text-gray-900">
                      {visit.doctor_name || 'Not assigned'}
                    </div>
                    {visit.doctor_department && (
                      <div className="text-xs text-gray-600 mt-1">
                        {visit.doctor_department}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 border-r border-gray-200">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(visit.visit_status)}
                      <span className={getStatusBadge(visit.visit_status)}>
                        {visit.visit_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewVisit(visit)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-white">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Visit Records</h4>
          <p className="text-gray-600 mb-4">No visit history available for this patient.</p>
          <button
            onClick={onAddVisit}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border border-black text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule First Visit</span>
          </button>
        </div>
      )}

      {/* Visit Detail Modal */}
      {showVisitModal && selectedVisit && (
        <VisitDetailModal 
          visit={selectedVisit}
          onClose={handleCloseModal}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// NEW: Laboratory Details Component - ADDED HERE
function LaboratoryDetails({ patientId, patientName, formatDate, formatDateTime }) {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Fetch lab tests on component mount
  useEffect(() => {
    if (patientId) {
      fetchLabTests();
    }
  }, [patientId]);

  const fetchLabTests = async () => {
    setLoading(true);
    try {
      // Fixed endpoint URL - using dynamic patientId
      const response = await axios.get(`http://localhost:5000/lab/patient/${patientId}`);
      console.log('Lab API Response:', response.data);
      
      if (response.data.success) {
        // API returns "tests" array, not "data" array
        setLabTests(response.data.tests || []);
      } else {
        setLabTests([]);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      setLabTests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Requested':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200">Requested</span>;
      case 'In Progress':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">In Progress</span>;
      case 'Completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">Completed</span>;
      case 'Cancelled':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full border border-red-200">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full border border-gray-200">{status}</span>;
    }
  };

  const handleRefresh = async () => {
    await fetchLabTests();
  };

  const handleViewResult = (test) => {
    setSelectedTest(test);
    setShowResultModal(true);
  };

  const handleRequestTest = () => {
    setShowRequestModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Laboratory Tests</h3>
          <p className="text-sm text-gray-600 mt-1">Laboratory test requests and results for {patientName}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={handleRequestTest}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border border-black text-sm font-medium"
          >
            <FlaskRound className="w-4 h-4" />
            <span>Request Test</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading laboratory tests...</p>
        </div>
      ) : labTests.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Special Instructions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Additional Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Requested On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {labTests.map((test) => (
                  <tr key={test.record_no} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">
                        <TestTube className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{test.test_name}</div>
                          <div className="text-xs text-gray-500">Record #{test.record_no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-normal border-r border-gray-200">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {test.special_instruction || 'None'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-normal border-r border-gray-200">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {test.additional_notes || 'None'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="text-sm text-gray-900">
                        {formatDateTime ? formatDateTime(test.date_requested) : new Date(test.date_requested).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      {getStatusBadge(test.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewResult(test)}
                          className="flex items-center space-x-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={test.status !== 'Completed'}
                          title={test.status !== 'Completed' ? 'Results not available yet' : 'View Results'}
                        >
                          <Eye className="w-4 h-4" />
                          <span>Results</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-white">
          <FlaskRound className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Laboratory Tests</h4>
          <p className="text-gray-600 mb-4">No laboratory test requests available for this patient.</p>
          <button
            onClick={handleRequestTest}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border border-black text-sm font-medium"
          >
            <FlaskRound className="w-4 h-4" />
            <span>Request First Test</span>
          </button>
        </div>
      )}

      {/* Request Lab Test Modal */}
      {showRequestModal && (
        <RequestLabTestModal
          onClose={() => setShowRequestModal(false)}
          onSave={() => {
            fetchLabTests();
            setShowRequestModal(false);
          }}
          patientName={patientName}
          patientId={patientId}
        />
      )}

      {/* Lab Results Modal */}
      {showResultModal && selectedTest && (
        <LabResultsModal
          test={selectedTest}
          onClose={() => {
            setShowResultModal(false);
            setSelectedTest(null);
          }}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      )}
    </div>
  );
}

function RequestLabTestModal({ onClose, onSave, patientName, patientId }) {
  const [formData, setFormData] = useState({
    test_name: '',
    special_instruction: '',
    additional_notes: ''
  });

  const [availableTests, setAvailableTests] = useState([
    'X-Ray',
    'Complete Blood Count (CBC)'
  ]);

  // State for receipt
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedRecordNo, setSavedRecordNo] = useState(null); // Track saved record

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required field
    if (!formData.test_name) {
      alert("Please select a test name!");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get employee ID from localStorage
      const employeeId = localStorage.getItem("employee_id");
      
      if (!employeeId) {
        alert("Employee ID not found. Please log in again.");
        setIsSubmitting(false);
        return;
      }
      
      // Prepare data for backend
      const testData = {
        employee_id: parseInt(employeeId),
        patient_id: patientId,
        test_name: formData.test_name,
        special_instruction: formData.special_instruction || '',
        additional_notes: formData.additional_notes || '',
        status: 'Requested'
      };
      
      // Send request to backend
      const response = await axios.post("http://localhost:5000/lab/create", testData);
      
      if (response.data.success) {
        // Store the record number for later
        setSavedRecordNo(response.data.record_no);
        
        // Store the receipt data
        setReceiptData({
          html: response.data.receipt.html,
          receipt_number: response.data.receipt.receipt_number,
          lab_test_code: response.data.lab_test_code,
          patient_name: patientName,
          test_name: formData.test_name,
          record_no: response.data.record_no
        });
        
        // Show receipt modal
        setShowReceipt(true);
        
        // Reset form for next entry
        setFormData({
          test_name: '',
          special_instruction: '',
          additional_notes: ''
        });
        
        // DO NOT CALL onSave() HERE - wait until receipt is closed
        
      } else {
        alert("Error: " + response.data.message);
      }
    } catch (error) {
      console.error('Error requesting lab test:', error);
      alert("Error requesting test: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Function to handle receipt close
  const handleReceiptClose = () => {
    setShowReceipt(false);
    setReceiptData(null);
    
    // NOW call onSave to refresh parent data
    if (onSave) {
      onSave(savedRecordNo); // Pass the saved record number if needed
    }
    
    // Close the main modal
    onClose();
  };

  // Function to print receipt
  const printReceipt = () => {
    if (!receiptData) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptData.html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div 
          className="relative w-full max-w-2xl bg-white rounded-lg border border-gray-200 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Request Laboratory Test</h2>
              <p className="text-sm text-gray-600 mt-1">Patient: {patientName} (ID: {patientId})</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>

          {/* Test Request Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Test Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Name *
                </label>
                <select
                  name="test_name"
                  value={formData.test_name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a test</option>
                  {availableTests.map((test, index) => (
                    <option key={index} value={test}>{test}</option>
                  ))}
                  <option value="other">Other (specify in notes)</option>
                </select>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  name="special_instruction"
                  value={formData.special_instruction}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Any special instructions for the lab technician..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="additional_notes"
                  value={formData.additional_notes}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Additional notes or custom test name if 'Other' was selected..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-white bg-black rounded-md hover:bg-gray-800 transition-colors text-sm font-medium border border-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Requesting...
                  </>
                ) : (
                  'Request Test'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-4xl bg-white rounded-lg border border-gray-200 shadow-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Test Request Confirmation</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Your lab test has been requested successfully!
                </p>
              </div>
              <button
                onClick={handleReceiptClose}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6">
              {/* Success Message */}
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-800 font-medium">
                    Test requested successfully!
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Lab Test Code:</p>
                    <p className="text-lg font-bold text-gray-900">{receiptData.lab_test_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Record No:</p>
                    <p className="text-lg font-bold text-gray-900">{receiptData.record_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Receipt No:</p>
                    <p className="text-lg font-bold text-gray-900">{receiptData.receipt_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Test:</p>
                    <p className="text-lg font-bold text-gray-900">{receiptData.test_name}</p>
                  </div>
                </div>
              </div>

              {/* Receipt Preview */}
              <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                  <h3 className="font-medium text-gray-900">Receipt Preview</h3>
                </div>
                <div className="p-4 bg-white max-h-96 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: receiptData.html }} />
                </div>
              </div>

              {/* Important Information */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Important Information
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• <strong>Save your Lab Test Code:</strong> {receiptData.lab_test_code}</li>
                  <li>• Bring this receipt when collecting results</li>
                  <li>• Results are typically available within 24-48 hours</li>
                  <li>• For inquiries, quote your Receipt No: {receiptData.receipt_number}</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={printReceipt}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </button>
                <button
                  onClick={handleReceiptClose}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// NEW: Lab Results Modal Component - Updated for your API structure
function LabResultsModal({ test, onClose, formatDate, formatDateTime }) {
  // Helper function for status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Requested':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200">Requested</span>;
      case 'In Progress':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">In Progress</span>;
      case 'Completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">Completed</span>;
      case 'Cancelled':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full border border-red-200">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-lg border border-gray-200 shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Laboratory Test Details</h2>
              <p className="text-sm text-gray-600 mt-1">{test.test_name}</p>
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge(test.status)}
                <span className="text-sm text-gray-500">
                  Requested on: {formatDateTime ? formatDateTime(test.date_requested) : new Date(test.date_requested).toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Test Information */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Test Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Name:</span>
                  <span className="font-medium">{test.test_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Record No:</span>
                  <span className="font-medium">{test.record_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{test.status}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Request Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient ID:</span>
                  <span className="font-medium">{test.patient_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee ID:</span>
                  <span className="font-medium">{test.employee_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date Requested:</span>
                  <span className="font-medium">
                    {formatDateTime ? formatDateTime(test.date_requested) : new Date(test.date_requested).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {test.special_instruction && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Special Instructions</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">{test.special_instruction}</p>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {test.additional_notes && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Additional Notes</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">{test.additional_notes}</p>
              </div>
            </div>
          )}

          {/* Results Section (if completed) */}
          {test.status === 'Completed' && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Results</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center text-yellow-700 mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="font-medium">Results not yet available</span>
                </div>
                <p className="text-sm text-yellow-600">
                  Detailed lab results will appear here once they are entered into the system.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const departmentPositions = {
    "General Medicine": [
      "General Physician",
      "Pediatrician",
      "Obstetrician-Gynecologist (OB-GYN)",
    ],
    Surgery: ["Surgeon", "Orthopedic Doctor"],
    Specializations: ["Cardiologist", "Neurologist", "Oncologist"],
  };

// Updated AddVisitModal Component with Proper Department Filtering
function AddVisitModal({ onClose, onSave, patientName, patientId }) {
  const [doctorList, setDoctorList] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [timesheetRecords, setTimesheetRecords] = useState([]);
  const [loadingTimesheets, setLoadingTimesheets] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    date_scheduled: '',
    visit_type: 'Scheduled/Follow-up',
    visit_status: 'In-progress',
    visit_purpose_title: '',
    visit_chief_complaint: '',
    employee_id: ''
  });

  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  // Get departments from the departmentPositions object
  const departments = Object.keys(departmentPositions).map(dept => ({
    id: dept,
    name: dept
  }));

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors when department changes
  useEffect(() => {
    if (formData.department) {
      // Get the positions for the selected department
      const departmentPositionsList = departmentPositions[formData.department] || [];
      
      // Filter doctors whose position matches any of the department's positions
      const filtered = doctorList.filter(doctor => 
        departmentPositionsList.includes(doctor.position)
      );
      setFilteredDoctors(filtered);
      
      // Clear selected doctor if current selection doesn't belong to the new department
      if (formData.employee_id) {
        const currentDoctor = doctorList.find(doc => doc.employee_id === parseInt(formData.employee_id));
        if (currentDoctor && !departmentPositionsList.includes(currentDoctor.position)) {
          setFormData(prev => ({ ...prev, employee_id: '' }));
          setSelectedTime('');
          setAvailableTimeSlots([]);
        }
      }
    } else {
      // If no department selected, show all doctors
      setFilteredDoctors(doctorList);
    }
  }, [formData.department, doctorList]);

  // Fetch timesheet records when doctor changes
  useEffect(() => {
    if (formData.employee_id) {
      fetchTimesheetRecords(formData.employee_id);
    } else {
      setTimesheetRecords([]);
      setAvailableTimeSlots([]);
      setSelectedTime('');
    }
  }, [formData.employee_id]);

  // Update available time slots when date or timesheet records change
  useEffect(() => {
    if (formData.date_scheduled && formData.employee_id) {
      updateAvailableTimeSlots();
    } else {
      setAvailableTimeSlots([]);
      setSelectedTime('');
    }
  }, [formData.date_scheduled, timesheetRecords, formData.employee_id]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/fetch-doctors");
      const doctors = response.data.result || [];
      setDoctorList(doctors);
      setFilteredDoctors(doctors); // Initially show all doctors
    } catch (err) {
      console.log('Error fetching doctors:', err);
    }
  };

  const fetchTimesheetRecords = async (employeeId) => {
    setLoadingTimesheets(true);
    try {
      const response = await axios.get(`http://localhost:5000/time/timesheet/employee/${employeeId}`);
      if (response.data.success) {
        setTimesheetRecords(response.data.data);
      } else {
        setTimesheetRecords([]);
      }
    } catch (err) {
      console.error('Error fetching timesheet records:', err);
      setTimesheetRecords([]);
    } finally {
      setLoadingTimesheets(false);
    }
  };

  const updateAvailableTimeSlots = () => {
    if (!formData.date_scheduled || !formData.employee_id) {
      setAvailableTimeSlots([]);
      setSelectedTime('');
      return;
    }

    // Format the selected date to match the API response format
    const selectedDate = new Date(formData.date_scheduled);
    const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Filter timesheet records for the selected date AND employee
    const timesForSelectedDate = timesheetRecords
      .filter(record => {
        const matchesDate = record.timesheet_date === formattedSelectedDate;
        const matchesEmployee = record.employee_id === parseInt(formData.employee_id);
        return matchesDate && matchesEmployee;
      })
      .map(record => record.timesheet_time);

    // Sort times chronologically
    const sortedTimes = timesForSelectedDate.sort((a, b) => {
      const timeToMinutes = (time) => {
        const [timePart, period] = time.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);
        let totalMinutes = hours % 12 * 60 + minutes;
        if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
        if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
        return totalMinutes;
      };
      
      return timeToMinutes(a) - timeToMinutes(b);
    });

    setAvailableTimeSlots(sortedTimes);
    
    // Auto-select the first available time if none selected
    if (sortedTimes.length > 0 && !selectedTime) {
      setSelectedTime(sortedTimes[0]);
    } else if (sortedTimes.length === 0) {
      setSelectedTime('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const visitData = {
        patient_id: patientId,
        employee_id: formData.employee_id,
        date_scheduled: formData.date_scheduled,
        time_scheduled: selectedTime,
        visit_type: formData.visit_type,
        visit_status: formData.visit_status,
        visit_purpose_title: formData.visit_purpose_title,
        visit_chief_complaint: formData.visit_chief_complaint
      };
    
      console.log('Submitting visit data:', visitData);

      const response = await axios.post("http://localhost:5000/patient/visit/add-visit", visitData);
      
      if (response.data.success) {
        alert("Visit has been scheduled successfully!");
        onSave(response.data.data);
      } else {
        alert("Error: " + response.data.message);
      }
    } catch (error) {
      console.error('Error submitting visit:', error);
      alert("Error scheduling visit: " + (error.response?.data?.message || error.message));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedFormData);
    
    // Store employee_id in localStorage when it changes
    if (name === 'employee_id') {
      localStorage.setItem("selected_employee_id", value);
      setSelectedTime('');
    }
    
    // Clear time selection when date changes
    if (name === 'date_scheduled') {
      setSelectedTime('');
    }
  };

  // Get selected doctor's name for display
  const getSelectedDoctorName = () => {
    if (!formData.employee_id) return '';
    const doctor = doctorList.find(doc => doc.employee_id === parseInt(formData.employee_id));
    return doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : '';
  };

  // Get positions for the selected department for display
  const getDepartmentPositions = () => {
    if (!formData.department) return [];
    return departmentPositions[formData.department] || [];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-lg border border-gray-200 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule New Visit</h2>
            <p className="text-sm text-gray-600 mt-1">Patient: {patientName}</p>
            {formData.employee_id && (
              <p className="text-xs text-gray-500 mt-1">
                Selected Doctor: {getSelectedDoctorName()}
              </p>
            )}
            {loadingTimesheets && (
              <p className="text-xs text-gray-500 mt-1">Loading available time slots...</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Visit Form - Updated Layout with Proper Department Filtering */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {formData.department && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available positions: {getDepartmentPositions().join(', ')}
                  </p>
                )}
              </div>

              {/* Doctor Selection - NOW PROPERLY FILTERED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Doctor *
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  required
                  disabled={filteredDoctors.length === 0 && formData.department !== ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {filteredDoctors.length === 0 && formData.department 
                      ? `No doctors available in ${formData.department}`
                      : filteredDoctors.length === 0
                      ? 'No doctors available'
                      : 'Select a doctor'
                    }
                  </option>
                  {filteredDoctors.map(doctor => (
                    <option key={doctor.employee_id} value={doctor.employee_id}>
                      Dr. {doctor.first_name} {doctor.last_name} - {doctor.position}
                    </option>
                  ))}
                </select>
                {filteredDoctors.length === 0 && formData.department && (
                  <p className="text-xs text-gray-500 mt-1">
                    No doctors found for positions: {getDepartmentPositions().join(', ')}
                  </p>
                )}
                {filteredDoctors.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing {filteredDoctors.length} doctor(s) from {formData.department || 'all departments'}
                  </p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date_scheduled"
                    value={formData.date_scheduled}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    disabled={!formData.employee_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    disabled={availableTimeSlots.length === 0 || !formData.date_scheduled || !formData.employee_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.employee_id 
                        ? 'Select doctor first' 
                        : !formData.date_scheduled 
                        ? 'Select date first' 
                        : availableTimeSlots.length === 0 
                        ? 'No available slots' 
                        : 'Select time'
                      }
                    </option>
                    {availableTimeSlots.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {formData.date_scheduled && formData.employee_id && availableTimeSlots.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No time slots available for {getSelectedDoctorName()} on selected date
                    </p>
                  )}
                </div>
              </div>

              {/* Visit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Type
                </label>
                <select
                  name="visit_type"
                  value={formData.visit_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                >
                  <option value="Scheduled/Follow-Up">Scheduled/Follow-Up</option>
                </select>
              </div>

            
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Visit Purpose Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Purpose
                </label>
                <input
                  type="text"
                  name="visit_purpose_title"
                  value={formData.visit_purpose_title}
                  onChange={handleChange}
                  placeholder="e.g., Routine Checkup, Follow-up Consultation"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
                <div className="text-xs text-gray-500 text-right mt-1">
                  {formData.visit_purpose_title.length}/100
                </div>
              </div>

              {/* Chief Complaint */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chief Complaint
                </label>
                <textarea
                  name="visit_chief_complaint"
                  value={formData.visit_chief_complaint}
                  onChange={handleChange}
                  placeholder="Describe the reason for visit..."
                  maxLength={500}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none"
                />
                <div className="text-xs text-gray-500 text-right mt-1">
                  {formData.visit_chief_complaint.length}/500
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTime || availableTimeSlots.length === 0 || !formData.employee_id || !formData.visit_status}
              className="px-6 py-2 text-white bg-black rounded-md hover:bg-gray-800 transition-colors text-sm font-medium border border-black disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Schedule Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reusable Info Card Component
function InfoCard({ icon: Icon, title, items }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Icon className="w-4 h-4 text-blue-600" />
        <h4 className="font-medium text-gray-900">{title}</h4>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-500">{item.label}:</span>
            <span className="text-gray-900 font-medium text-right">
              {item.value || 'Not provided'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Move these components OUTSIDE the VisitDetailModal function
// Add them right after the VisitDetailModal function ends

// Visit Detail Modal (keep existing but ensure it's included)
function VisitDetailModal({ visit, onClose, formatDate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-2xl bg-white rounded-lg border border-gray-200 shadow-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Visit Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{formatDate(visit.date_scheduled)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium">{visit.time_scheduled || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Visit Type</p>
              <p className="font-medium">{visit.visit_type}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">{visit.visit_status}</p>
            </div>
            
            {visit.visit_purpose_title && (
              <div>
                <p className="text-sm text-gray-600">Purpose</p>
                <p className="font-medium">{visit.visit_purpose_title}</p>
              </div>
            )}
            
            {visit.visit_chief_complaint && (
              <div>
                <p className="text-sm text-gray-600">Chief Complaint</p>
                <p className="text-gray-900 whitespace-pre-wrap">{visit.visit_chief_complaint}</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ADMITTANCE HISTORY COMPONENT - MOVED HERE
function AdmittanceHistory({ patientId, patientName, formatDate, formatDateTime }) {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchAdmissions();
    }
  }, [patientId]);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/patients/${patientId}/admissions`);
      console.log('Admissions API Response:', response.data);
      
      if (response.data.success) {
        setAdmissions(response.data.admissions || []);
      } else {
        setAdmissions([]);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTriageBadge = (category) => {
    switch (category?.toLowerCase()) {
      case 'resuscitation':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full border border-red-200">Resuscitation</span>;
      case 'emergency':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full border border-orange-200">Emergency</span>;
      case 'urgent':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">Urgent</span>;
      case 'semi-urgent':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200">Semi-urgent</span>;
      case 'non-urgent':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">Non-urgent</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full border border-gray-200">{category || 'Unknown'}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'admitted':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200">Admitted</span>;
      case 'discharged':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">Discharged</span>;
      case 'transferred':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full border border-purple-200">Transferred</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full border border-gray-200">{status || 'Unknown'}</span>;
    }
  };

  const handleViewDetails = (admission) => {
    setSelectedAdmission(admission);
    setShowModal(true);
  };

  const handleRefresh = async () => {
    await fetchAdmissions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Admittance History</h3>
          <p className="text-sm text-gray-600 mt-1">Hospital admission records for {patientName}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admittance history...</p>
        </div>
      ) : admissions.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Admission Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Triage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Ward/Bed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admissions.map((admission) => (
                  <tr key={admission.admission_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate ? formatDate(admission.admission_date) : new Date(admission.admission_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {admission.admission_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="text-sm text-gray-900 capitalize">
                        {admission.admission_type || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      {getTriageBadge(admission.triage_category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="text-sm text-gray-900">
                        {admission.ward_id ? `${admission.ward_id} Ward` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Bed #{admission.bed_number || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      {getStatusBadge(admission.admission_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(admission)}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-white">
          <DoorClosed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Admission Records</h4>
          <p className="text-gray-600">No hospital admission history available for this patient.</p>
        </div>
      )}

      {/* Admission Details Modal */}
      {showModal && selectedAdmission && (
        <AdmissionDetailsModal
          admission={selectedAdmission}
          onClose={() => {
            setShowModal(false);
            setSelectedAdmission(null);
          }}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      )}
    </div>
  );
}

// Admission Details Modal Component
function AdmissionDetailsModal({ admission, onClose, formatDate, formatDateTime }) {
  const getTriageBadge = (category) => {
    switch (category?.toLowerCase()) {
      case 'resuscitation':
        return <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full border border-red-200 font-medium">Resuscitation</span>;
      case 'emergency':
        return <span className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full border border-orange-200 font-medium">Emergency</span>;
      case 'urgent':
        return <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200 font-medium">Urgent</span>;
      case 'semi-urgent':
        return <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full border border-blue-200 font-medium">Semi-urgent</span>;
      case 'non-urgent':
        return <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full border border-green-200 font-medium">Non-urgent</span>;
      default:
        return <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full border border-gray-200 font-medium">{category || 'Unknown'}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'admitted':
        return <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full border border-blue-200 font-medium">Admitted</span>;
      case 'discharged':
        return <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full border border-green-200 font-medium">Discharged</span>;
      case 'transferred':
        return <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full border border-purple-200 font-medium">Transferred</span>;
      default:
        return <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full border border-gray-200 font-medium">{status || 'Unknown'}</span>;
    }
  };

  const getFallRiskBadge = (score) => {
    switch (score?.toLowerCase()) {
      case 'high':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded border border-red-200">High Risk</span>;
      case 'moderate':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded border border-yellow-200">Moderate Risk</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded border border-green-200">Low Risk</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded border border-gray-200">{score || 'Unknown'}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-lg border border-gray-200 shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Admission Details</h2>
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge(admission.admission_status)}
                {getTriageBadge(admission.triage_category)}
                <span className="text-sm text-gray-500">
                  Admission ID: {admission.admission_id}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Admission Information */}
        <div className="p-6">
          {/* Admission Overview */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Admission Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Admission Date:</span>
                  <span className="font-medium">
                    {formatDate ? formatDate(admission.admission_date) : new Date(admission.admission_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admission Time:</span>
                  <span className="font-medium">{admission.admission_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{admission.admission_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode of Arrival:</span>
                  <span className="font-medium capitalize">{admission.mode_of_arrival || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Ward Assignment</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ward:</span>
                  <span className="font-medium">
                    {admission.ward_id ? `${admission.ward_id} Ward` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bed Number:</span>
                  <span className="font-medium">#{admission.bed_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance:</span>
                  <span className="font-medium">
                    {admission.insurance_provider || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Assessment */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Clinical Assessment</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-gray-600">Chief Complaint:</span>
                  <p className="font-medium mt-1">{admission.chief_complaint || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Diagnosis:</span>
                  <p className="font-medium mt-1">{admission.patient_diagnosis || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">Pain Score:</span>
                  <div className="flex items-center mt-1">
                    <span className="text-lg font-bold text-red-600">
                      {admission.pain_score !== null ? admission.pain_score : 'N/A'}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/10</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Pain Location:</span>
                  <p className="font-medium mt-1">{admission.pain_location || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fall Risk:</span>
                  <div className="mt-1">
                    {getFallRiskBadge(admission.fall_risk_score)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Status */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Patient Status</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">General Appearance:</span>
                  <p className="font-medium mt-1 capitalize">
                    {admission.general_appearance || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Mobility Status:</span>
                  <p className="font-medium mt-1 capitalize">
                    {admission.mobility_status || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Special Needs:</span>
                  <p className="font-medium mt-1">{admission.special_needs || 'None'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Care Orders */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Care Orders</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">Dietary Orders:</span>
                  <p className="font-medium mt-1 capitalize">
                    {admission.dietary_orders || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Activity Orders:</span>
                  <p className="font-medium mt-1 capitalize">
                    {admission.activity_orders || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Isolation Precautions:</span>
                  <p className="font-medium mt-1 capitalize">
                    {admission.isolation_precautions || 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Discharge Information (if applicable) */}
          {admission.discharge_date && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Discharge Information</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Discharge Date:</span>
                    <p className="font-medium mt-1">
                      {formatDate ? formatDate(admission.discharge_date) : new Date(admission.discharge_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Discharge Time:</span>
                    <p className="font-medium mt-1">{admission.discharge_time || 'N/A'}</p>
                  </div>
                </div>
                {admission.discharge_summary && (
                  <div className="mt-4">
                    <span className="text-gray-600">Discharge Summary:</span>
                    <p className="font-medium mt-1 whitespace-pre-wrap">
                      {admission.discharge_summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
            <div className="flex justify-between">
              <span>Created: {formatDateTime ? formatDateTime(admission.created_at) : new Date(admission.created_at).toLocaleString()}</span>
              <span>Last Updated: {formatDateTime ? formatDateTime(admission.updated_at) : new Date(admission.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}