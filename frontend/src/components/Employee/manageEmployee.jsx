import { useContext, useEffect, useState } from "react";
import AddEmployee from "./addEmployee";
import { ModalContext } from "../../context/ModalProvider";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ManageEmployee() {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useContext(ModalContext);
  const [isViewed, setView] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [confirmDelete, setShowConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showTimeShift, setShowTimeShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [existingTimesheets, setExistingTimesheets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Time shift data
  const timeSlots = [
    "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
    "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"
  ];

  useEffect(() => {
    fetch("http://localhost:5000/employees/view")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Error fetching employees:", err));
  }, [employees]);

  // Fetch existing timesheets when date or employee changes
  useEffect(() => {
    if (selectedEmployee && selectedDate) {
      fetchExistingTimesheets();
    }
  }, [selectedEmployee, selectedDate]);

  const fetchExistingTimesheets = async () => {
    try {
      const employeeId =  localStorage.getItem("selected_employee_id");
      const weekDates = getWeekDates(selectedDate);
      
      if (weekDates.length === 0) return;

      const startDate = weekDates[0];
      const endDate = weekDates[6];
      
      const response = await axios.get(`http://localhost:5000/time/timesheet/employee/${employeeId}`, {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });

      if (response.data.success) {
        setExistingTimesheets(response.data.data);
        // Convert existing timesheets to selectedSlots format
        const existingSlots = response.data.data.map(timesheet => {
          return `${timesheet.timesheet_date}-${timesheet.timesheet_time}`;
        });
        setSelectedTimeSlots(existingSlots);
      }
    } catch (error) {
      console.error('Error fetching existing timesheets:', error);
      // If no timesheets exist, that's fine - just clear the selection
      setExistingTimesheets([]);
      setSelectedTimeSlots([]);
    }
  };

  // Helper functions for date handling
  const formatDate = (date) => {
    if (!date) return "Select date";
    if (typeof date === 'string') return date;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper functions for weekly view
  const getWeekDates = (selectedDate) => {
    if (!selectedDate) return [];
    
    const date = new Date(selectedDate);
    const day = date.getDay(); // 0 (Sunday) to 6 (Saturday)
    
    // Calculate start of week (Sunday)
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - day);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(startDate.getDate() + i);
      weekDates.push(weekDate);
    }
    
    return weekDates;
  };

  const getWeekRangeText = (selectedDate) => {
    const weekDates = getWeekDates(selectedDate);
    if (weekDates.length === 0) return '';
    
    const firstDate = weekDates[0];
    const lastDate = weekDates[6];
    
    return `${firstDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${lastDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Update the checkbox handler to accept date parameter
  const handleCheckboxChange = (timeSlot, date = selectedDate) => {
    if (!date) return;

    setSelectedTimeSlots(prev => {
      const slotKey = `${formatDate(date)}-${timeSlot}`;
      if (prev.includes(slotKey)) {
        return prev.filter(slot => slot !== slotKey);
      } else {
        return [...prev, slotKey];
      }
    });
  };

  // Check if a slot exists in database
  const isSlotInDatabase = (date, time) => {
    const formattedDate = formatDate(date);
    return existingTimesheets.some(ts => 
      ts.timesheet_date === formattedDate && ts.timesheet_time === time
    );
  };

  const handleDeleteModal = (selected) => {
    setShowConfirm(true);
    localStorage.setItem("selected", selected);
  };

  const handleDelete = () => {
    axios
      .post("http://localhost:5000/employees/delete", {
        employee_id: localStorage.getItem("selected"),
      })
      .then(function (response) {
        console.log(response);
        loading();
        setShowConfirm(false);
        localStorage.removeItem("selected");
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const loading = () => {
    setLoading(true);
    setDeleteSuccess(false);
    setTimeout(() => {
      setLoading(false);
      setDeleteSuccess(true);
    }, 400);
  };

  const handleRegister = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setView(true);
  };

  const handlePrintJSON = async () => {
    setIsSaving(true);
    try {
      const employeeId = localStorage.getItem("selected_employee_id");
      
      const timesheetData = selectedTimeSlots.map(slot => {
        const [date, time] = slot.split('-');
        
        return {
          employee_id: employeeId,
          timesheet_date: date,
          timesheet_time: time
        };
      });

      console.log("Sending data:", timesheetData);

      // Make axios POST request - send array directly
      const response = await axios.post('http://localhost:5000/time/timesheet/bulk', timesheetData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert(`✅ Successfully saved ${timesheetData.length} timesheet entries!`);
        console.log("Backend response:", response.data);
        
        // Refresh the existing timesheets to update the UI
        await fetchExistingTimesheets();
      }

    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      
      // Show the actual error message from backend
      const backendMessage = error.response?.data?.message;
      alert(`❌ Error: ${backendMessage || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search employees..."
                className="w-64 border border-gray-300 rounded-md px-4 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
              <button
                className="bg-black text-white text-sm px-5 py-2 rounded-md hover:bg-gray-800 transition-colors border border-black"
                onClick={handleRegister}
              >
                Add New Employee
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="max-w-full mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr 
                  key={emp.employee_id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewEmployee(emp)}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {emp.first_name} {emp.middle_name} {emp.last_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{emp.position}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{emp.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{emp.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{emp.employee_id}</td>
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="text-gray-600 hover:text-gray-900 mr-3 text-sm font-medium"
                      onClick={() => handleViewEmployee(emp)}
                    >
                      View
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      onClick={() => handleDeleteModal(emp.employee_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {employees.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500 text-sm">No employees found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <AddEmployee />
        </div>
      )}

      {/* Employee View Modal */}
      {isViewed && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div 
            className="relative w-11/12 max-w-4xl max-h-[90vh] bg-white rounded-lg border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                  {selectedEmployee.first_name?.charAt(0)}{selectedEmployee.last_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {selectedEmployee.first_name} {selectedEmployee.middle_name} {selectedEmployee.last_name}
                  </h2>
                  <p className="text-gray-600">{selectedEmployee.position}</p>
                </div>
              </div>
              <button
                onClick={() => setView(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Employee ID</span>
                        <span className="text-gray-900 font-mono text-sm">{selectedEmployee.employee_id}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Email</span>
                        <span className="text-gray-900 text-sm">{selectedEmployee.email || "Not provided"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Phone</span>
                        <span className="text-gray-900 text-sm">{selectedEmployee.phone || "Not provided"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Gender</span>
                        <span className="text-gray-900 text-sm">{selectedEmployee.sex || "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Account Information</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Position</span>
                        <span className="text-gray-900 bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                          {selectedEmployee.position}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Account Created</span>
                        <span className="text-gray-900 text-sm">
                          {selectedEmployee.account_created ? new Date(selectedEmployee.account_created).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Last Modified</span>
                        <span className="text-gray-900 text-sm">
                          {selectedEmployee.account_last_modified ? new Date(selectedEmployee.account_last_modified).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Time Shift Section */}
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          localStorage.setItem("selected_employee_id", selectedEmployee.employee_id);
                          setShowTimeShift(true);
                        }}
                        className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors font-medium border border-black"
                      >
                        Time Shift Schedule
                      </button>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                {selectedEmployee.address && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Address</h3>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <p className="text-gray-700">{selectedEmployee.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setView(false)}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  console.log("Edit employee:", selectedEmployee.employee_id);
                }}
                className="px-6 py-2 text-white bg-black rounded-md hover:bg-gray-800 transition-colors font-medium border border-black"
              >
                Edit Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Shift Modal */}
      {showTimeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div 
            className="relative w-11/12 max-w-6xl max-h-[90vh] bg-white rounded-lg border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Time Shift Schedule
                  </h2>
                  <p className="text-gray-600">
                    {selectedEmployee?.first_name} {selectedEmployee?.last_name} - {selectedEmployee?.position}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTimeShift(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Date Selection */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                    }}
                    customInput={
                      <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:border-gray-400 transition-colors font-medium text-sm flex items-center gap-2">
                        <span>📅</span>
                        {selectedDate ? formatDate(selectedDate) : "Select date"}
                      </button>
                    }
                    popperClassName="!z-50"
                  />
                </div>
                
                {selectedDate && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Showing week of {getWeekRangeText(selectedDate)}
                    </span>
                    <button
                      onClick={fetchExistingTimesheets}
                      className="px-3 py-1 bg-gray-200 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors flex items-center gap-1"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Time Slots Table */}
            <div className="overflow-auto max-h-[calc(90vh-300px)] p-6">
              {selectedDate ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider min-w-32">
                            Time
                          </th>
                          {getWeekDates(selectedDate).map((date, index) => (
                            <th 
                              key={index}
                              className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider min-w-40"
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-semibold">
                                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className={`text-xs mt-1 px-2 py-1 rounded ${
                                  isToday(date) 
                                    ? 'bg-blue-100 text-blue-800 font-medium' 
                                    : 'text-gray-600'
                                }`}>
                                  {date.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {timeSlots.map((timeSlot, timeIndex) => (
                          <tr key={timeIndex} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 bg-gray-50 border-r border-gray-200">
                              <span className="text-sm font-medium text-gray-900">{timeSlot}</span>
                            </td>
                            {getWeekDates(selectedDate).map((date, dateIndex) => {
                              const slotKey = `${formatDate(date)}-${timeSlot}`;
                              const isSelected = selectedTimeSlots.includes(slotKey);
                              const existsInDB = isSlotInDatabase(date, timeSlot);
                              
                              return (
                                <td 
                                  key={dateIndex}
                                  className={`px-4 py-3 text-center border-r border-gray-200 last:border-r-0 relative ${
                                    isToday(date) ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => handleCheckboxChange(timeSlot, date)}
                                    className={`w-4 h-4 border-gray-300 rounded focus:ring-1 cursor-pointer ${
                                      existsInDB 
                                        ? 'text-blue-600 focus:ring-blue-500' 
                                        : 'text-black focus:ring-black'
                                    }`}
                                    title={existsInDB ? "Already saved in database" : "New selection"}
                                  />
                                  {existsInDB && (
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📅</div>
                  <h3 className="text-gray-900 font-medium mb-1">No date selected</h3>
                  <p className="text-gray-600 text-sm">Please select a date to view the weekly schedule</p>
                </div>
              )}

              {/* Selected Slots Summary */}
              {selectedTimeSlots.length > 0 && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Selected Time Slots ({selectedTimeSlots.length})
                    </h3>
                    <button
                      onClick={handlePrintJSON}
                      disabled={isSaving}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium border border-black disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save to Database"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                    {selectedTimeSlots.map((slot, index) => {
                      const [date, time] = slot.split('-');
                      const existsInDB = isSlotInDatabase(new Date(date), time);
                      return (
                        <div 
                          key={index}
                          className={`border rounded px-3 py-2 text-sm flex justify-between items-center ${
                            existsInDB 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <span className="font-medium">{time}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{date}</span>
                            {existsInDB && (
                              <span className="text-xs text-blue-600">✓</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowTimeShift(false)}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePrintJSON}
                disabled={selectedTimeSlots.length === 0 || isSaving}
                className={`px-6 py-2 text-white rounded-md transition-colors font-medium flex items-center gap-2 ${
                  selectedTimeSlots.length > 0 && !isSaving
                    ? 'bg-black hover:bg-gray-800 border border-black'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Save Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-lg">⚠️</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Employee</h2>
              <p className="text-gray-600 text-sm mb-6">Are you sure you want to delete this employee? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium border border-black"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {deleteSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-lg">✅</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Successfully Deleted</h2>
              <p className="text-gray-600 text-sm mb-6">The employee has been permanently removed.</p>
            </div>
            <div className="flex justify-center">
              <button 
                onClick={() => setDeleteSuccess(false)} 
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium border border-black"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}