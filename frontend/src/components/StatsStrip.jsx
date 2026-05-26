import React from 'react';
import { Inbox, Activity, CheckCircle, Archive, AlertTriangle } from 'lucide-react';

const StatsStrip = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="stats-strip">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="stat-card" style={{ opacity: 0.5 }}>
            <div className="stat-info">
              <span className="stat-label">Loading...</span>
              <span className="stat-value">-</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const { statusCounts = {}, openSlaBreachedCount = 0 } = stats;

  const statItems = [
    {
      label: 'Open',
      value: statusCounts.open || 0,
      icon: <Inbox size={20} className="column-indicator" style={{ color: '#3b82f6' }} />,
      color: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.1)'
    },
    {
      label: 'In Progress',
      value: statusCounts.in_progress || 0,
      icon: <Activity size={20} className="column-indicator" style={{ color: '#a855f7' }} />,
      color: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.1)'
    },
    {
      label: 'Resolved',
      value: statusCounts.resolved || 0,
      icon: <CheckCircle size={20} className="column-indicator" style={{ color: '#10b981' }} />,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.1)'
    },
    {
      label: 'Closed',
      value: statusCounts.closed || 0,
      icon: <Archive size={20} className="column-indicator" style={{ color: '#6b7280' }} />,
      color: '#6b7280',
      bgGlow: 'rgba(107, 114, 128, 0.1)'
    }
  ];

  return (
    <div className="stats-strip">
      {statItems.map((item) => (
        <div key={item.label} className="stat-card">
          <div className="stat-info">
            <span className="stat-label">{item.label} Tickets</span>
            <span className="stat-value" style={{ color: item.color }}>{item.value}</span>
          </div>
          <div className="stat-icon" style={{ background: item.bgGlow }}>
            {item.icon}
          </div>
        </div>
      ))}

      <div className="stat-card breached">
        <div className="stat-info">
          <span className="stat-label" style={{ color: '#f87171' }}>SLA Breached (Open)</span>
          <span className="stat-value">{openSlaBreachedCount}</span>
        </div>
        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
          <AlertTriangle size={20} style={{ color: '#ef4444' }} />
        </div>
      </div>
    </div>
  );
};

export default StatsStrip;
