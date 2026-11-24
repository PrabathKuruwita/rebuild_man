"use client";

import React, { useState, useEffect, useRef } from "react";
import { useInView } from "./useInView";

export interface AnimatedCounterProps {
  value: number | string;
  duration?: number; // duration in ms, default ~1000ms
  delay?: number; // delay in ms
  prefix?: string;
  suffix?: string;
  className?: string;
  scrollTrigger?: boolean;
  threshold?: number;
  inView?: boolean; // Optional external inView control
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  delay = 0,
  prefix: propPrefix = "",
  suffix: propSuffix = "",
  className = "",
  scrollTrigger = true,
  threshold = 0.2,
  inView,
}: AnimatedCounterProps) {
  const { ref, isInView, prefersReducedMotion } = useInView<HTMLSpanElement>({
    threshold,
    once: true,
  });

  const isTargetInView = inView !== undefined ? inView : (scrollTrigger ? isInView : true);

  const [currentValue, setCurrentValue] = useState<number>(0);
  const prevValueRef = useRef<number>(0);
  const hasAnimatedRef = useRef<boolean>(false);

  // Parse prefix, number, and suffix
  let isNumeric = false;
  let targetNumber = 0;
  let parsedPrefix = propPrefix;
  let parsedSuffix = propSuffix;
  let hasDecimals = false;
  let decimalPlaces = 0;

  if (typeof value === "number") {
    isNumeric = true;
    targetNumber = isNaN(value) ? 0 : value;
    if (value % 1 !== 0) {
      hasDecimals = true;
      const str = value.toString();
      decimalPlaces = str.split(".")[1]?.length || 1;
    }
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(/^([^0-9.-]*)([0-9.,-]+)([^0-9.]*)$/);
    if (match) {
      isNumeric = true;
      if (!propPrefix && match[1]) parsedPrefix = match[1];
      const numStr = match[2].replace(/,/g, "");
      targetNumber = parseFloat(numStr);
      if (isNaN(targetNumber)) targetNumber = 0;
      if (!propSuffix && match[3]) parsedSuffix = match[3];

      if (numStr.includes(".")) {
        hasDecimals = true;
        decimalPlaces = numStr.split(".")[1]?.length || 1;
      }
    }
  }

  useEffect(() => {
    if (!isNumeric || prefersReducedMotion) {
      return;
    }

    if (!isTargetInView) {
      return;
    }

    const startVal = hasAnimatedRef.current ? prevValueRef.current : 0;
    const diff = targetNumber - startVal;
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    let delayTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const startAnimation = () => {
      const step = (timestamp: number) => {
        if (startTimestamp === null) {
          startTimestamp = timestamp;
        }

        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth easeOutQuart curve: snappy start, gentle deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const nextVal = startVal + diff * easeProgress;

        setCurrentValue(nextVal);

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
        } else {
          setCurrentValue(targetNumber);
          prevValueRef.current = targetNumber;
          hasAnimatedRef.current = true;
        }
      };

      animationFrameId = window.requestAnimationFrame(step);
    };

    if (delay > 0) {
      delayTimeoutId = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [isNumeric, targetNumber, duration, delay, isTargetInView, prefersReducedMotion]);

  if (!isNumeric) {
    return <span ref={ref} className={className}>{value}</span>;
  }

  const effectiveValue = prefersReducedMotion
    ? targetNumber
    : currentValue;

  const formattedNumber = hasDecimals
    ? effectiveValue.toFixed(decimalPlaces)
    : Math.round(effectiveValue).toLocaleString();

  return (
    <span ref={ref} className={`inline-block tabular-nums ${className}`}>
      {parsedPrefix}
      {formattedNumber}
      {parsedSuffix}
    </span>
  );
}
