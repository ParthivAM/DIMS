import React from 'react';
import '../../styles/walletTheme.css';

/**
 * WalletCard - Apple Wallet-inspired credential card
 * 
 * @param {Object} props
 * @param {'StudentID' | 'AcademicCertificate' | 'Verification'} props.type - Card type
 * @param {string} props.title - Main title
 * @param {string} [props.subtitle] - Optional subtitle
 * @param {'Verified' | 'Pending' | 'Revoked' | 'Failed'} [props.headerBadge] - Status badge
 * @param {React.ReactNode} [props.icon] - Icon element
 * @param {Array<{label: string, value: string}>} [props.meta] - Metadata rows
 * @param {Array<{label: string, onClick: function, variant?: 'primary'|'ghost'|'danger', icon?: ReactNode}>} [props.actions] - Action buttons
 * @param {function} [props.onExpand] - Expand handler
 * @param {React.ReactNode} [props.children] - Custom body content
 */
export default function WalletCard({
  type = 'StudentID',
  title,
  subtitle,
  headerBadge,
  icon,
  meta = [],
  actions = [],
  onExpand,
  children
}) {
  const getHeaderClass = () => {
    switch (type) {
      case 'AcademicCertificate':
        return 'academic-cert';
      case 'Verification':
        return 'verification';
      default:
        return 'student-id';
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'AcademicCertificate':
        return '🎓';
      case 'Verification':
        return '✓';
      default:
        return '🆔';
    }
  };

  const getBadgeClass = () => {
    switch (headerBadge?.toLowerCase()) {
      case 'verified':
        return 'verified';
      case 'failed':
        return 'failed';
      case 'pending':
        return 'pending';
      case 'revoked':
        return 'revoked';
      default:
        return '';
    }
  };

  return (
    <div 
      className="wallet-card animate-scale-in" 
      onClick={onExpand}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onExpand?.();
        }
      }}
      aria-label={`${title} credential card`}
    >
      {/* Header with gradient */}
      <div className={`wallet-card-header ${getHeaderClass()}`}>
        <div className="wallet-card-icon">
          {icon || getDefaultIcon()}
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="wallet-card-title">{title}</h3>
          {subtitle && <p className="wallet-card-subtitle">{subtitle}</p>}
        </div>
        {headerBadge && (
          <span className={`wallet-badge ${getBadgeClass()}`}>
            {headerBadge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="wallet-card-body">
        {children || (
          <div className="wallet-card-meta">
            {meta.map((item, index) => (
              <div key={index} className="wallet-card-meta-item">
                <span className="wallet-card-meta-label">{item.label}</span>
                <span className="wallet-card-meta-value" title={item.value}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="wallet-card-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`wallet-action-btn ${action.variant || 'ghost'}`}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(e);
              }}
              aria-label={action.label}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
