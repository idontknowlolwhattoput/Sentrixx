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
  UserGroupIcon
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
    notes: ""
  });

  useEffect(() => {
    if (patientId) {
      fetchPatientData(patientId);
    }
  }, [patientId]);

  const fetchPatientData = async (id) => {
    try {
      setLoading(true);
      // FIXED: Changed from 'add-cons${id}' to the correct patient endpoint
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
      
      // Get employee ID from localStorage - you have employee_id: 4
      const employeeId = localStorage.getItem('employee_id')
      const appointment_code = localStorage.getItem('selected_appointment_code')
      // Prepare the data EXACTLY as your controller expects it
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
        follow_up: consultation.followUp,  // Note: underscore, not camelCase
        notes: consultation.notes,
        
        // Vital Signs
        bloodPressure: consultation.vitalSigns.bloodPressure,
        heartRate: consultation.vitalSigns.heartRate,
        temperature: consultation.vitalSigns.temperature,
        respiratoryRate: consultation.vitalSigns.respiratoryRate,
        oxygenSaturation: consultation.vitalSigns.oxygenSaturation
      };

      console.log('=== Sending consultation data ===');
      console.log('Employee ID:', employeeId);
      console.log('Patient ID:', patientData.patient_id);
      console.log('Data being sent:', consultationData);
      
      // IMPORTANT: Your route is /api/add-consultations (based on your route file)
      const response = await axios.post(
        'http://localhost:5000/patient/consultation/add-consultations',
        consultationData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('Response from server:', response.data);

      if (response.data.success) {
        setSuccessMessage(`✅ Consultation saved successfully! ID: ${response.data.consultationId}`);
        
        // Reset form
        setConsultation({
          appointment_code: localStorage.getItem("selected_appointment_code"),
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
          notes: ""
        });

        // Refresh patient data to show latest consultation and vital signs
        fetchPatientData(patientData.patient_id);
        
        // Clear success message after 5 seconds
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
        // Server responded with error
        console.error('Server error response:', err.response.data);
        console.error('Server error status:', err.response.status);
        
        if (err.response.data.error) {
          setError(`Server error: ${err.response.data.error}`);
        } else if (err.response.data.message) {
          setError(`Server error: ${err.response.data.message}`);
        } else {
          setError(`Error ${err.response.status}: ${err.response.statusText}`);
        }
      } else if (err.request) {
        // Request was made but no response
        console.error('No response received');
        setError('No response from server. Is the backend running? Check: http://localhost:5000/api/add-consultations');
      } else {
        // Other errors
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
    <div className="min-h-screen bg-white p-4 md:p-6">
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
                          // For simplicity, updating the main address field
                          // In a real app, you'd have separate fields for each address component
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
                  onClick={() => setConsultation({
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
                    notes: ""
                  })}
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
    </div>
  );
};

export default PatientDetails;