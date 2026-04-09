import { type MotionProps, useReducedMotion } from "framer-motion";

export const MOTION_CLASSNAMES = {
  pressable: "transition-transform duration-200 motion-safe:active:scale-[0.98] motion-reduce:active:scale-100",
  fadeInSubtle: "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none",
  fadeInOverlay: "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none",
  panelEnter: "motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:slide-in-from-top-4 motion-safe:duration-200 motion-safe:ease-out motion-reduce:animate-none",
  slideUpEnter: "motion-safe:animate-in motion-safe:slide-in-from-bottom-5 motion-safe:duration-200 motion-reduce:animate-none",
  fieldFeedback: "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-reduce:animate-none",
  sidebar: "transition-[transform,width] duration-300 ease-in-out motion-reduce:transition-none",
} as const;

export function useStatusBadgeMotion(): MotionProps {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return {
      initial: false,
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0 },
    };
  }

  return {
    layout: true,
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: "spring", stiffness: 300, damping: 20 },
  };
}
