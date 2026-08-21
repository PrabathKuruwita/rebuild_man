"use client";

import React, { useState, useEffect } from 'react';

interface AnimatedStatProps {
  value: number;
  duration?: number; // duration in ms
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function AnimatedStat({ 
  value, 
  duration = 800,
  prefix = "",
  suffix = "",
  className = ""
}: AnimatedStatProps) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutQuart easing function
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setCurrentValue(Math.floor(easeProgress * value));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCurrentValue(value);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    
    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  // Use a fallback for non-number values or just render the animated number
  return (
    <span className={className}>
      {prefix}{currentValue.toLocaleString()}{suffix}
    </span>
  );
}
