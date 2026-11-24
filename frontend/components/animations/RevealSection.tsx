"use client";

import React from "react";
import { useInView } from "./useInView";

export interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // delay in seconds (e.g. 0.08) or ms if > 10
  y?: number; // vertical slide distance in px, default 20
  duration?: number; // duration in ms, default 600ms
  threshold?: number;
  as?: React.ElementType;
  style?: React.CSSProperties;
}

export default function RevealSection({
  children,
  className = "",
  delay = 0,
  y = 20,
  duration = 600,
  threshold = 0.15,
  as: Component = "div",
  style = {},
}: RevealSectionProps) {
  const { ref, isInView, prefersReducedMotion } = useInView<HTMLDivElement>({
    threshold,
    once: true,
  });

  // Normalize delay: if > 10, assume milliseconds, else seconds
  const delaySec = delay > 10 ? delay / 1000 : delay;

  const animationStyles: React.CSSProperties = prefersReducedMotion
    ? { opacity: 1, transform: "none" }
    : {
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translate3d(0, 0, 0)" : `translate3d(0, ${y}px, 0)`,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delaySec}s, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delaySec}s`,
        willChange: isInView ? "auto" : "opacity, transform",
        ...style,
      };

  return (
    <Component
      ref={ref}
      className={className}
      style={animationStyles}
    >
      {children}
    </Component>
  );
}

export interface RevealItemProps extends RevealSectionProps {
  index?: number;
  staggerDelay?: number; // delay per index in seconds (default 0.08)
}

export function RevealItem({
  children,
  index = 0,
  staggerDelay = 0.08,
  delay,
  ...rest
}: RevealItemProps) {
  const computedDelay = delay !== undefined ? delay : index * staggerDelay;
  return (
    <RevealSection delay={computedDelay} {...rest}>
      {children}
    </RevealSection>
  );
}
