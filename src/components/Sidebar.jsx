// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Map,
  MapPin,
  AlertTriangle,
  FileText,
  Globe,
  Settings,
  HelpCircle,
} from "lucide-react"; // ✅ Import icons

const Sidebar = () => {
  const sections = [
    {
      title: "Navigation",
      items: [
        { path: "/", label: "Dashboard", icon: <Home size={18} /> },
        { path: "/live-map", label: "Live Map", icon: <MapPin size={18} /> },
      ],
    },
    {
      title: "Monitoring",
      items: [
        {
          path: "/report-hazard",
          label: "Report Hazard",
          icon: <AlertTriangle size={18} />,
        },
        {
          path: "/my-reports",
          label: "My Reports",
          icon: <FileText size={18} />,
        },
        {
          path: "/social-media",
          label: "Social Media",
          icon: <Globe size={18} />, // 🌍 better icon for social
        },
      ],
    },
    {
      title: "Management",
      items: [
        { path: "/settings", label: "Settings", icon: <Settings size={18} /> },
        { path: "/support", label: "Support", icon: <HelpCircle size={18} /> },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white shadow-md p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🌊 Ocean Watch</h1>

      {sections.map((section, idx) => (
        <div key={idx} className="mb-6">
          <h2 className="text-xs uppercase text-gray-400 font-semibold mb-2">
            {section.title}
          </h2>
          <nav className="flex flex-col space-y-1">
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
