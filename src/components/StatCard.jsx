// src/components/StatCard.jsx
import React from "react";

const colorMap = {
  red: "text-red-600 bg-red-100",
  blue: "text-blue-600 bg-blue-100",
  green: "text-green-600 bg-green-100",
  yellow: "text-yellow-600 bg-yellow-100",
};

const StatCard = ({ title, value, change, color }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow flex flex-col">
      <h3 className="text-gray-500 text-sm mb-1">{title}</h3>
      <span className="text-2xl font-bold">{value}</span>
      <span className={`mt-1 text-xs px-2 py-1 rounded ${colorMap[color]}`}>
        {change}
      </span>
    </div>
  );
};

export default StatCard;
