import React, { useEffect } from 'react';
import '../../styles/walletTheme.css';

/**
 * CardDetailsDrawer - Slide-up drawer for detailed credential view
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Drawer open state
 * @param {function} props.onClose - Close handler
 * @param {string} props.title - Drawer title
 * @param {React.ReactNode} props.children - Drawer content
 */
export default function CardDetailsDrawer({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
      
      // Focus trap
      const drawer = document.querySelector('.wallet-drawer');
      if (drawer) {
        drawer.focus();
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="wallet-drawer-overlay" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        className="wallet-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="wallet-drawer-header">
          <h2 id="drawer-title" className="wallet-drawer-title">{title}</h2>
          <button 
            className="wallet-drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="wallet-drawer-body">
          {children}
        </div>
      </div>
    </>
  );
}
