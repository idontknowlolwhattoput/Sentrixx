import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router"

import sentrixlogo from "../assets/img/logo.svg"
import searchlogo from "../assets/icons/search.svg"
import arrowdown from "../assets/icons/dropdown.svg"
import arrowup from "../assets/icons/dropup.svg"
import notif from "../assets/icons/notifyes.svg"

import SidebarList from "../components/sidebarlist"
import { SelectionContext } from "../context/SelectionProvider"
import Dashboard from "../components/Dashboard/dashboard"
import Signin from "../pages/signin"

import DashboardHome from "../components/Dashboard/dashboard"
import PatientRegistration from "../components/Patient/patientRegistration"
import ManageEmployee from "../components/Employee/manageEmployee"
import PatientList from "../components/Patient/patientList"
import Playground from "../playground"
import axios from "axios"
import PatientDetails from "../components/Dashboard/test"
import QRScanner from "../QrScanner"
import DoctorAnalyticsDashboard from "../components/Employee/DoctorAnalyticsQueue"
import LabTechnicianDashboard from "../components/Laboratory/labTechnicianDashboard"

export default function DashboardLayout() {
    const [isDropdown, setDropDown] = useState(false)
    const [selection, setSelection] = useContext(SelectionContext)
    const [employeeInfo, setEmployeeInfo] = useState([])
    const navigate = useNavigate()

    const handleDropdown = () => {
        setDropDown(!isDropdown)
    }

    const handleLogout = () => {
        // Clear all stored data
        localStorage.removeItem("employee_id")
        localStorage.removeItem("selected_patient_id")
        localStorage.removeItem("selected_employee_id")
        
        // Close dropdown
        setDropDown(false)
        
        // Redirect to login page
        navigate("/signin")
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdown && !event.target.closest('.account-dropdown')) {
                setDropDown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isDropdown])

    useEffect(() => {
        axios.get(`http://localhost:5000/api/fetch-doctor/${localStorage.getItem("employee_id")}`)
        .then(response =>{
            console.log(response.data)
            setEmployeeInfo(response.data.result)
        })
    }, [])

    const renderContent = (item) => {
        switch (item) {
            case "Dashboard":
                return <DashboardHome />
            case "Manage Employee":
                return <ManageEmployee />
            case "Register Patient":
                return <PatientRegistration />
            case "Patient List":
                return <PatientList />
            case "Appointments":
                return <Playground />
            case "Doctor Analytic/Appointment":
                return <DoctorAnalyticsDashboard />
            case "Appointment Scan":
                return <QRScanner />
            case "Laboratory":
                return <LabTechnicianDashboard />
            default:
                return <DashboardHome />
        }
    }

    return (
        <div className="flex w-screen h-screen poppins">
            {/* LEFT SIDEBAR*/ }
            <div className="w-[20%] h-full bg-[#F1F2F7]">
                <div className="flex w-full h-[10%] pl-6 items-center gap-1 shadow-sm">
                    <img src={sentrixlogo} className="w-13 h-13" />
                    <div className="flex items-baseline gap-0.5">
                        <h1 className="inter text-4xl font-extrabold">S</h1>
                        <h1 className="inter text-xl font-extrabold tracking-wider">ENTRIX.</h1>
                    </div>
                </div>
                <SidebarList />
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col w-full h-full">
                {/* TOP NAVBAR */}
                <div className="flex items-center justify-between w-full h-[10%] bg-white shadow-sm px-8 relative">
                    {/* LEFT: SEARCH BAR */}
                    <div className="flex items-center w-[60%]">
                        <div className="flex items-center w-[60%] bg-[#F6F6FB] rounded-lg px-4 py-2 shadow-inner focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                            <input type="text"
                                className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 font-medium"
                                placeholder="Search here..." />
                            <img src={searchlogo} alt="search" className="w-5 h-5 opacity-60" />
                        </div>
                    </div>

                    {/* RIGHT: ACCOUNT + NOTIFICATION */}
                    <div className="flex items-center gap-6">
                        {/* Notification Icon */}
                        <div className="relative">
                            <img src={notif} alt="notifications"
                                className="w-7 h-7 cursor-pointer opacity-80 hover:opacity-100 transition" />
                            {/* Example notification dot */}
                            <span className="absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                        </div>

                        {/* Account Section with Dropdown */}
                        <div className="relative account-dropdown">
                            <div 
                                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 py-2 px-3 rounded-lg transition border border-transparent hover:border-gray-200"
                                onClick={handleDropdown}
                            >
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm">
                                    {employeeInfo?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <h1 className="text-sm font-medium text-gray-900 leading-tight">
                                            {employeeInfo
                                                ? (["admin", "cashier", "nurse"].includes(employeeInfo.position?.toLowerCase())
                                                    ? `${employeeInfo.position} ${employeeInfo.last_name}`
                                                    : `Dr. ${employeeInfo.last_name}`)
                                                : "User"
                                            }
                                        </h1>
                                        <p className="text-xs text-gray-500 leading-tight capitalize">
                                            {employeeInfo?.position || 'Role'}
                                        </p>
                                    </div>
                                    <img 
                                        src={isDropdown ? arrowup : arrowdown} 
                                        alt="dropdown" 
                                        className="w-4 h-4 opacity-60" 
                                    />
                                </div>
                            </div>

                            {/* Dropdown Menu - FIXED POSITIONING */}
                            {isDropdown && (
                                <div className="absolute right-0 top-12 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                    {/* User Info Section */}
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {employeeInfo?.first_name} {employeeInfo?.last_name}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1 truncate">
                                            {employeeInfo?.email || 'No email provided'}
                                        </p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <button 
                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors border-b border-gray-100"
                                            onClick={() => {
                                                setDropDown(false)
                                                console.log("Profile clicked")
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <span>My Profile</span>
                                        </button>

                                        <button 
                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors border-b border-gray-100"
                                            onClick={() => {
                                                setDropDown(false)
                                                localStorage.clear()
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <span>Settings</span>
                                        </button>
                                    </div>

                                    {/* Logout Section */}
                                    <div className="p-2 bg-gray-50 rounded-b-lg">
                                        <button 
                                            className="flex items-center w-full px-4 py-3 text-sm text-white bg-black transition-colors rounded-md justify-center font-medium"
                                            onClick={handleLogout}
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full h-[90%] max-h-full">
                    {renderContent(selection)}
                </div>
            </div>
        </div>
    )
}