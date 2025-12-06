import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  CalendarIcon, 
  IdentificationIcon, 
  ClipboardDocumentListIcon,
  HeartIcon,
  PencilIcon,
  ClockIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  ScaleIcon,
  UserGroupIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

const PatientDetails = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [patientData, setPatientData] = useState({
    patient_id: null,
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    occupation: "",
    email: "",
    marital_status: "",
    street_address: "",
    barangay: "",
    city_municipality: "",
    province: "",
    region: "",
    postal_code: "",
    mobile_number: "",
    telephone: "",
    medical: {
      blood_type: "",
      height: "",
      weight: "",
      primary_physician: "",
      medical_history: "",
      current_medications: ""
    },
    vitals: {
      blood_pressure: "",
      heart_rate: "",
      temperature: "",
      respiratory_rate: "",
      oxygen_saturation: ""
    },
    emergency: {
      contact_name: "",
      relation: "",
      phone: "",
      email: ""
    },
    allergies: []
  });

  // Consultation form state
  const [consultation, setConsultation] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    reason: "",
    symptoms: "",
    duration: "",
    severity: "moderate",
    vitalSigns: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      respiratoryRate: "",
      oxygenSaturation: ""
    },
    examination: {
      generalAppearance: "",
      cardiovascular: "",
      respiratory: "",
      abdominal: "",
      neurological: ""
    },
    assessment: "",
    diagnosis: "",
    plan: "",
    prescriptions: [],
    followUp: "",
    notes: "",
    attachedLabTests: [] // NEW: Array to store attached lab tests
  });

  // NEW: State for lab tests modal
  const [showLabTestsModal, setShowLabTestsModal] = useState(false);
  const [labTests, setLabTests] = useState([]);
  const [loadingLabTests, setLoadingLabTests] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [showLabTestDetails, setShowLabTestDetails] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientData(patientId);
    }
  }, [patientId]);

  const fetchPatientData = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/patients/${id}`);
      
      if (response.data.success && response.data.patient) {
        setPatientData(response.data.patient);
      } else {
        setError('Failed to fetch patient data');
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Error loading patient information');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch lab tests for the patient
  const fetchLabTests = async () => {
    if (!patientId) return;
    
    try {
      setLoadingLabTests(true);
      const response = await axios.get(`http://localhost:5000/lab/patient/${patientId}`);
      
      if (response.data.success) {
        setLabTests(response.data.tests || []);
      } else {
        setLabTests([]);
      }
    } catch (err) {
      console.error('Error fetching lab tests:', err);
      setLabTests([]);
    } finally {
      setLoadingLabTests(false);
    }
  };

  // NEW: Open lab tests modal and fetch data
  const handleOpenLabTestsModal = () => {
    setShowLabTestsModal(true);
    fetchLabTests();
  };

  // NEW: Attach a lab test to consultation
  const handleAttachLabTest = (labTest) => {
    // Check if already attached
    const isAlreadyAttached = consultation.attachedLabTests.some(
      test => test.record_no === labTest.record_no
    );
    
    if (!isAlreadyAttached) {
      setConsultation(prev => ({
        ...prev,
        attachedLabTests: [...prev.attachedLabTests, labTest]
      }));
      setSuccessMessage(`✅ Lab test "${labTest.test_name}" attached successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setError(`Lab test "${labTest.test_name}" is already attached`);
      setTimeout(() => setError(''), 3000);
    }
  };

  // NEW: Remove attached lab test
  const handleRemoveLabTest = (recordNo) => {
    setConsultation(prev => ({
      ...prev,
      attachedLabTests: prev.attachedLabTests.filter(test => test.record_no !== recordNo)
    }));
  };

  // NEW: View lab test details
  const handleViewLabTestDetails = (labTest) => {
    setSelectedLabTest(labTest);
    setShowLabTestDetails(true);
  };

  const handleInputChange = (section, field, value) => {
    if (section.includes('.')) {
      const [parent, child] = section.split('.');
      setPatientData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setPatientData(prev => ({
        ...prev,
        [section]: value
      }));
    }
  };

  const handleConsultationChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConsultation(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setConsultation(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveConsultation = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      setError(null);
      
      const employeeId = localStorage.getItem('employee_id');
      const appointment_code = localStorage.getItem('selected_appointment_code');
      
      // Prepare the data with attached lab tests
      const consultationData = {
        patientId: patientData.patient_id,
        appointment_code: appointment_code,
        employeeId: parseInt(employeeId),
        reason: consultation.reason,
        symptoms: consultation.symptoms,
        duration: consultation.duration,
        severity: consultation.severity,
        
        // Examination fields
        generalAppearance: consultation.examination.generalAppearance,
        cardiovascular: consultation.examination.cardiovascular,
        respiratory: consultation.examination.respiratory,
        abdominal: consultation.examination.abdominal,
        neurological: consultation.examination.neurological,
        
        // Assessment & Diagnosis
        assessment: consultation.assessment,
        diagnosis: consultation.diagnosis,
        plan: consultation.plan,
        follow_up: consultation.followUp,
        notes: consultation.notes,
        
        // Vital Signs
        bloodPressure: consultation.vitalSigns.bloodPressure,
        heartRate: consultation.vitalSigns.heartRate,
        temperature: consultation.vitalSigns.temperature,
        respiratoryRate: consultation.vitalSigns.respiratoryRate,
        oxygenSaturation: consultation.vitalSigns.oxygenSaturation,
        
        // NEW: Include attached lab tests
        attachedLabTests: consultation.attachedLabTests.map(test => test.record_no)
      };

      console.log('=== Sending consultation data ===');
      console.log('Attached lab tests:', consultationData.attachedLabTests);
  
      const response = await axios.post(
        'http://localhost:5000/patient/consultation/add-consultations',
        consultationData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Response from server:', response.data);

      if (response.data.success) {
        setSuccessMessage(`✅ Consultation saved successfully! ID: ${response.data.consultationId}`);
        
        // Reset form
        setConsultation({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          reason: "",
          symptoms: "",
          duration: "",
          severity: "moderate",
          vitalSigns: {
            bloodPressure: "",
            heartRate: "",
            temperature: "",
            respiratoryRate: "",
            oxygenSaturation: ""
          },
          examination: {
            generalAppearance: "",
            cardiovascular: "",
            respiratory: "",
            abdominal: "",
            neurological: ""
          },
          assessment: "",
          diagnosis: "",
          plan: "",
          prescriptions: [],
          followUp: "",
          notes: "",
          attachedLabTests: [] // Reset attached lab tests
        });

        fetchPatientData(patientData.patient_id);
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        setError(`Failed to save: ${response.data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('=== ERROR SAVING CONSULTATION ===');
      console.error('Full error:', err);
      
      if (err.response) {
        if (err.response.data.error) {
          setError(`Server error: ${err.response.data.error}`);
        } else if (err.response.data.message) {
          setError(`Server error: ${err.response.data.message}`);
        } else {
          setError(`Error ${err.response.status}: ${err.response.statusText}`);
        }
      } else if (err.request) {
        setError('No response from server. Is the backend running?');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // NEW: Get status badge color
  const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'requested':
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // NEW: Check if lab test has image
  const hasImage = (labTest) => {
    return labTest.primary_image_path && labTest.primary_image_path.trim() !== '';
  };

  // NEW: Get image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    return `http://localhost:5000/${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading patient information...</div>
      </div>
    );
  }

  if (error && !patientData.patient_id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white p-4 md:p-6 overflow-auto">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-100 pb-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-normal text-gray-900">
                  {`${patientData.first_name} ${patientData.middle_name} ${patientData.last_name}`.trim()}
                </h1>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500">ID: {patientData.patient_id}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">Age: {calculateAge(patientData.date_of_birth)}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{patientData.gender}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Active Consultation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Patient Information */}
        <div className="lg:w-1/3">
          <div className="bg-white border border-gray-200 rounded-lg mb-6">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <UserIcon className="h-3 w-3 text-gray-600" />
                </div>
                <h2 className="text-base font-normal text-gray-900">Patient Information</h2>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-1.5 rounded ${isEditing ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {isEditing ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <PencilIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <div className="p-4">
              {/* Tabs */}
              <div className="flex border-b border-gray-100 mb-4">
                <button 
                  className={`py-2 px-4 text-sm ${activeTab === 'personal' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('personal')}
                >
                  Personal
                </button>
                <button 
                  className={`py-2 px-4 text-sm ${activeTab === 'medical' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('medical')}
                >
                  Medical
                </button>
                <button 
                  className={`py-2 px-4 text-sm ${activeTab === 'contact' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('contact')}
                >
                  Contact
                </button>
              </div>
              
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={patientData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                        />
                      ) : (
                        <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.first_name || '—'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={patientData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                        />
                      ) : (
                        <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.last_name || '—'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                    {isEditing ? (
                      <input 
                        type="date" 
                        value={patientData.date_of_birth?.split('T')[0]}
                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">
                        {formatDate(patientData.date_of_birth)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                    {isEditing ? (
                      <select 
                        value={patientData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.gender || '—'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nationality</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={patientData.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.nationality || '—'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Occupation</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={patientData.occupation}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.occupation || '—'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Marital Status</label>
                    {isEditing ? (
                      <select 
                        value={patientData.marital_status}
                        onChange={(e) => handleInputChange('marital_status', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      >
                        <option value="">Select status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.marital_status || '—'}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Medical Tab */}
              {activeTab === 'medical' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Blood Type</label>
                    {isEditing ? (
                      <select 
                        value={patientData.medical?.blood_type}
                        onChange={(e) => handleInputChange('medical.blood_type', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      >
                        <option value="">Select blood type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.medical?.blood_type || '—'}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={patientData.medical?.height}
                          onChange={(e) => handleInputChange('medical.height', e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                        />
                      ) : (
                        <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.medical?.height || '—'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={patientData.medical?.weight}
                          onChange={(e) => handleInputChange('medical.weight', e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                        />
                      ) : (
                        <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.medical?.weight || '—'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Primary Physician</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={patientData.medical?.primary_physician}
                        onChange={(e) => handleInputChange('medical.primary_physician', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.medical?.primary_physician || '—'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Allergies</label>
                    <div className="space-y-1">
                      {patientData.allergies && patientData.allergies.length > 0 ? (
                        patientData.allergies.map((allergy, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <ExclamationTriangleIcon className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-900">{allergy.allergen}: {allergy.reaction}</span>
                          </div>
                        ))
                      ) : (
                        <p className="p-2 text-sm text-gray-500 bg-gray-50 rounded">No allergies recorded</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Medical History</label>
                    {isEditing ? (
                      <textarea 
                        value={patientData.medical?.medical_history}
                        onChange={(e) => handleInputChange('medical.medical_history', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                        rows="3"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded whitespace-pre-wrap">
                        {patientData.medical?.medical_history || '—'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Current Medications</label>
                    {isEditing ? (
                      <textarea 
                        value={patientData.medical?.current_medications}
                        onChange={(e) => handleInputChange('medical.current_medications', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                        rows="3"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded whitespace-pre-wrap">
                        {patientData.medical?.current_medications || '—'}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    {isEditing ? (
                      <input 
                        type="email" 
                        value={patientData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.email || '—'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number</label>
                    {isEditing ? (
                      <input 
                        type="tel" 
                        value={patientData.mobile_number}
                        onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.mobile_number || '—'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telephone</label>
                    {isEditing ? (
                      <input 
                        type="tel" 
                        value={patientData.telephone}
                        onChange={(e) => handleInputChange('telephone', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.telephone || '—'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                    {isEditing ? (
                      <textarea 
                        value={`${patientData.street_address || ''} ${patientData.barangay || ''} ${patientData.city_municipality || ''} ${patientData.province || ''} ${patientData.region || ''} ${patientData.postal_code || ''}`.trim()}
                        onChange={(e) => {
                          handleInputChange('street_address', e.target.value);
                        }}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                        rows="3"
                      />
                    ) : (
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">
                        {`${patientData.street_address || ''} ${patientData.barangay || ''} ${patientData.city_municipality || ''} ${patientData.province || ''} ${patientData.region || ''} ${patientData.postal_code || ''}`.trim() || '—'}
                      </p>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <UserGroupIcon className="h-4 w-4 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-900">Emergency Contact</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={patientData.emergency?.contact_name}
                            onChange={(e) => handleInputChange('emergency.contact_name', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                          />
                        ) : (
                          <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.emergency?.contact_name || '—'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Relation</label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={patientData.emergency?.relation}
                            onChange={(e) => handleInputChange('emergency.relation', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                          />
                        ) : (
                          <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.emergency?.relation || '—'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                        {isEditing ? (
                          <input 
                            type="tel" 
                            value={patientData.emergency?.phone}
                            onChange={(e) => handleInputChange('emergency.phone', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                          />
                        ) : (
                          <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">{patientData.emergency?.phone || '—'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Vital Signs Card */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <HeartIcon className="h-3 w-3 text-gray-600" />
                </div>
                <h2 className="text-base font-normal text-gray-900">Latest Vital Signs</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Blood Pressure</label>
                  <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">
                    {patientData.vitals?.blood_pressure || '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Heart Rate</label>
                  <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">
                    {patientData.vitals?.heart_rate ? `${patientData.vitals.heart_rate} bpm` : '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Temperature</label>
                  <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">
                    {patientData.vitals?.temperature ? `${patientData.vitals.temperature}°C` : '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Respiratory Rate</label>
                  <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">
                    {patientData.vitals?.respiratory_rate ? `${patientData.vitals.respiratory_rate} breaths/min` : '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Oxygen Saturation</label>
                  <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded">
                    {patientData.vitals?.oxygen_saturation ? `${patientData.vitals.oxygen_saturation}%` : '—'}
                  </p>
                </div>
              </div>
              {patientData.vitals?.recorded_at && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Recorded: {formatDate(patientData.vitals.recorded_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Panel - Doctor Consultation Form */}
        <div className="lg:w-2/3">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-3 w-3 text-gray-600" />
                  </div>
                  <h2 className="text-base font-normal text-gray-900">Consultation Form</h2>
                </div>
                <div className="text-sm text-gray-500">
                  {consultation.date} • {consultation.time}
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason for Visit</label>
                <input 
                  type="text" 
                  value={consultation.reason}
                  onChange={(e) => handleConsultationChange('reason', e.target.value)}
                  placeholder="Chief complaint or reason for visit"
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-600 mb-1">Symptoms</label>
                <textarea 
                  value={consultation.symptoms}
                  onChange={(e) => handleConsultationChange('symptoms', e.target.value)}
                  placeholder="Describe symptoms in detail"
                  rows="3"
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                  <input 
                    type="text" 
                    value={consultation.duration}
                    onChange={(e) => handleConsultationChange('duration', e.target.value)}
                    placeholder="How long have symptoms persisted?"
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Severity</label>
                  <select 
                    value={consultation.severity}
                    onChange={(e) => handleConsultationChange('severity', e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
              </div>
              
              {/* Vital Signs */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                    <HeartIcon className="h-2.5 w-2.5 text-gray-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Vital Signs</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">BP (mmHg)</label>
                    <input 
                      type="text" 
                      value={consultation.vitalSigns.bloodPressure}
                      onChange={(e) => handleConsultationChange('vitalSigns.bloodPressure', e.target.value)}
                      placeholder="120/80"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">HR (bpm)</label>
                    <input 
                      type="text" 
                      value={consultation.vitalSigns.heartRate}
                      onChange={(e) => handleConsultationChange('vitalSigns.heartRate', e.target.value)}
                      placeholder="72"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Temp (°C/°F)</label>
                    <input 
                      type="text" 
                      value={consultation.vitalSigns.temperature}
                      onChange={(e) => handleConsultationChange('vitalSigns.temperature', e.target.value)}
                      placeholder="98.6°F"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">RR (breaths/min)</label>
                    <input 
                      type="text" 
                      value={consultation.vitalSigns.respiratoryRate}
                      onChange={(e) => handleConsultationChange('vitalSigns.respiratoryRate', e.target.value)}
                      placeholder="16"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SpO2 (%)</label>
                    <input 
                      type="text" 
                      value={consultation.vitalSigns.oxygenSaturation}
                      onChange={(e) => handleConsultationChange('vitalSigns.oxygenSaturation', e.target.value)}
                      placeholder="98"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              
              {/* Physical Examination */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Physical Examination</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">General Appearance</label>
                    <textarea 
                      value={consultation.examination.generalAppearance}
                      onChange={(e) => handleConsultationChange('examination.generalAppearance', e.target.value)}
                      placeholder="Patient's general appearance, distress level, etc."
                      rows="2"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cardiovascular</label>
                      <textarea 
                        value={consultation.examination.cardiovascular}
                        onChange={(e) => handleConsultationChange('examination.cardiovascular', e.target.value)}
                        placeholder="Heart sounds, murmurs, etc."
                        rows="2"
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Respiratory</label>
                      <textarea 
                        value={consultation.examination.respiratory}
                        onChange={(e) => handleConsultationChange('examination.respiratory', e.target.value)}
                        placeholder="Lung sounds, breathing pattern, etc."
                        rows="2"
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Abdominal</label>
                      <textarea 
                        value={consultation.examination.abdominal}
                        onChange={(e) => handleConsultationChange('examination.abdominal', e.target.value)}
                        placeholder="Bowel sounds, tenderness, etc."
                        rows="2"
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Neurological</label>
                      <textarea 
                        value={consultation.examination.neurological}
                        onChange={(e) => handleConsultationChange('examination.neurological', e.target.value)}
                        placeholder="Mental status, reflexes, coordination, etc."
                        rows="2"
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Assessment & Diagnosis */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Assessment & Diagnosis</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Assessment</label>
                    <textarea 
                      value={consultation.assessment}
                      onChange={(e) => handleConsultationChange('assessment', e.target.value)}
                      placeholder="Clinical assessment and impression"
                      rows="3"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Diagnosis</label>
                    <textarea 
                      value={consultation.diagnosis}
                      onChange={(e) => handleConsultationChange('diagnosis', e.target.value)}
                      placeholder="Primary and secondary diagnoses"
                      rows="3"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* NEW: Attached Lab Tests Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <BeakerIcon className="h-2.5 w-2.5 text-gray-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">Attached Lab Tests</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenLabTestsModal}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
                  >
                    <PlusIcon className="h-3 w-3" />
                    Attach Lab Test
                  </button>
                </div>
                
                {consultation.attachedLabTests.length > 0 ? (
                  <div className="space-y-2">
                    {consultation.attachedLabTests.map((labTest) => (
                      <div key={labTest.record_no} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <BeakerIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{labTest.test_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">Record: #{labTest.record_no}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(labTest.status)}`}>
                                {labTest.status}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(labTest.date_requested)}
                              </span>
                            </div>
                            {/* Dynamic display of test info */}
                            {labTest.findings && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                <span className="font-medium">Findings:</span> {labTest.findings}
                              </p>
                            )}
                            {labTest.impression && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                <span className="font-medium">Impression:</span> {labTest.impression}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewLabTestDetails(labTest)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveLabTest(labTest.record_no)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remove"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    <BeakerIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1">No lab tests attached</p>
                    <p className="text-xs text-gray-400">Click "Attach Lab Test" to add relevant lab results</p>
                  </div>
                )}
              </div>
              
              {/* Treatment Plan */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Treatment Plan</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
                    <textarea 
                      value={consultation.plan}
                      onChange={(e) => handleConsultationChange('plan', e.target.value)}
                      placeholder="Treatment plan, procedures, referrals, etc."
                      rows="3"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up</label>
                    <input 
                      type="text" 
                      value={consultation.followUp}
                      onChange={(e) => handleConsultationChange('followUp', e.target.value)}
                      placeholder="Follow-up instructions and timeline"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              
              {/* Additional Notes */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
                <textarea 
                  value={consultation.notes}
                  onChange={(e) => handleConsultationChange('notes', e.target.value)}
                  placeholder="Any additional notes or observations"
                  rows="3"
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:border-gray-500 focus:outline-none"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    setConsultation({
                      date: new Date().toISOString().split('T')[0],
                      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                      reason: "",
                      symptoms: "",
                      duration: "",
                      severity: "moderate",
                      vitalSigns: {
                        bloodPressure: "",
                        heartRate: "",
                        temperature: "",
                        respiratoryRate: "",
                        oxygenSaturation: ""
                      },
                      examination: {
                        generalAppearance: "",
                        cardiovascular: "",
                        respiratory: "",
                        abdominal: "",
                        neurological: ""
                      },
                      assessment: "",
                      diagnosis: "",
                      plan: "",
                      prescriptions: [],
                      followUp: "",
                      notes: "",
                      attachedLabTests: []
                    });
                    setSuccessMessage('Form cleared successfully!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }}
                >
                  Clear Form
                </button>
                <button 
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSaveConsultation}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Save Consultation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Lab Tests Modal */}
      {showLabTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-normal text-gray-900">Available Lab Tests</h2>
                  <p className="text-sm text-gray-600 mt-1">Select lab tests to attach to this consultation</p>
                </div>
                <button
                  onClick={() => setShowLabTestsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingLabTests ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading lab tests...</p>
                </div>
              ) : labTests.length > 0 ? (
                <div className="space-y-3">
                  {labTests.map((labTest) => {
                    const isAttached = consultation.attachedLabTests.some(
                      test => test.record_no === labTest.record_no
                    );
                    
                    return (
                      <div key={labTest.record_no} className={`p-4 border rounded-lg ${isAttached ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded flex items-center justify-center ${isAttached ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              <BeakerIcon className={`h-5 w-5 ${isAttached ? 'text-blue-600' : 'text-gray-600'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium text-gray-900">{labTest.test_name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(labTest.status)}`}>
                                  {labTest.status}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">Record #{labTest.record_no}</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">Code: {labTest.lab_test_code}</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">
                                  Requested: {formatDateTime(labTest.date_requested)}
                                </span>
                              </div>
                              
                              {/* Dynamic display based on test type */}
                              {labTest.test_name?.toLowerCase().includes('x-ray') && hasImage(labTest) && (
                                <div className="mt-2 flex items-center gap-1">
                                
                                  <span className="text-xs font-medium text-gray-600">Image Available</span>
                                </div>
                              )}
                              
                              {labTest.findings && (
                                <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                  <span className="font-medium">Findings:</span> {labTest.findings}
                                </p>
                              )}
                              
                              {labTest.impression && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  <span className="font-medium">Impression:</span> {labTest.impression}
                                </p>
                              )}
                              
                              {labTest.special_instruction && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                  <span className="font-medium">Instructions:</span> {labTest.special_instruction}
                                </p>
                              )}
                              
                              {labTest.additional_notes && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                  <span className="font-medium">Notes:</span> {labTest.additional_notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewLabTestDetails(labTest)}
                              className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                              <EyeIcon className="h-3 w-3 inline mr-1" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttachLabTest(labTest)}
                              disabled={isAttached}
                              className={`px-3 py-1.5 text-xs rounded ${isAttached 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                            >
                              {isAttached ? 'Attached' : 'Attach'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BeakerIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Lab Tests Found</h3>
                  <p className="text-gray-600">No laboratory tests available for this patient.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {consultation.attachedLabTests.length} test(s) attached to this consultation
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLabTestsModal(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowLabTestsModal(false)}
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Lab Test Details Modal */}
      {/* NEW: Lab Test Details Modal */}
{showLabTestDetails && selectedLabTest && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-normal text-gray-900">{selectedLabTest.test_name} - Test Details</h2>
            <p className="text-sm text-gray-600 mt-1">Complete laboratory test information</p>
          </div>
          <button
            onClick={() => setShowLabTestDetails(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        <div className="space-y-6">
          {/* Test Header */}
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BeakerIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedLabTest.test_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedLabTest.status)}`}>
                    {selectedLabTest.status}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">Code: {selectedLabTest.lab_test_code}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Record #{selectedLabTest.record_no}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDateTime(selectedLabTest.date_requested)}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Test Details */}
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">Patient Information</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Patient ID</label>
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded border border-gray-100">
                        {selectedLabTest.patient_id}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Patient Name</label>
                      <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded border border-gray-100">
                        {selectedLabTest.first_name} {selectedLabTest.last_name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Requested By</label>
                    <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded border border-gray-100">
                      Employee ID: {selectedLabTest.employee_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Information */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">Test Information</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Test Name</label>
                    <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded border border-gray-100">
                      {selectedLabTest.test_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Lab Test Code</label>
                    <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded border border-gray-100 font-mono">
                      {selectedLabTest.lab_test_code}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <p className={`p-2 text-sm rounded border ${getStatusBadge(selectedLabTest.status)}`}>
                      {selectedLabTest.status}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date Requested</label>
                    <p className="p-2 text-sm text-gray-900 bg-gray-50 rounded border border-gray-100">
                      {formatDateTime(selectedLabTest.date_requested)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedLabTest.special_instruction && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Special Instructions</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedLabTest.special_instruction}
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedLabTest.additional_notes && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Additional Notes</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedLabTest.additional_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Test Results & Images */}
            <div className="space-y-6">
              {/* Findings */}
              {selectedLabTest.findings && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Findings</h3>
                  </div>
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedLabTest.findings}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Impression */}
              {selectedLabTest.impression && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Impression</h3>
                  </div>
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedLabTest.impression}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Display */}
              {hasImage(selectedLabTest) && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Test Image</h3>
                    {selectedLabTest.test_name?.toLowerCase().includes('x-ray') && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        X-Ray
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <img 
                        src={getImageUrl(selectedLabTest.primary_image_path)} 
                        alt={`${selectedLabTest.test_name} Result`}
                        className="w-full h-auto max-h-80 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xNTAgNTBIMTQwTDEyMCAzMEg4MEw2MCA1MEg1MEM0Ni43NjE0IDUwIDQzLjU0ODUgNTEuMDc4NiA0MS4xMTE0IDUzLjAxNzhDMzguNjU5MyA1NC45NjU4IDM3IDU3Ljc0MDQgMzcgNjAuNzVWMTUwQzM3IDE1My4yMzkgMzguNjU5MyAxNTYuMDM0IDQxLjExMTQgMTU3Ljk4MkM0My41NDg1IDE1OS45MjEgNDYuNzYxNCAxNjEgNTAgMTYxSDE1MEMxNTMuMjM5IDE2MSAxNTYuMDM0IDE1OS45MjEgMTU3Ljk4MiAxNTcuOTgyQzE1OS45MjEgMTU2LjAzNCAxNjEgMTUzLjIzOSAxNjEgMTUwVjYwLjc1QzE2MSA1Ny43NDA0IDE1OS45MjEgNTQuOTY1OCAxNTcuOTgyIDUzLjAxNzhDMTU2LjAzNCA1MS4wNzg2IDE1My4yMzkgNTAgMTUwIDUwWiIgc3Ryb2tlPSIjRTFFMkUzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0iTTc5LjUgMTMxQzk0LjQ2MTkgMTMxIDEwNi41IDExOC45NjIgMTA2LjUgMTA0QzEwNi41IDg5LjAzODEgOTQuNDYxOSA3NyA3OS41IDc3QzY0LjUzODEgNzcgNTIuNSA4OS4wMzgxIDUyLjUgMTA0QzUyLjUgMTE4Ljk2MiA2NC41MzgxIDEzMSA3OS41IDEzMVoiIHN0cm9rZT0iI0UxRTJFMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik05NS43NSA3NEwxMzkuNSA0MC43NSIgc3Ryb2tlPSIjRTFFMkUzIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K';
                        }}
                      />
                    </div>
                    {selectedLabTest.primary_image_path && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-700">Image Path</p>
                            <p className="text-xs text-gray-500 font-mono truncate mt-1">
                              {selectedLabTest.primary_image_path}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedLabTest.primary_image_path);
                              setSuccessMessage('Image path copied to clipboard!');
                              setTimeout(() => setSuccessMessage(''), 2000);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                            title="Copy path"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw Data (Optional - for debugging) */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Technical Details</h3>
                  <span className="text-xs text-gray-500">Record #{selectedLabTest.record_no}</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-600">Record No:</div>
                    <div className="text-gray-900 font-mono">{selectedLabTest.record_no}</div>
                    
                    <div className="text-gray-600">Employee ID:</div>
                    <div className="text-gray-900">{selectedLabTest.employee_id}</div>
                    
                    <div className="text-gray-600">Patient ID:</div>
                    <div className="text-gray-900">{selectedLabTest.patient_id}</div>
                    
                    <div className="text-gray-600">Test Type:</div>
                    <div className="text-gray-900">{selectedLabTest.test_name}</div>
                    
                    <div className="text-gray-600">Status:</div>
                    <div className="text-gray-900">{selectedLabTest.status}</div>
                    
                    <div className="text-gray-600">Request Date:</div>
                    <div className="text-gray-900">{formatDate(selectedLabTest.date_requested)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Last Updated:</span> {formatDateTime(selectedLabTest.date_requested)}
          </div>
          <div className="flex gap-3">
            {hasImage(selectedLabTest) && (
              <button
                onClick={() => window.open(getImageUrl(selectedLabTest.primary_image_path), '_blank')}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
              
                View Full Image
              </button>
            )}
            <button
              onClick={() => setShowLabTestDetails(false)}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default PatientDetails;