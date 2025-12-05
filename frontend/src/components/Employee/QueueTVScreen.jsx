import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QueueTVScreen = () => {
  const [queueData, setQueueData] = useState({ data: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [lastAnnounced, setLastAnnounced] = useState(null); // Track last voice announcement

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const announceNowServing = (patient) => {
    if (!patient) return;

    const ding = new Audio("/sounds/ping.mp3");

    ding.play().then(() => {
      const phrase = `
        Now serving patient ${patient.appointment_code}.
        ${patient.patient_name}.
        For doctor ${patient.doctor_name}.
      `;

      const speech = new SpeechSynthesisUtterance(phrase);
      speech.lang = "en-US";
      speech.rate = 0.95;
      speech.pitch = 1;
      window.speechSynthesis.speak(speech);
    });
  };

  const fetchQueueData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/patient/visits/queue/current');
      if (response.data.success) {
        setQueueData(response.data);
        setLastUpdated(new Date().toLocaleTimeString());

        const newCurrent = response.data.data.filter(v => v.visit_status === 'Current');

        if (newCurrent.length > 0) {
          const latest = newCurrent[0];

          // Trigger voice only if it's a NEW current patient
          if (!lastAnnounced || lastAnnounced.record_no !== latest.record_no) {
            announceNowServing(latest);
            setLastAnnounced(latest);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPatients = queueData.data.filter(visit => visit.visit_status === 'Current');
  const queuedPatients = queueData.data.filter(visit => visit.visit_status === 'Queued');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-4xl font-thin tracking-widest">LOADING QUEUE...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-6">
      {/* Header */}
      <div className="text-center mb-8 border-b border-gray-300 pb-4">
        <h1 className="text-6xl font-thin tracking-widest mb-2">SENTRIX</h1>
        <p className="text-2xl text-gray-600 font-light mb-4">General Medicine</p>

        <div className="flex justify-center items-center space-x-8 text-gray-500 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
          <div>UPDATED: {lastUpdated}</div>
          <div>TOTAL: {queueData.count}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Now Serving */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-3xl font-light mb-2 border-b border-gray-300 pb-2">NOW SERVING</h2>
            <p className="text-gray-600 text-sm">CURRENT APPOINTMENTS</p>
          </div>

          {currentPatients.length > 0 ? (
            <div className="space-y-3">
              {currentPatients.map((patient) => (
                <div
                  key={patient.record_no}
                  className="bg-gray-50 border-2 border-gray-800 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="text-2xl font-light">{patient.patient_name}</div>
                      <div className="text-gray-500 text-xs">#{patient.appointment_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-thin">{patient.time_scheduled}</div>
                      <div className="text-gray-500 text-xs mt-1">{patient.doctor_department}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                    <div>
                      <div className="text-gray-500 text-xs">DOCTOR</div>
                      <div className="text-sm">{patient.doctor_name}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">TYPE</div>
                      <div className="text-sm">{patient.visit_type}</div>
                    </div>
                  </div>

                  {patient.visit_purpose_title && (
                    <div className="mb-2">
                      <div className="text-gray-500 text-xs">PURPOSE</div>
                      <div className="text-sm truncate">{patient.visit_purpose_title}</div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs">STATUS</span>
                      <span className="px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded-full">
                        IN PROGRESS
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-4xl text-gray-400 mb-2">—</div>
              <div className="text-gray-500 text-lg">NO CURRENT APPOINTMENTS</div>
            </div>
          )}
        </div>

        {/* Queue Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-3xl font-light mb-2 border-b border-gray-300 pb-2">QUEUE</h2>
            <p className="text-gray-600 text-sm">WAITING PATIENTS</p>
          </div>

          {queuedPatients.length > 0 ? (
            <div className="space-y-2">
              {queuedPatients.map((patient, index) => (
                <div
                  key={patient.record_no}
                  className="bg-gray-50 border border-gray-300 p-3 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-lg font-light">{patient.patient_name}</div>
                        <div className="text-gray-500 text-xs flex items-center space-x-2 mt-1">
                          <span>{patient.time_scheduled}</span>
                          <span className="text-gray-400">•</span>
                          <span>{patient.doctor_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500 text-xs">{patient.doctor_department}</div>
                      <div className="text-gray-400 text-xs mt-1">WAITING</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-4xl text-gray-400 mb-2">—</div>
              <div className="text-gray-500 text-lg">QUEUE IS EMPTY</div>
            </div>
          )}

          {/* Statistics Panel */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                <div className="text-2xl font-light text-black">{currentPatients.length}</div>
                <div className="text-gray-500 text-xs mt-1">CURRENT</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                <div className="text-2xl font-light text-black">{queuedPatients.length}</div>
                <div className="text-gray-500 text-xs mt-1">IN QUEUE</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                <div className="text-2xl font-light text-black">{queueData.count}</div>
                <div className="text-gray-500 text-xs mt-1">TOTAL</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 py-3">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center text-gray-500 text-xs">
            <div>QUEUE MANAGEMENT SYSTEM • SENTRIX GENERAL MEDICINE</div>
            <div className="flex space-x-4">
              <div>AUTO REFRESH: 10s</div>
              <div>PATIENTS: {queueData.count}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="fixed top-3 right-3">
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-800 rounded-full animate-pulse"></div>
          <span className="text-gray-600 text-xs">LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default QueueTVScreen;
