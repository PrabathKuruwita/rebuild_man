"use client";

import React from "react";

interface SuccessCheckmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function SuccessCheckmark({
  size = "lg",
  className = "",
}: SuccessCheckmarkProps) {
  const sizeMap = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${className}`}
    >
      {/* Expanding celebration halo wave 1 */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-success-ping-1 pointer-events-none" />
      {/* Expanding celebration halo wave 2 */}
      <div className="absolute inset-0 rounded-full bg-emerald-400/15 animate-success-ping-2 pointer-events-none" />

      {/* Main SVG Checkmark with pop & stroke animations */}
      <div className="relative w-full h-full animate-success-pop flex items-center justify-center">
        <svg
          viewBox="0 0 52 52"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle filled background circle */}
          <circle
            cx="26"
            cy="26"
            r="24"
            className="fill-emerald-50"
          />

          {/* Animated circular outline stroke */}
          <circle
            cx="26"
            cy="26"
            r="23"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-emerald-500 animate-circle-draw"
          />

          {/* Animated checkmark icon */}
          <path
            d="M15 27.5 L22.8 35.3 L37 19"
            stroke="currentColor"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-600 animate-check-draw"
          />
        </svg>
      </div>
    </div>
  );
}
