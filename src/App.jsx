// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

// placeholder pages
const LiveMap = () => <h1 className="p-6">🌍 Live Map Page</h1>;
const ReportHazard = () => <h1 className="p-6">⚠️ Report Hazard Page</h1>;
const MyReports = () => <h1 className="p-6">📑 My Reports Page</h1>;
const SocialMedia = () => <h1 className="p-6">📢 Social Media Monitoring Page</h1>; // ✅ New Page

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/live-map" element={<LiveMap />} />
      <Route path="/report-hazard" element={<ReportHazard />} />
      <Route path="/my-reports" element={<MyReports />} />
      <Route path="/social-media" element={<SocialMedia />} /> {/* ✅ New Route */}
    </Routes>
  );
}

export default App;
