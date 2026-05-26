import React from 'react';
import { Mail, Clock, ShieldAlert, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';

const formatAge = (minutes) => {
  if (minutes < 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMinutes}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
};

const TicketCard = ({ ticket, onMoveStatus, onDeleteTicket }) => {
  const { _id, subject, description, customerEmail, priority, status, ageMinutes, slaBreached } = ticket;

  // Handle HTML5 Drag Start
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', _id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add dragging styling slightly delayed so the ghost image is still fully opaque
    setTimeout(() => {
      const card = document.getElementById(`card-${_id}`);
      if (card) card.classList.add('dragging');
    }, 0);
  };

  // Handle Drag End
  const handleDragEnd = () => {
    const card = document.getElementById(`card-${_id}`);
    if (card) card.classList.remove('dragging');
  };

  // Define adjacent transitions based on strict state rules
  // Allowed: open ⇄ in_progress ⇄ resolved ⇄ closed
  const renderTransitionButtons = () => {
    switch (status) {
      case 'open':
        return (
          <div className="action-btn-group">
            <button 
              className="action-btn move-next"
              onClick={() => onMoveStatus(_id, 'in_progress')}
              title="Move to In Progress"
            >
              <span>Work</span>
              <ArrowRight size={14} />
            </button>
          </div>
        );
      case 'in_progress':
        return (
          <div className="action-btn-group">
            <button 
              className="action-btn move-prev"
              onClick={() => onMoveStatus(_id, 'open')}
              title="Return to Open"
            >
              <ArrowLeft size={14} />
              <span>Reset</span>
            </button>
            <button 
              className="action-btn move-next"
              onClick={() => onMoveStatus(_id, 'resolved')}
              title="Resolve Ticket"
            >
              <span>Resolve</span>
              <ArrowRight size={14} />
            </button>
          </div>
        );
      case 'resolved':
        return (
          <div className="action-btn-group">
            <button 
              className="action-btn move-prev"
              onClick={() => onMoveStatus(_id, 'in_progress')}
              title="Reopen to In Progress"
            >
              <ArrowLeft size={14} />
              <span>Reopen</span>
            </button>
            <button 
              className="action-btn move-next"
              onClick={() => onMoveStatus(_id, 'closed')}
              title="Close Ticket"
            >
              <span>Close</span>
              <ArrowRight size={14} />
            </button>
          </div>
        );
      case 'closed':
        return (
          <div className="action-btn-group">
            <button 
              className="action-btn move-prev"
              onClick={() => onMoveStatus(_id, 'resolved')}
              title="Reopen to Resolved"
            >
              <ArrowLeft size={14} />
              <span>Undo Close</span>
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id={`card-${_id}`}
      className={`ticket-card ${slaBreached ? 'breached-card' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="card-header">
        <span className="card-subject">{subject}</span>
        <span className={`priority-badge ${priority}`}>
          {priority}
        </span>
      </div>

      <p className="card-description">{description}</p>

      <div className="card-meta">
        <div className="meta-item">
          <Mail size={12} />
          <span className="email-text" title={customerEmail}>{customerEmail}</span>
        </div>
        <div className="meta-item">
          <Clock size={12} />
          <span>Age: {formatAge(ageMinutes)}</span>
        </div>
        {slaBreached && (
          <div className="sla-breached-alert">
            <ShieldAlert size={12} />
            <span>SLA BREACHED</span>
          </div>
        )}
      </div>

      <div className="card-actions">
        {renderTransitionButtons()}
        <button 
          className="delete-btn"
          onClick={() => onDeleteTicket(_id)}
          title="Delete Ticket"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

export default TicketCard;
