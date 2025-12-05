import { useState } from 'react'
import { BrowserRouter,Route, Routes } from 'react-router'
import Home from './pages/home'
import Signin from './pages/signin'
import Header from './pages/header'
import Dashboard from "./layout/dashboardLayout"
import SidebarList from './components/sidebarlist'

import RouteProtection from './pages/routeProtection'
import AuthProvider from './context/AuthProvider'
import ResourceProvider from './context/ResourceProvider'

import DashboardHome from './components/Dashboard/dashboard'
import ContextProvider from './context/ContextProvider'
import PatientRegistration from './components/Patient/patientRegistration'
import AddEmployee from './components/Employee/addEmployee'
import QueueTVScreen from './components/Employee/QueueTVScreen'
import Playground from './playground'
import QRScanner from './QrScanner'
import DoctorAnalyticsQueue from './components/Employee/DoctorAnalyticsQueue'
import PatientDetails from './components/Dashboard/test'
import LabTechnicianDashboard from './components/Laboratory/labTechnicianDashboard'

function App() {
return (
  // PS. OO TINATAMAD NAKO MAG AYOS HALATA NAMAN HAHAHAHAHA
     <ContextProvider>
       <BrowserRouter>
         <Routes>
           <Route path="/" element={<Home />}/>
           <Route path="/signin" element={<Signin />}/>
           <Route path="/patient-registration" element={<PatientRegistration />}/>
           <Route path="/queue-tv" element={<QueueTVScreen />}/>
            <Route path="/gh" element={<AddEmployee />}/>
            <Route path="/doctor/analytics" element={<DoctorAnalyticsQueue />} />
            <Route path="/testing" element={<PatientDetails />} />
            <Route path="/laboratory" element={<LabTechnicianDashboard />} />

        
           {/* DASHBOARD TESTING */}
           <Route path="/test" element={<Dashboard />}/>
           <Route path="/test2" element={<SidebarList />}/>
           <Route path="/dashboardhome" element={<DashboardHome />} />
        
           <Route element={<RouteProtection />} >
             <Route path="/head" element={<Header />}/>
           </Route>

           {/* FEATURE TESTING */}
           <Route path="/play2" element={<Playground />}/>
           <Route path="/qr" element={<QRScanner />}/>
         </Routes>
       </BrowserRouter>
     </ContextProvider>
)}

export default App
