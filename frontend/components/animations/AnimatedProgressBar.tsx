"use client";

import React from "react";
import { useInView } from "./useInView";

export interface AnimatedProgressBarProps {
  percentage: number;
  duration?: number; // duration in ms, default 800ms
  delay?: number; // delay in ms, default 0ms
  containerClassName?: string;
  barClassName?: string;
  showShimmer?: boolean;
  threshold?: number;
  scrollTrigger?: boolean;
  style?: React.CSSProperties;
}

export default function AnimatedProgressBar({
  percentage,
  duration = 800,
  delay = 0,
  containerClassName = "w-full bg-slate-200 h-1.5 rounded-full overflow-hidden relative",
  barClassName = "h-full bg-blue-500 rounded-full",
  showShimmer = false,
  threshold = 0.2,
  scrollTrigger = true,
  style,
}: AnimatedProgressBarProps) {
  const { ref, isInView, prefersReducedMotion } = useInView<HTMLDivElement>({
    threshold,
    once: true,
  });

  const clampedPercentage = Math.min(100, Math.max(0, isNaN(percentage) ? 0 : percentage));
  const activeWidth = prefersReducedMotion || (!scrollTrigger || isInView) ? `${clampedPercentage}%` : "0%";

  const transitionStyle: React.CSSProperties = prefersReducedMotion
    ? {}
    : {
        transitionProperty: "width",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
      };

  return (
    <div ref={ref} className={containerClassName} style={style}>
      <div
        className={`${barClassName} relative overflow-hidden`}
        style={{
          width: activeWidth,
          ...transitionStyle,
        }}
      >
        {showShimmer && clampedPercentage > 0 && clampedPercentage < 100 && (
          <div className="absolute inset-0 lobby-progress-shimmer pointer-events-none" />
        )}
      </div>
    </div>
  );
}
