import { useContext, useState } from "react";
import { ResourceContext } from "../context/ResourceProvider";
import { SelectionContext } from "../context/SelectionProvider";
import { LayoutDashboard, ShoppingCart, Users, Calendar, FilePenLine, List } from "lucide-react";

export default function SidebarList() {
  const [active, setActive] = useState("Dashboard");
  const [listOption, setListOption] = useContext(ResourceContext);
  const [selection, setSelection] = useContext(SelectionContext);

  // Get role from localStorage or wherever you store it
  const role = localStorage.getItem('position')?.toLowerCase() || 'staff'; // Default to 'staff'

  // icon map for easy lookup
  const iconMap = {
    Dashboard: <LayoutDashboard size={18} />,
    "Manage Employee": <Users size={18} />,
    "Patient List": <List size={18} />,
    "Register Patient": <FilePenLine size={18} />,
    "Appointments": <Calendar size={18} />,
    "Finance Dashboard": <ShoppingCart size={18} />,
    "Billing Statements": <ShoppingCart size={18} />,
    "Doctor Analytic/Appointment": <Users size={18} />,
    "Appointment Scan": <Users size={18} />,
    "Laboratory": <Users size={18} />,
    "Admit": <Users size={18} />,
    "Queue": <Users size={18} />,
    "Analytics": <Users size={18} />
  };

  const rolePermissions = {
    admin: [
      "Manage Employee", 
      "Patient List", 
      "Register Patient", 
      "Appointments",
      "Doctor Analytic/Appointment",
      "Appointment Scan",
      "Laboratory",
      "Admit",
      "Analytics"
    ],
    "general physician": [
      "Dashboard", 
      "Patient List", 
      "Register Patient", 
      "Appointments",
      "Doctor Analytic/Appointment"
    ],
    radiologist: [
      "Laboratory"
    ],
    doctor: [
 
      "Patient List", 
      "Register Patient", 
      "Appointments",
      "Doctor Analytic/Appointment"
    ],
    nurse: [

      "Patient List", 
      "Register Patient",
      "Admit"
    ],
    medtech: [
        "Laboratory"
    ],
    receptionist: [
      "Appointment Scan",
      "Queue"
    ],
   
  };

  const handleClick = (item) => {
    setActive(item);
    setSelection(item);
  };

  // Filter the sidebar items based on role
  const filteredListOption = listOption.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // Check if current role has permission for this item
      const hasPermission = rolePermissions[role]?.includes(item.item);
      return hasPermission;
    })
  })).filter(section => section.items.length > 0); // Remove empty sections

  return (
    <div className="flex flex-col w-64 p-6 text-gray-500 poppins space-y-6">
      {filteredListOption.map((section) => (
        <div key={section.id}>
          <h1 className="text-xs font-semibold uppercase tracking-wider mb-3 text-gray-400">
            {section.id}
          </h1>

          <div className="space-y-1">
            {section.items.map((item) => (
              <div
                key={item.item}
                onClick={() => handleClick(item.item)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  active === item.item
                    ? "bg-[#EEF1FD] text-black font-medium"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-md ${
                    active === item.item
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {iconMap[item.item] || <LayoutDashboard size={18} />}
                </div>
                <span className="text-sm">{item.item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}