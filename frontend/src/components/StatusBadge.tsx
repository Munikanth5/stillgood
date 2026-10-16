import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  let styles = 'bg-gray-100 text-gray-700 border-gray-300';

  if (norm.includes('feasible') || norm === 'optimal' || norm === 'eligible' || norm === 'approved' || norm === 'active') {
    styles = 'bg-forest-50 text-forest-800 border-forest-600/30';
  } else if (norm.includes('infeasible') || norm === 'rejected' || norm === 'expired' || norm === 'quarantined' || norm === 'delayed') {
    styles = 'bg-terracotta-bg text-terracotta-dark border-terracotta/40';
  } else if (norm.includes('at_risk') || norm === 'near_expiry' || norm.includes('review') || norm.includes('attention')) {
    styles = 'bg-amber-50 text-amber-900 border-amber-300';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${padding} ${styles} font-sans uppercase`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        styles.includes('forest') ? 'bg-forest-600' :
        styles.includes('terracotta') ? 'bg-terracotta' :
        styles.includes('amber') ? 'bg-amber-500' : 'bg-gray-400'
      }`} />
      {status.replace('_', ' ')}
    </span>
  );
};
