import React from 'react';

interface ElevatedCardProps {
  children: React.ReactNode;
  className?: string;
  isInteractive?: boolean;
  isDominant?: boolean;
}

export default function ElevatedCard({ 
  children, 
  className = "", 
  isInteractive = false,
  isDominant = false
}: ElevatedCardProps) {
  const baseShadow = isDominant 
    ? "shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-primary/20" 
    : "shadow-[0_4px_20px_rgb(0,0,0,0.05)] border-slate-100";
    
  const hoverEffect = isInteractive 
    ? "transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] cursor-pointer" 
    : "";

  return (
    <div className={`bg-white rounded-xl border ${baseShadow} ${hoverEffect} ${className}`}>
      {children}
    </div>
  );
}
