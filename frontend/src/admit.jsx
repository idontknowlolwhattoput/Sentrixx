import React, { useState, useEffect } from 'react';

const HospitalAdmittanceSystem = () => {
  // State for fetched patients from API
  const [apiPatients, setApiPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [admissionSuccess, setAdmissionSuccess] = useState(false);

  // Simple data structure for wards
  const [wards, setWards] = useState([
    {
      id: 'emergency',
      name: 'Emergency Room',
      beds: [
        { id: 1, patient: null, status: 'available', patientRecord: null },
        { id: 2, patient: null, status: 'available', patientRecord: null },
        { id: 3, patient: null, status: 'available', patientRecord: null },
      ]
    },
    {
      id: 'icu',
      name: 'Intensive Care Unit',
      beds: [
        { id: 4, patient: null, status: 'available', patientRecord: null },
        { id: 5, patient: null, status: 'available', patientRecord: null },
        { id: 6, patient: null, status: 'maintenance', patientRecord: null },
      ]
    },
    {
      id: 'surgery',
      name: 'Surgery Ward',
      beds: [
        { id: 7, patient: null, status: 'available', patientRecord: null },
        { id: 8, patient: null, status: 'available', patientRecord: null },
        { id: 9, patient: null, status: 'available', patientRecord: null },
      ]
    },
    {
      id: 'maternity',
      name: 'Maternity Ward',
      beds: [
        { id: 10, patient: null, status: 'available', patientRecord: null },
        { id: 11, patient: null, status: 'available', patientRecord: null },
      ]
    },
  ]);

  // Available patients waiting for beds
  const [availablePatients, setAvailablePatients] = useState([]);
  
  // Form state for patient assignment - reduced to only used fields
  const [assignmentForm, setAssignmentForm] = useState({
    patient_id: null,
    admission_type: '',
    admission_date: new Date().toISOString().split('T')[0],
    admission_time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    mode_of_arrival: '',
    triage_category: '',
    insurance_provider: '',
    chief_complaint: '',
    pain_score: '',
    pain_location: '',
    fall_risk_score: '',
    general_appearance: '',
    mobility_status: '',
    special_needs: '',
    patient_diagnosis: '',
    dietary_orders: '',
    activity_orders: '',
    isolation_precautions: '',
  });

  // UI state
  const [selectedWard, setSelectedWard] = useState('emergency');
  const [selectedBed, setSelectedBed] = useState(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedPatientForAssignment, setSelectedPatientForAssignment] = useState(null);

  // Find selected ward
  const currentWard = wards.find(w => w.id === selectedWard);

  // API Base URL
  const API_BASE_URL = 'http://localhost:5000';

  // Fetch patients from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/patient/patients`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.patients) {
          setApiPatients(data.patients);
          
          // Convert API patients to available patients format
          const formattedPatients = data.patients.map(patient => ({
            id: patient.patient_id,
            name: `${patient.first_name} ${patient.last_name}`,
            fullName: `${patient.first_name} ${patient.middle_name ? patient.middle_name + ' ' : ''}${patient.last_name}`,
            firstName: patient.first_name,
            middleName: patient.middle_name,
            lastName: patient.last_name,
            dateOfBirth: patient.date_of_birth,
            gender: patient.gender,
            mobileNumber: patient.mobile_number,
            email: patient.email,
            age: calculateAge(patient.date_of_birth),
            createdAt: patient.created_at
          }));
          
          setAvailablePatients(formattedPatients);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError(error.message);
        
        // Fallback to sample data if API fails
        const fallbackPatients = generateFallbackPatients();
        setAvailablePatients(fallbackPatients);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Helper function to generate fallback patients
  const generateFallbackPatients = () => {
    const names = [
      { first: 'Renato', middle: 'Garcia', last: 'Torres', dob: '1994-10-31' },
      { first: 'Carla', middle: 'Reyes', last: 'Villanueva', dob: '1996-05-19' },
      { first: 'Daniel', middle: 'Santos', last: 'Mendoza', dob: '1991-11-10' },
      { first: 'Bea', middle: 'Lopez', last: 'Torres', dob: '2000-02-27' },
      { first: 'Ricardo', middle: 'Martinez', last: 'Reyes', dob: '1993-09-04' },
      { first: 'Gabriel', middle: 'Lopez', last: 'Morales', dob: '1985-12-29' },
      { first: 'Luis', middle: 'Garcia', last: 'Delos Santos', dob: '1992-04-17' },
      { first: 'Sofia', middle: 'Mateo', last: 'Fernandez', dob: '1998-08-21' },
      { first: 'Ana', middle: 'Cruz', last: 'Reyes', dob: '2001-06-11' },
      { first: 'Maria', middle: 'Lopez', last: 'Garcia', dob: '1988-10-01' },
      { first: 'Juan', middle: 'Santos', last: 'Dela Cruz', dob: '1995-03-14' }
    ];

    return names.map((patient, index) => ({
      id: index + 4,
      name: `${patient.first} ${patient.last}`,
      fullName: `${patient.first} ${patient.middle} ${patient.last}`,
      firstName: patient.first,
      middleName: patient.middle,
      lastName: patient.last,
      dateOfBirth: patient.dob,
      gender: index % 2 === 0 ? 'Male' : 'Female',
      mobileNumber: `0917${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      email: `${patient.first.toLowerCase()}.${patient.last.toLowerCase().replace(' ', '')}@example.com`,
      age: calculateAge(patient.dob),
      createdAt: new Date().toISOString()
    }));
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Handle bed click
  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setShowPatientList(false);
    setShowAssignmentForm(false);
  };

  // Handle patient selection for assignment
  const handlePatientSelectForAssignment = (patient) => {
    setSelectedPatientForAssignment(patient);
    setAssignmentForm({
      ...assignmentForm,
      patient_id: patient.id,
      ward_id: selectedWard,
      bed_number: selectedBed?.id,
      admission_date: new Date().toISOString().split('T')[0],
      admission_time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    setShowPatientList(false);
    setShowAssignmentForm(true);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAssignmentForm({
      ...assignmentForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle textarea changes
  const handleTextareaChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm({
      ...assignmentForm,
      [name]: value
    });
  };

  // Submit admission to API
  const submitAdmission = async () => {
    if (!selectedBed || !selectedPatientForAssignment) return;

    setIsSubmitting(true);
    setAdmissionSuccess(false);
    
    try {
      // Prepare the data for API
      const admissionData = {
        ...assignmentForm,
        patient_id: selectedPatientForAssignment.id,
        ward_id: selectedWard,
        bed_number: selectedBed.id
      };

      // Log the data being sent (for debugging)
      console.log('Submitting admission data:', admissionData);

      // Send POST request to admission API
      const response = await fetch(`${API_BASE_URL}/api/admissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(admissionData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to create admission: ${response.status}`);
      }

      if (result.success) {
        setAdmissionSuccess(true);
        
        // Update local state after successful API submission
        const patient = selectedPatientForAssignment;
        
        const patientRecord = {
          ...patient,
          admission_id: result.admission_id,
          admission_date: admissionData.admission_date,
          admission_time: admissionData.admission_time,
          admission_type: admissionData.admission_type,
          ward: currentWard.name,
          bed_number: selectedBed.id,
          diagnosis: admissionData.patient_diagnosis,
          chief_complaint: admissionData.chief_complaint,
          triage_category: admissionData.triage_category,
          status: 'Admitted'
        };

        // Update the wards
        const updatedWards = wards.map(ward => {
          if (ward.id === selectedWard) {
            const updatedBeds = ward.beds.map(b => {
              if (b.id === selectedBed.id) {
                return { 
                  ...b, 
                  patient: {
                    id: patient.id,
                    name: patient.name,
                    fullName: patient.fullName
                  }, 
                  patientRecord: patientRecord,
                  status: 'occupied' 
                };
              }
              return b;
            });
            return { ...ward, beds: updatedBeds };
          }
          return ward;
        });

        setWards(updatedWards);
        
        // Remove patient from available list
        setAvailablePatients(availablePatients.filter(p => p.id !== patient.id));
        
        // Reset form and selections after 2 seconds
        setTimeout(() => {
          setSelectedBed(null);
          setSelectedPatientForAssignment(null);
          setShowAssignmentForm(false);
          resetAssignmentForm();
          setAdmissionSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting admission:', error);
      alert(`Failed to create admission: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset assignment form
  const resetAssignmentForm = () => {
    setAssignmentForm({
      patient_id: null,
      admission_type: '',
      admission_date: new Date().toISOString().split('T')[0],
      admission_time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      mode_of_arrival: '',
      triage_category: '',
      insurance_provider: '',
      chief_complaint: '',
      pain_score: '',
      pain_location: '',
      fall_risk_score: '',
      general_appearance: '',
      mobility_status: '',
      special_needs: '',
      patient_diagnosis: '',
      dietary_orders: '',
      activity_orders: '',
      isolation_precautions: '',
    });
  };

  // Discharge patient from bed
  const dischargePatient = () => {
    if (!selectedBed || !selectedBed.patient) return;

    // Find the original patient data
    const originalPatient = apiPatients.find(p => p.patient_id === selectedBed.patient.id) || 
                           availablePatients.find(p => p.id === selectedBed.patient.id);
    

    const patientToAdd = {
      id: selectedBed.patient.id,
      name: selectedBed.patient.name,
      fullName: selectedBed.patient.fullName || selectedBed.patient.name,
      dateOfBirth: originalPatient?.dateOfBirth || new Date().toISOString(),
      gender: originalPatient?.gender || 'Unknown',
      age: originalPatient?.age || calculateAge(originalPatient?.dateOfBirth),
      email: originalPatient?.email || '',
      mobileNumber: originalPatient?.mobileNumber || ''
    };
    
    setAvailablePatients([...availablePatients, patientToAdd]);


    const updatedWards = wards.map(ward => {
      if (ward.id === selectedWard) {
        const updatedBeds = ward.beds.map(b => {
          if (b.id === selectedBed.id) {
            return { ...b, patient: null, patientRecord: null, status: 'available' };
          }
          return b;
        });
        return { ...ward, beds: updatedBeds };
      }
      return ward;
    });

    setWards(updatedWards);
    setSelectedBed(null);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-green-100 border-green-300';
      case 'occupied': return 'bg-red-100 border-red-300';
      case 'maintenance': return 'bg-yellow-100 border-yellow-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  // Calculate statistics
  const totalBeds = wards.reduce((sum, ward) => sum + ward.beds.length, 0);
  const availableBeds = wards.reduce((sum, ward) => 
    sum + ward.beds.filter(b => b.status === 'available').length, 0
  );
  const occupiedBeds = wards.reduce((sum, ward) => 
    sum + ward.beds.filter(b => b.status === 'occupied').length, 0
  );

  return (
    <div className="max-w-screen bg-gray-50 p-4 md:p-8 h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Hospital Bed Management System</h1>
          <p className="text-gray-600 mt-2">
            {isLoading ? 'Loading patient data...' : `Connected to patient database (${apiPatients.length} patients)`}
          </p>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">API Error: {error}</p>
              <p className="text-red-500 text-xs mt-1">Using fallback data</p>
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Ward Selection & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ward Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Ward</h2>
              <div className="space-y-2">
                {wards.map(ward => (
                  <button
                    key={ward.id}
                    onClick={() => {
                      setSelectedWard(ward.id);
                      setSelectedBed(null);
                      setShowPatientList(false);
                      setShowAssignmentForm(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedWard === ward.id 
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700' 
                        : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{ward.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ward.beds.filter(b => b.status === 'available').length > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ward.beds.filter(b => b.status === 'available').length} available
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Hospital Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Beds</p>
                    <p className="text-2xl font-bold text-gray-800">{totalBeds}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-bold">🏥</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-green-600">Available Beds</p>
                    <p className="text-2xl font-bold text-green-800">{availableBeds}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm text-red-600">Occupied Beds</p>
                    <p className="text-2xl font-bold text-red-800">{occupiedBeds}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">👤</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Patients */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Available Patients</h2>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {availablePatients.length} waiting
                </span>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-gray-500 mt-2">Loading patients...</p>
                  </div>
                ) : availablePatients.length > 0 ? (
                  availablePatients.map(patient => (
                    <div 
                      key={patient.id} 
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                      onClick={() => {
                        if (selectedBed && !selectedBed.patient) {
                          handlePatientSelectForAssignment(patient);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{patient.fullName || patient.name}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500 mr-3">
                              {patient.gender || 'Unknown'} • {patient.age || 'Unknown'} yrs
                            </span>
                            <span className="text-xs text-gray-500">
                              {patient.mobileNumber}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">Waiting</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No patients waiting</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Ward Beds */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{currentWard?.name}</h2>
                  <p className="text-gray-600">Click a bed to view patient or assign new patient</p>
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Occupied</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Maintenance</span>
                  </div>
                </div>
              </div>

              {/* Beds Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentWard?.beds.map(bed => (
                  <button
                    key={bed.id}
                    onClick={() => handleBedClick(bed)}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      getStatusColor(bed.status)
                    } ${
                      selectedBed?.id === bed.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg font-bold text-gray-800">Bed #{bed.id}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        bed.status === 'available' 
                          ? 'bg-green-200 text-green-800' 
                          : bed.status === 'occupied'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {bed.status}
                      </span>
                    </div>
                    
                    {bed.patient ? (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600">👤</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{bed.patient.name}</p>
                            <p className="text-sm text-gray-600">
                              {bed.patientRecord?.diagnosis || 'Patient admitted'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Click for details →
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <span className="text-gray-400">Empty</span>
                        <p className="text-sm text-gray-500 mt-1">Click to assign patient</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Bed Actions Panel */}
              {selectedBed && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Bed #{selectedBed.id} - {selectedBed.status.toUpperCase()}
                    </h3>
                    <button 
                      onClick={() => {
                        setSelectedBed(null);
                        setShowAssignmentForm(false);
                        setShowPatientList(false);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {selectedBed.patient ? (
                    // Patient Information Display
                    <div className="space-y-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-lg text-gray-800 mb-3">Patient Information</h4>
                        
                        {/* Basic Info */}
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">Basic Information</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-sm text-gray-500">Full Name:</span>
                              <p className="font-medium">{selectedBed.patientRecord?.fullName || selectedBed.patient.name}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Age/Gender:</span>
                              <p className="font-medium">
                                {selectedBed.patientRecord?.age || 'Unknown'} / {selectedBed.patientRecord?.gender || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Contact:</span>
                              <p className="font-medium">{selectedBed.patientRecord?.mobileNumber || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Email:</span>
                              <p className="font-medium">{selectedBed.patientRecord?.email || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Admission Details */}
                        {selectedBed.patientRecord?.admission_type && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-700 mb-2">Admission Details</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Type:</span>
                                <p className="font-medium">{selectedBed.patientRecord.admission_type}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Arrival:</span>
                                <p className="font-medium">{selectedBed.patientRecord.mode_of_arrival}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Triage:</span>
                                <p className="font-medium">{selectedBed.patientRecord.triage_category}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Clinical Information */}
                        {selectedBed.patientRecord?.chief_complaint && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-700 mb-2">Clinical Presentation</h5>
                            <p className="text-sm text-gray-700 mb-2">
                              <span className="font-medium">Chief Complaint:</span> {selectedBed.patientRecord.chief_complaint}
                            </p>
                            {selectedBed.patientRecord.pain_score && (
                              <div className="mt-2">
                                <span className="font-medium text-sm">Pain: </span>
                                <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                                  Score {selectedBed.patientRecord.pain_score}/10
                                </span>
                                {selectedBed.patientRecord.pain_location && (
                                  <span className="text-sm text-gray-600 ml-2">({selectedBed.patientRecord.pain_location})</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Medical Information */}
                        {selectedBed.patientRecord?.patient_diagnosis && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-700 mb-2">Medical Information</h5>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <span className="text-sm text-gray-500">Diagnosis</span>
                              <p className="font-medium">{selectedBed.patientRecord?.patient_diagnosis || 'N/A'}</p>
                            </div>
                          </div>
                        )}

                        {/* Nursing Assessment */}
                        {(selectedBed.patientRecord?.fall_risk_score || selectedBed.patientRecord?.mobility_status) && (
                          <div className="mb-4 bg-green-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-700 mb-2">Nursing Assessment</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Fall Risk:</span>
                                <p className={`font-medium ${selectedBed.patientRecord.fall_risk_score === 'high' ? 'text-red-600' : selectedBed.patientRecord.fall_risk_score === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {selectedBed.patientRecord.fall_risk_score?.toUpperCase() || 'Not Assessed'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Mobility:</span>
                                <p className="font-medium">{selectedBed.patientRecord.mobility_status}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Diet:</span>
                                <p className="font-medium">{selectedBed.patientRecord.dietary_orders}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Isolation:</span>
                                <p className="font-medium">{selectedBed.patientRecord.isolation_precautions}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Special Notes */}
                        {(selectedBed.patientRecord?.code_status || selectedBed.patientRecord?.special_needs) && (
                          <div className="mb-4 bg-yellow-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-700 mb-2">Special Notes</h5>
                            <div className="space-y-1 text-sm">
                              {selectedBed.patientRecord.code_status && (
                                <p>
                                  <span className="font-medium">Code Status:</span> {selectedBed.patientRecord.code_status}
                                </p>
                              )}
                              {selectedBed.patientRecord.special_needs && (
                                <p>
                                  <span className="font-medium">Special Needs:</span> {selectedBed.patientRecord.special_needs}
                                </p>
                              )}
                              {selectedBed.patientRecord.admitting_nurse && (
                                <p>
                                  <span className="font-medium">Admitted by:</span> {selectedBed.patientRecord.admitting_nurse}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Discharge Button */}
                      <button
                        onClick={dischargePatient}
                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Discharge Patient
                      </button>
                    </div>
                  ) : (
                    // Empty Bed - Options for Assignment
                    <div className="space-y-4">
                      <p className="text-gray-600">This bed is available for patient assignment.</p>
                      
                      {admissionSuccess && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-green-700 font-medium">Admission created successfully!</p>
                          </div>
                        </div>
                      )}
                      
                      {showAssignmentForm ? (
                        // Assignment Form
                        <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-[600px] overflow-y-auto">
                          <h4 className="font-bold text-lg text-gray-800 mb-4">Assign Patient: {selectedPatientForAssignment?.fullName}</h4>
                          
                          <div className="space-y-6">
                            {/* Admission Details */}
                            <div>
                              <h5 className="font-medium text-gray-700 mb-3">Admission Details</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admission Type *
                                  </label>
                                  <select 
                                    name="admission_type" 
                                    value={assignmentForm.admission_type} 
                                    onChange={handleFormChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg" 
                                    required
                                  >
                                    <option value="">Select type</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="elective">Elective</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="transfer">Transfer</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mode of Arrival
                                  </label>
                                  <select 
                                    name="mode_of_arrival" 
                                    value={assignmentForm.mode_of_arrival} 
                                    onChange={handleFormChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Select</option>
                                    <option value="ambulance">Ambulance</option>
                                    <option value="private">Private Vehicle</option>
                                    <option value="walkin">Walk-in</option>
                                    <option value="police">Police Escort</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Triage Category *
                                  </label>
                                  <select 
                                    name="triage_category" 
                                    value={assignmentForm.triage_category} 
                                    onChange={handleFormChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg" 
                                    required
                                  >
                                    <option value="">Select category</option>
                                    <option value="resuscitation">Resuscitation (Red)</option>
                                    <option value="emergency">Emergency (Orange)</option>
                                    <option value="urgent">Urgent (Yellow)</option>
                                    <option value="semi">Semi-urgent (Green)</option>
                                    <option value="non">Non-urgent (Blue)</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Insurance Provider
                                  </label>
                                  <input 
                                    type="text" 
                                    name="insurance_provider" 
                                    value={assignmentForm.insurance_provider} 
                                    onChange={handleFormChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg" 
                                    placeholder="e.g., PhilHealth, Maxicare" 
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Clinical Presentation */}
                            <div>
                              <h5 className="font-medium text-gray-700 mb-3">Clinical Presentation</h5>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chief Complaint *
                                  </label>
                                  <textarea 
                                    name="chief_complaint" 
                                    value={assignmentForm.chief_complaint} 
                                    onChange={handleTextareaChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg" 
                                    rows="2" 
                                    placeholder="Primary reason for admission in patient's own words" 
                                    required 
                                  />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Pain Assessment
                                    </label>
                                    <div className="flex items-center space-x-2">
                                      <select 
                                        name="pain_score" 
                                        value={assignmentForm.pain_score} 
                                        onChange={handleFormChange} 
                                        className="flex-1 p-2 border border-gray-300 rounded-lg"
                                      >
                                        <option value="">Pain Score (0-10)</option>
                                        {[0,1,2,3,4,5,6,7,8,9,10].map(num => <option key={num} value={num}>{num}</option>)}
                                      </select>
                                      <input 
                                        type="text" 
                                        name="pain_location" 
                                        value={assignmentForm.pain_location} 
                                        onChange={handleFormChange} 
                                        className="flex-1 p-2 border border-gray-300 rounded-lg" 
                                        placeholder="Location" 
                                      />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Fall Risk Score (Morse)
                                    </label>
                                    <select 
                                      name="fall_risk_score" 
                                      value={assignmentForm.fall_risk_score} 
                                      onChange={handleFormChange} 
                                      className="w-full p-2 border border-gray-300 rounded-lg"
                                    >
                                      <option value="">Select score</option>
                                      <option value="low">Low Risk (0-24)</option>
                                      <option value="medium">Medium Risk (25-50)</option>
                                      <option value="high">High Risk (51+)</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Nursing Assessment */}
                            <div>
                              <h5 className="font-medium text-gray-700 mb-3">Nursing Assessment</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    General Appearance
                                  </label>
                                  <select 
                                    name="general_appearance" 
                                    value={assignmentForm.general_appearance} 
                                    onChange={handleFormChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Select</option>
                                    <option value="alert">Alert and Oriented</option>
                                    <option value="lethargic">Lethargic</option>
                                    <option value="confused">Confused</option>
                                    <option value="agitated">Agitated</option>
                                    <option value="distressed">In Distress</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mobility Status
                                  </label>
                                  <select 
                                    name="mobility_status" 
                                    value={assignmentForm.mobility_status} 
                                    onChange={handleFormChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Select</option>
                                    <option value="independent">Independent</option>
                                    <option value="assistance">Requires Assistance</option>
                                    <option value="wheelchair">Wheelchair-bound</option>
                                    <option value="bedridden">Bedridden</option>
                                  </select>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Special Needs & Considerations
                                </label>
                                <textarea 
                                  name="special_needs" 
                                  value={assignmentForm.special_needs} 
                                  onChange={handleTextareaChange} 
                                  className="w-full p-2 border border-gray-300 rounded-lg" 
                                  rows="2" 
                                  placeholder="Language barriers, disabilities, religious needs, etc." 
                                />
                              </div>
                            </div>

                            {/* Medical Information */}
                            <div>
                              <h5 className="font-medium text-gray-700 mb-3">Medical Information</h5>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Primary Diagnosis *
                                  </label>
                                  <input 
                                    type="text" 
                                    name="patient_diagnosis" 
                                    value={assignmentForm.patient_diagnosis} 
                                    onChange={handleFormChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg" 
                                    placeholder="e.g., Acute Appendicitis" 
                                    required 
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Initial Orders */}
                            <div>
                              <h5 className="font-medium text-gray-700 mb-3">Initial Orders</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dietary Orders
                                  </label>
                                  <select 
                                    name="dietary_orders" 
                                    value={assignmentForm.dietary_orders} 
                                    onChange={handleFormChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Select diet</option>
                                    <option value="regular">Regular Diet</option>
                                    <option value="soft">Soft Diet</option>
                                    <option value="liquid">Liquid Diet</option>
                                    <option value="diabetic">Diabetic Diet</option>
                                    <option value="cardiac">Cardiac Diet</option>
                                    <option value="renal">Renal Diet</option>
                                    <option value="npo">NPO (Nothing by Mouth)</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Activity Orders
                                  </label>
                                  <select 
                                    name="activity_orders" 
                                    value={assignmentForm.activity_orders} 
                                    onChange={handleFormChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Select activity level</option>
                                    <option value="adlib">Ad Lib (as tolerated)</option>
                                    <option value="ambulate">Ambulate with Assistance</option>
                                    <option value="bedrest">Bed Rest</option>
                                    <option value="bathroom">Bathroom Privileges Only</option>
                                  </select>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Isolation Precautions
                                </label>
                                <select 
                                  name="isolation_precautions" 
                                  value={assignmentForm.isolation_precautions} 
                                  onChange={handleFormChange} 
                                  className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                  <option value="none">No Isolation Required</option>
                                  <option value="contact">Contact Precautions</option>
                                  <option value="droplet">Droplet Precautions</option>
                                  <option value="airborne">Airborne Precautions</option>
                                  <option value="protective">Protective Isolation</option>
                                </select>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4 border-t">
                              <button
                                onClick={submitAdmission}
                                disabled={isSubmitting}
                                className={`flex-1 py-3 text-white font-medium rounded-lg transition flex items-center justify-center ${
                                  isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                                }`}
                              >
                                {isSubmitting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Processing...
                                  </>
                                ) : (
                                  'Complete Admission'
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setShowAssignmentForm(false);
                                  setSelectedPatientForAssignment(null);
                                  resetAssignmentForm();
                                }}
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Show Patient List for Assignment
                        <div>
                          <button
                            onClick={() => setShowPatientList(!showPatientList)}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center justify-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Assign a Patient
                          </button>

                          {/* Patient List for Selection */}
                          {showPatientList && (
                            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl shadow-lg">
                              <h4 className="font-medium text-gray-800 mb-3">Select a Patient:</h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {availablePatients.map(patient => (
                                  <button
                                    key={patient.id}
                                    onClick={() => handlePatientSelectForAssignment(patient)}
                                    className="w-full p-3 text-left hover:bg-blue-50 rounded-lg border border-gray-200 transition"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium text-gray-800">{patient.fullName || patient.name}</p>
                                        <div className="flex items-center mt-1">
                                          <span className="text-xs text-gray-500 mr-3">
                                            {patient.gender} • {patient.age} yrs
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {patient.mobileNumber}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                        Select
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                              {availablePatients.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No patients available for assignment</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-blue-600">📋</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Capacity</p>
                <p className="text-xl font-bold text-gray-800">{totalBeds} Beds</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-green-600">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Now</p>
                <p className="text-xl font-bold text-green-800">{availableBeds} Beds</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-red-600">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Patients Waiting</p>
                <p className="text-xl font-bold text-gray-800">{availablePatients.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalAdmittanceSystem;