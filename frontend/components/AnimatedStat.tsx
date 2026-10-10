"use client";

import React, { useState, useEffect, useRef } from 'react';

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
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const diff = value - startVal;
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (startTimestamp === null) {
        startTimestamp = timestamp;
      }

      const progress = Math.min(
        (timestamp - startTimestamp) / duration,
        1,
      );

      const easeProgress = 1 - Math.pow(1 - progress, 4);

      setCurrentValue(Math.round(startVal + diff * easeProgress));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCurrentValue(value);
        prevValueRef.current = value;
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{currentValue.toLocaleString()}{suffix}
    </span>
  );
}
