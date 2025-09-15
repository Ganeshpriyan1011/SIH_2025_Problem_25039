// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="bg-white shadow px-6 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <span className="font-bold text-lg">🌊 Ocean Watch</span>
      </div>
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-3 py-1 text-sm"
        />
        <Link to="/settings" className="text-gray-600 hover:text-gray-900">
          ⚙️
        </Link>
        <button className="text-gray-600 hover:text-gray-900">🔔</button>
      </div>
    </header>
  );
};

export default Navbar;
