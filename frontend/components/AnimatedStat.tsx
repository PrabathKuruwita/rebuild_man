"use client";

import React from "react";
import AnimatedCounter from "./animations/AnimatedCounter";

interface AnimatedStatProps {
  value: number;
  duration?: number; // duration in ms
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function AnimatedStat({ 
  value, 
  duration = 900,
  prefix = "",
  suffix = "",
  className = ""
}: AnimatedStatProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      prefix={prefix}
      suffix={suffix}
      className={className}
      scrollTrigger={true}
      threshold={0.2}
    />
  );
}
