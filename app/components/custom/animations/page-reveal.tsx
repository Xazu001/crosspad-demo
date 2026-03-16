import "./page-reveal.style.scss";

import { type FC, type ReactNode } from "react";

import { type Variants, motion } from "framer-motion";

// ================================================================
// ------------------------- PAGE REVEAL --------------------------
// ================================================================

interface PageRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  delay?: number;
  className?: string;
}

const PageReveal: FC<PageRevealProps> = ({
  children,
  direction = "up",
  duration = 0.5,
  delay = 0,
  className = "",
}) => {
  // Define animation variants based on direction
  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
      x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        delay,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      y: direction === "up" ? -20 : direction === "down" ? 20 : 0,
      x: direction === "left" ? -20 : direction === "right" ? 20 : 0,
      transition: {
        duration: duration * 0.75,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
    >
      {children}
    </motion.div>
  );
};

export { PageReveal };
