// src/components/ReportItem.jsx
import React from "react";

const severityColors = {
  high: "bg-red-100 text-red-600",
  medium: "bg-yellow-100 text-yellow-600",
  low: "bg-green-100 text-green-600",
};

const ReportItem = ({ title, location, time, severity }) => {
  return (
    <div className="flex justify-between items-center p-3 border-b last:border-none">
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-gray-500">
          {location} • {time}
        </p>
      </div>
      <span
        className={`text-xs px-2 py-1 rounded ${severityColors[severity] || "bg-gray-100 text-gray-600"}`}
      >
        {severity}
      </span>
    </div>
  );
};

export default ReportItem;
