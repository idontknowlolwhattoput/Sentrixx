import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PatientDetails from '../Dashboard/test';

const DoctorAnalyticsDashboard = () => {
  const [queueData, setQueueData] = useState({ data: [] });
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [currentAppointmentCode, setCurrentAppointmentCode] = useState(null);

  const isMounted = useRef(true);

  useEffect(() => {
    console.log('🔍 Dashboard mounted');
    isMounted.current = true;

    const employeeId = localStorage.getItem('selected_employee_id') || 
                      localStorage.getItem('employee_id');
    
    if (employeeId) {
      fetchDoctorQueueData(employeeId);
      const interval = setInterval(() => {
        if (isMounted.current) {
          fetchDoctorQueueData(employeeId);
        }
      }, 10000);
      
      return () => {
        console.log('🔍 Dashboard unmounting');
        isMounted.current = false;
        clearInterval(interval);
      };
    } else {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const fetchDoctorQueueData = async (employeeId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/patient/visits/queue/current/${employeeId}`);
      
      // Only update state if component is still mounted
      if (!isMounted.current) return;
      
      if (response.data.success) {
        console.log('✅ Queue data received:', response.data.data.length, 'patients');
        
        setQueueData(response.data);
        
        if (response.data.doctor_info) {
          setDoctorData(response.data.doctor_info);
        } else if (response.data.data && response.data.data.length > 0) {
          const firstPatient = response.data.data[0];
          setDoctorData({
            name: firstPatient.doctor_name || 'Doctor',
            department: firstPatient.doctor_department || 'Unknown',
            employee_id: employeeId
          });
        } else {
          setDoctorData({
            name: 'Doctor',
            department: 'Unknown',
            employee_id: employeeId
          });
        }
        
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching doctor queue:', error);
      // Don't update loading state on error - just log it
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleProcessClick = (patient) => {
    console.log('🟢 Process clicked for patient:', patient.patient_name);
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const handleProceed = async () => {
    if (!selectedPatient) return;
    
    setProcessing(true);
    try {
      const response = await axios.put(`http://localhost:5000/patient/update/update-status`, {
        record_no: selectedPatient.record_no,
        visit_status: 'Current'
      });

      if (response.data.success) {
        const patientId = selectedPatient.patient_id;
        const appointmentCode = selectedPatient.appointment_code;
        
        console.log('🎯 Starting consultation for patient:', patientId);
        console.log('🎯 Appointment Code:', appointmentCode);
        
        // Store appointment code in localStorage and state
        localStorage.setItem('selected_appointment_code', appointmentCode);
        setCurrentAppointmentCode(appointmentCode);
        setCurrentPatientId(patientId);
        setShowModal(false);
        setShowPatientDetails(true);
        
        // Refresh the queue data
        const employeeId = localStorage.getItem('selected_employee_id') || 
                          localStorage.getItem('employee_id');
        await fetchDoctorQueueData(employeeId);
        
        setSelectedPatient(null);
      } else {
        alert('Failed to update patient status: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating patient status:', error);
      alert('Error updating patient status: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleContinueConsultation = (patient) => {
    console.log('🎯 Continue clicked for patient:', patient.patient_id);
    console.log('🎯 Appointment Code:', patient.appointment_code);
    

    localStorage.setItem('selected_appointment_code', patient.appointment_code);
    setCurrentAppointmentCode(patient.appointment_code);
    setSelectedPatient(patient);
    setCurrentPatientId(patient.patient_id);
    setShowPatientDetails(true);
  };

  const handleBackToDashboard = () => {
    console.log('🔙 Back to Dashboard clicked');
    setShowPatientDetails(false);
    setCurrentPatientId(null);
    setCurrentAppointmentCode(null);
    setSelectedPatient(null);
    localStorage.removeItem('selected_appointment_code');
  };

  // Calculate statistics
  const currentPatients = queueData.data.filter(visit => visit.visit_status === 'Current');
  const queuedPatients = queueData.data.filter(visit => visit.visit_status === 'Queued');
  const totalPatients = queueData.data.length;

  // If we're showing patient details, render that component
  if (showPatientDetails && currentPatientId) {
    console.log('🎯 Rendering PatientDetails with patientId:', currentPatientId);
    console.log('🎯 Appointment Code for consultation:', currentAppointmentCode);
    {localStorage.setItem('selected_patient_id', currentPatientId )}
    return (
      <div className="w-full h-full bg-white">
        <div className="border-b border-gray-300 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h2 className="text-xl font-light">
              Patient Consultation - {selectedPatient?.patient_name || 'Patient'}
            </h2>
            <div className="text-xs text-gray-500">
              Appointment: {currentAppointmentCode}
            </div>
          </div>
        </div>
        <PatientDetails 
          patientId={currentPatientId} 
          appointmentCode={currentAppointmentCode}
        />
      </div>
    );
  }

  // Show loading only if we don't have data yet
  if (loading && queueData.data.length === 0) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center p-4">
        <div className="text-black text-lg font-light">LOADING DOCTOR DASHBOARD...</div>
      </div>
    );
  }

  return (
      <div className="w-full h-full bg-white text-black p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 border-b border-gray-300 pb-3">
        <div>
          <h1 className="text-xl font-light">Doctor Analytics Dashboard</h1>
          {doctorData && (
            <div className="mt-1">
              <p className="text-sm font-medium">{doctorData.doctor_name || doctorData.name}</p>
              <p className="text-gray-600 text-xs">{doctorData.department}</p>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2 text-gray-500 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-800 rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
            <div>Updated: {lastUpdated}</div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 border border-gray-300 p-3 rounded">
          <div className="text-2xl font-light text-center">{totalPatients}</div>
          <div className="text-gray-500 text-xs text-center mt-1">Total Patients</div>
        </div>
        <div className="bg-gray-50 border border-gray-300 p-3 rounded">
          <div className="text-2xl font-light text-center">{currentPatients.length}</div>
          <div className="text-gray-500 text-xs text-center mt-1">In Progress</div>
        </div>
        <div className="bg-gray-50 border border-gray-300 p-3 rounded">
          <div className="text-2xl font-light text-center">{queuedPatients.length}</div>
          <div className="text-gray-500 text-xs text-center mt-1">In Queue</div>
        </div>
        <div className="bg-gray-50 border border-gray-300 p-3 rounded">
          <div className="text-2xl font-light text-center">
            {totalPatients > 0 ? Math.round((currentPatients.length / totalPatients) * 100) : 0}%
          </div>
          <div className="text-gray-500 text-xs text-center mt-1">Completion Rate</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-gray-50 border border-gray-300 rounded">
        <div className="border-b border-gray-300 bg-gray-100">
          <h3 className="text-sm font-medium p-3">Patient Queue Table ({totalPatients} patients)</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-200">
                <th className="text-left p-2 font-medium">Queue #</th>
                <th className="text-left p-2 font-medium">Patient Name</th>
                <th className="text-left p-2 font-medium">Appointment Time</th>
                <th className="text-left p-2 font-medium">Visit Type</th>
                <th className="text-left p-2 font-medium">Purpose</th>
                <th className="text-left p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">Wait Time</th>
                <th className="text-left p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queueData.data.length > 0 ? (
                queueData.data.map((patient, index) => (
                  <tr 
                    key={patient.record_no} 
                    className={`border-b border-gray-300 ${
                      patient.visit_status === 'Current' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          patient.visit_status === 'Current' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 font-medium">{patient.patient_name}</td>
                    <td className="p-2">{patient.time_scheduled}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        patient.visit_type === 'Emergency' 
                          ? 'bg-red-100 text-red-800'
                          : patient.visit_type === 'Walk-in'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {patient.visit_type}
                      </span>
                    </td>
                    <td className="p-2 max-w-[150px] truncate" title={patient.visit_purpose_title}>
                      {patient.visit_purpose_title || 'General Consultation'}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        patient.visit_status === 'Current'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.visit_status}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-gray-600">
                      {patient.visit_status === 'Current' ? 'Now' : 'Waiting'}
                    </td>
                    <td className="p-2">
                      {patient.visit_status === 'Queued' && (
                        <button
                          onClick={() => handleProcessClick(patient)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Process
                        </button>
                      )}
                      {patient.visit_status === 'Current' && (
                        <button
                          onClick={() => handleContinueConsultation(patient)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          Continue
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">
                    No patients in queue for today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Status Distribution */}
        <div className="bg-gray-50 border border-gray-300 rounded p-3">
          <h4 className="text-sm font-medium mb-2">Status Distribution</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span>In Progress</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${totalPatients > 0 ? (currentPatients.length / totalPatients) * 100 : 0}%` }}
                  ></div>
                </div>
                <span>{currentPatients.length}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>In Queue</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ width: `${totalPatients > 0 ? (queuedPatients.length / totalPatients) * 100 : 0}%` }}
                  ></div>
                </div>
                <span>{queuedPatients.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visit Type Breakdown */}
        <div className="bg-gray-50 border border-gray-300 rounded p-3">
          <h4 className="text-sm font-medium mb-2">Visit Type Breakdown</h4>
          <div className="space-y-2 text-xs">
            {['Scheduled/Follow-Up', 'Walk-in', 'Emergency'].map(type => {
              const count = queueData.data.filter(p => p.visit_type === type).length;
              return (
                <div key={type} className="flex justify-between items-center">
                  <span>{type}</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-gray-300">
        <div className="flex justify-between items-center text-gray-500 text-xs">
          <div>Doctor ID: {doctorData?.employee_id}</div>
          <div className="flex space-x-3">
            <div>Auto Refresh: 10s</div>
            <div>Showing: {totalPatients} patients</div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedPatient && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Process Patient</h3>
            
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Patient Name:</div>
                <div className="font-medium">{selectedPatient.patient_name}</div>
                
                <div className="text-gray-600">Appointment Code:</div>
                <div className="font-medium">{selectedPatient.appointment_code}</div>
                
                <div className="text-gray-600">Scheduled Time:</div>
                <div className="font-medium">{selectedPatient.time_scheduled}</div>
                
                <div className="text-gray-600">Visit Type:</div>
                <div className="font-medium">{selectedPatient.visit_type}</div>
                
                <div className="text-gray-600">Purpose:</div>
                <div className="font-medium">{selectedPatient.visit_purpose_title || 'General Consultation'}</div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPatient(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {processing ? 'Processing...' : 'Start Consultation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAnalyticsDashboard;