import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Calendar, Mail, Edit, MoreVertical, X } from 'lucide-react';
import PatientDetails from './patientDetails.jsx';

export default function PatientList({ 
  onPatientSelect, 
  showActions = true,
  compact = false,
  enableSearch = true,
  enablePagination = true
}) {
  const [allPatients, setAllPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [displayedPatients, setDisplayedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Fixed at 8 patients per page
  const itemsPerPage = 8;

  // Fetch all patients once on component mount
  const fetchAllPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/patient/patients');
      const data = await response.json();
      
      if (data.success) {
        setAllPatients(data.patients || []);
        setFilteredPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPatients();
  }, []);

  // Apply search filter whenever searchTerm changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients(allPatients);
      setCurrentPage(1);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = allPatients.filter(patient => {
      const fullName = getFullName(patient).toLowerCase();
      const email = (patient.email || '').toLowerCase();
      const phone = (patient.mobile_number || '').toLowerCase();
      const gender = (patient.gender || '').toLowerCase();
      
      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower) ||
        gender.includes(searchLower)
      );
    });

    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [searchTerm, allPatients]);

  // Calculate pagination whenever filteredPatients changes
  useEffect(() => {
    const total = filteredPatients.length;
    const pages = Math.ceil(total / itemsPerPage);
    setTotalPages(pages || 1);
    
    // Ensure current page is valid
    if (currentPage > pages && pages > 0) {
      setCurrentPage(pages);
    }
  }, [filteredPatients, itemsPerPage, currentPage]);

  // Update displayed patients based on current page and filtered patients
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
    setDisplayedPatients(paginatedPatients);
  }, [currentPage, filteredPatients, itemsPerPage]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      
      // Optional: Scroll to top of table when changing pages
      const tableContainer = document.querySelector('.overflow-x-auto');
      if (tableContainer) {
        tableContainer.scrollTop = 0;
      }
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
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getFullName = (patient) => {
    if (!patient) return '';
    const names = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean);
    return names.join(' ') || 'Unknown Patient';
  };

  const handlePatientClick = (patient) => {
    if (onPatientSelect) {
      onPatientSelect(patient);
    } else {
      setSelectedPatient(patient);
      setShowModal(true);
    }
  };

  const handleViewClick = (patient, e) => {
    e.stopPropagation();
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
  };

  // Generate page numbers with ellipsis for many pages
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Show pages around current page
      let startPage = Math.max(2, currentPage - 2);
      let endPage = Math.min(totalPages - 1, currentPage + 2);
      
      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 5);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 4);
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading && allPatients.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 ${!compact && 'shadow-sm'}`}>
        {/* Search Bar */}
        {enableSearch && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients by name, email, phone, or gender..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <div className="text-xs text-gray-500 mt-1">
                  Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
                  {filteredPatients.length > 0 && ` • Showing 8 per page`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                {!compact && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                  </>
                )}
                {showActions && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedPatients.length === 0 ? (
                <tr>
                  <td colSpan={compact ? 2 : 4} className="px-4 py-12 text-center text-gray-500">
                    {searchTerm ? (
                      <div className="flex flex-col items-center">
                        <Search className="w-8 h-8 text-gray-400 mb-2" />
                        <p>No patients found matching "{searchTerm}"</p>
                        <p className="text-sm mt-1">Try a different search term</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <User className="w-8 h-8 text-gray-400 mb-2" />
                        <p>No patients available</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                displayedPatients.map((patient) => (
                  <tr 
                    key={patient.patient_id} 
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => handlePatientClick(patient)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {getFullName(patient)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{patient.gender || 'N/A'}</span>
                            <span className="text-gray-300">•</span>
                            <span>{formatDate(patient.date_of_birth)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {!compact && (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="space-y-2">
                            {patient.mobile_number && (
                              <div className="flex items-center">
                                <Phone className="h-3.5 w-3.5 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{patient.mobile_number}</span>
                              </div>
                            )}
                            {patient.email && (
                              <div className="flex items-center">
                                <Mail className="h-3.5 w-3.5 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[180px]">{patient.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            {formatDate(patient.created_at)}
                          </div>
                        </td>
                      </>
                    )}
                    
                    {showActions && (
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => handleViewClick(patient, e)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors duration-150 border border-blue-200"
                        >
                          View Details
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Only show if we have patients */}
        {enablePagination && filteredPatients.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredPatients.length)}-{Math.min(currentPage * itemsPerPage, filteredPatients.length)}</span>
                <span> of {filteredPatients.length} patients</span>
                {totalPages > 1 && (
                  <span className="text-gray-500 ml-2">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-1">
                  {/* First Page Button */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="First Page"
                  >
                    «
                  </button>
                  
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="Previous Page"
                  >
                    ‹
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1.5 text-sm border rounded transition-colors min-w-[40px] ${
                            page === currentPage
                              ? 'bg-blue-600 text-white border-blue-600 font-medium'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="Next Page"
                  >
                    ›
                  </button>
                  
                  {/* Last Page Button */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="Last Page"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
            
            {/* Quick Page Jump (Optional) */}
            {totalPages > 5 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-sm text-gray-600">Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                    }
                  }}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">/ {totalPages}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedPatient && (
        <div className="fixed inset-0 z-50 overflow-auto backdrop-blur-sm bg-black bg-opacity-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">
                Patient Details - {getFullName(selectedPatient)}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-[calc(90vh-4rem)] overflow-auto">
              <PatientDetails 
                patientId={selectedPatient.patient_id}
                onBack={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}