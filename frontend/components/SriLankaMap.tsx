"use client";

import { Organization } from "@/lib/api";
import { useState } from "react";

interface SriLankaMapProps {
  organizations?: Organization[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SriLankaMap({ organizations: _organizations = [] }: SriLankaMapProps) {
  const [hoveredHospital, setHoveredHospital] = useState<number | null>(null);

  // Simplified hospital locations on Sri Lanka map (approximate coordinates)
  const hospitalLocations = [
    { id: 1, name: "Western Province Hospital", x: 25, y: 35, district: "Colombo" },
    { id: 2, name: "Central Province Medical Center", x: 55, y: 50, district: "Kandy" },
    { id: 3, name: "Northern Hospital", x: 40, y: 15, district: "Jaffna" },
    { id: 4, name: "Eastern Province Clinic", x: 75, y: 40, district: "Trincomalee" },
    { id: 5, name: "Southern Health Center", x: 35, y: 80, district: "Matara" },
    { id: 6, name: "Sabaragamuwa Facility", x: 50, y: 60, district: "Ratnapura" },
    { id: 7, name: "Northwestern Hospital", x: 15, y: 30, district: "Kurunegala" },
    { id: 8, name: "North Central Medical", x: 50, y: 35, district: "Anuradhapura" },
    { id: 9, name: "Uva Province Clinic", x: 70, y: 65, district: "Badulla" },
  ];

  return (
    <div className="w-full h-full bg-linear-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-xl overflow-hidden relative">
      {/* Sri Lanka Map SVG */}
      <svg
        viewBox="0 0 100 120"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Sri Lanka Outline - Simplified shape */}
        <defs>
          <linearGradient id="sriLankaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "rgba(255,255,255,0.1)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "rgba(255,255,255,0.05)", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Water/Background */}
        <rect width="100" height="120" fill="url(#sriLankaGradient)" />

        {/* Sri Lanka Main Shape */}
        <path
          d="M 30 10 Q 50 5 60 15 Q 70 25 70 45 Q 75 60 68 80 Q 60 95 50 100 Q 35 102 25 95 Q 15 85 12 65 Q 10 45 15 25 Q 20 12 30 10 Z"
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
        />

        {/* Province boundaries (subtle) */}
        <line x1="40" y1="20" x2="50" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="35" y1="50" x2="65" y2="55" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,2" />

        {/* Hospital Markers */}
        {hospitalLocations.map((hospital) => (
          <g key={hospital.id}>
            {/* Outer glow effect */}
            <circle
              cx={hospital.x}
              cy={hospital.y}
              r={hoveredHospital === hospital.id ? 4.5 : 3}
              fill="rgba(34, 197, 94, 0.2)"
              className="transition-all duration-300"
            />

            {/* Hospital marker */}
            <circle
              cx={hospital.x}
              cy={hospital.y}
              r={hoveredHospital === hospital.id ? 3 : 2.2}
              fill={hoveredHospital === hospital.id ? "#22c55e" : "#10b981"}
              className="cursor-pointer transition-all duration-300 hover:brightness-125"
              onMouseEnter={() => setHoveredHospital(hospital.id)}
              onMouseLeave={() => setHoveredHospital(null)}
            />

            {/* Plus symbol inside marker */}
            <g
              opacity={hoveredHospital === hospital.id ? 1 : 0.7}
              className="transition-opacity duration-300 pointer-events-none"
            >
              <line
                x1={hospital.x}
                y1={hospital.y - 1.2}
                x2={hospital.x}
                y2={hospital.y + 1.2}
                stroke="white"
                strokeWidth="0.8"
              />
              <line
                x1={hospital.x - 1.2}
                y1={hospital.y}
                x2={hospital.x + 1.2}
                y2={hospital.y}
                stroke="white"
                strokeWidth="0.8"
              />
            </g>

            {/* Tooltip on hover */}
            {hoveredHospital === hospital.id && (
              <g>
                {/* Tooltip background */}
                <rect
                  x={hospital.x - 8}
                  y={hospital.y - 16}
                  width="16"
                  height="10"
                  rx="1.5"
                  fill="white"
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="0.5"
                />

                {/* Tooltip text */}
                <text
                  x={hospital.x}
                  y={hospital.y - 9}
                  textAnchor="middle"
                  fontSize="1.5"
                  fill="#1f2937"
                  fontWeight="500"
                  pointerEvents="none"
                >
                  {hospital.id}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Legend and Stats - Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        {/* Top Badge */}
        <div className="flex justify-between items-start">
          <div />
          <div className="bg-linear-to-r from-green-400 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
            SRI LANKA COVERAGE
          </div>
        </div>

        {/* Bottom Info */}
        <div className="flex justify-between items-end gap-4 text-xs">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 bg-white bg-opacity-20 backdrop-blur-sm px-2 py-1.5 rounded-lg border border-white border-opacity-30">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-white font-medium">Live</span>
          </div>

          {/* Hospital Count */}
          <div className="text-white font-semibold text-sm bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white border-opacity-30">
            📍 {hospitalLocations.length} Hospitals
          </div>
        </div>
      </div>

      {/* Hover Tooltip Info */}
      {hoveredHospital && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg p-3 shadow-xl z-20">
          <div className="text-sm font-semibold text-gray-900">
            {hospitalLocations.find((h) => h.id === hoveredHospital)?.name}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            📍 {hospitalLocations.find((h) => h.id === hoveredHospital)?.district}
          </div>
        </div>
      )}
    </div>
  );
}
