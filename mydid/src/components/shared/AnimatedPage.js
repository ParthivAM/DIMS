import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

export default function AnimatedPage({ children, gradient, className, style, ...props }) {
  const { isDarkMode } = useTheme();

  // Get background based on theme mode
  const getBackground = () => {
    if (gradient) {
      return gradient; // Use custom gradient if provided
    }

    // Default backgrounds based on theme mode
    if (isDarkMode) {
      return '#141E30'; // Solid Navy Dark to match Navbar
    } else {
      return '#EEF2F6'; // Matches index.css --bg-primary
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen ${className || ''}`}
      style={{
        background: getBackground(),
        transition: 'background 0.3s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}