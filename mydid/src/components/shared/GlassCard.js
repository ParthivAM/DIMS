import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ 
  children, 
  className = '', 
  hover = true,
  onClick,
  ...props 
}) {
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  const hoverVariants = hover ? {
    scale: 1.02,
    boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.37)',
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  } : {};

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverVariants}
      onClick={onClick}
      className={`glass-card ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Specialized variants
export function InfoCard({ icon: Icon, title, value, className = '' }) {
  return (
    <GlassCard className={`flex flex-col space-y-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Icon className="w-7 h-7 text-white" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="bg-slate-800/80 border-2 border-slate-600 rounded-xl p-4">
        <p className="text-base font-mono font-bold text-white break-all leading-relaxed">
          {value}
        </p>
      </div>
    </GlassCard>
  );
}

export function StatCard({ label, value, icon: Icon, trend, className = '' }) {
  return (
    <GlassCard className={className}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        {Icon && (
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-indigo-400" />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{value}</span>
        {trend && (
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </GlassCard>
  );
}
