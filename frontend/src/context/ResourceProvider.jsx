import { createContext, useState } from "react"

export const ResourceContext = createContext()

export default function ResourceProvider({ children }) {
  const [sidebarList, setSidebarList] = useState([
    {
      id: "General",
      items: [
        { item: "Dashboard", icon: "LayoutDashboard"},
        { item: "Manage Employee", icon: "Users"},
        { item: "Patient List", icon: "List" },
        { item: "Register Patient", icon: "FilePenLine" },
        { item: "Appointments", icon: "CalendarDays" },
        { item: "Doctor Analytic/Appointment", icon: "Users" },
        { item: "Appointment Scan", icon: "Users" },
        { item: "Laboratory", icon: "Users" },
        { item: "Admit", icon: "Users" },
        
      ],
    },
    {
      id: "Finance and Billing",
      items: [
        { item: "Finance Dashboard", icon: "PieChart" },
        { item: "Billing Statements", icon: "Receipt" },
      ],
    },
  ])

  return (
    <ResourceContext.Provider value={[sidebarList, setSidebarList]}>
      {children}
    </ResourceContext.Provider>
  )
}
