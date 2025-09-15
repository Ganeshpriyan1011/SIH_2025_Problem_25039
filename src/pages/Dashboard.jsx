// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ReportItem from "../components/ReportItem";


const Dashboard = () => {
  // 🔹 Mock state (replace with API later)
  const [stats, setStats] = useState({
    activeReports: 23,
    
    activeUsers: 1247,
    socialMentions: 847,
  });

  const [reports, setReports] = useState([
    { title: "Tsunami Warning", location: "Chennai Coast", time: "2 minutes ago", severity: "high" },
    { title: "High Waves", location: "Mumbai Harbor", time: "15 minutes ago", severity: "medium" },
    { title: "strom surge", location: "Mumbai Harbor", time: "15 minutes ago", severity: "medium" },
    { title: "coastal flooding", location: "Mumbai Harbor", time: "15 minutes ago", severity: "low" },
    { title: "coastal damage", location: "Mumbai Harbor", time: "15 minutes ago", severity: "medium" },
  

  ]);
  



  // 🔹 Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5), // fluctuate users
        socialMentions: prev.socialMentions + Math.floor(Math.random() * 5),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Dynamic color logic for StatCards
  const getStatColor = (key, value) => {
    switch (key) {
      case "activeReports":
        return value > 20 ? "red" : "green";
      case "activeUsers":
        return value > 1000 ? "green" : "yellow";
      case "socialMentions":
        return value > 800 ? "yellow" : "green";
      default:
        return "blue";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Ocean Watch Dashboard</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
              ● Live Status: All Systems Active
            </span>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Active Reports"
              value={stats.activeReports}
              change="+12% from last hour"
              color={getStatColor("activeReports", stats.activeReports)}
            />
            
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              change="Citizens online now"
              color={getStatColor("activeUsers", stats.activeUsers)}
            />
            <StatCard
              title="Social Mentions"
              value={stats.socialMentions}
              change="Last 24 hours"
              color={getStatColor("socialMentions", stats.socialMentions)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Reports */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="font-semibold mb-4">Recent Hazard Reports</h2>
              {reports.map((r, idx) => (
                <ReportItem key={idx} {...r} />
              ))}
            </div>

          
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
