import React, { useState } from 'react';
import TicketCard from './TicketCard';

const COLUMNS = [
  { id: 'open', title: 'Open', color: '#3b82f6' },
  { id: 'in_progress', title: 'In Progress', color: '#a855f7' },
  { id: 'resolved', title: 'Resolved', color: '#10b981' },
  { id: 'closed', title: 'Closed', color: '#6b7280' }
];

const TicketBoard = ({ tickets, onMoveStatus, onDeleteTicket, onInvalidDrop }) => {
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    
    const ticketId = e.dataTransfer.getData('text/plain');
    if (!ticketId) return;

    // Find the ticket to verify if it is a valid transition before calling backend
    const ticket = tickets.find(t => t._id === ticketId);
    if (!ticket) return;

    const sourceStatus = ticket.status;
    
    // Status index difference mapping
    const statusIndices = { open: 0, in_progress: 1, resolved: 2, closed: 3 };
    const sourceIdx = statusIndices[sourceStatus];
    const targetIdx = statusIndices[targetStatus];
    const diff = targetIdx - sourceIdx;

    if (Math.abs(diff) > 1) {
      // Trigger error and visual snap back
      onInvalidDrop(
        `Cannot drop ticket directly from "${sourceStatus}" to "${targetStatus}". Transitions must be step-by-step (e.g., Open ⇄ In Progress ⇄ Resolved ⇄ Closed).`
      );
      
      // Visual feedback: briefly highlight the card with a shake or error class
      const card = document.getElementById(`card-${ticketId}`);
      if (card) {
        card.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => {
          card.style.animation = '';
        }, 400);
      }
      return;
    }

    // Valid transition, call parent handler
    onMoveStatus(ticketId, targetStatus);
  };

  // Add shaking animation style programmatically to avoid separating it from this component
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); border-color: rgba(239, 68, 68, 0.4); }
        20%, 60% { transform: translateX(-6px); }
        40%, 80% { transform: translateX(6px); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="board-container">
      {COLUMNS.map((column) => {
        const columnTickets = tickets.filter((t) => t.status === column.id);

        return (
          <div
            key={column.id}
            className={`board-column ${dragOverCol === column.id ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="column-header">
              <div className="column-title">
                <span
                  className="column-indicator"
                  style={{ backgroundColor: column.color, boxShadow: `0 0 8px ${column.color}` }}
                />
                <span>{column.title}</span>
              </div>
              <span className="column-count">{columnTickets.length}</span>
            </div>

            <div className="column-cards">
              {columnTickets.length > 0 ? (
                columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket._id}
                    ticket={ticket}
                    onMoveStatus={onMoveStatus}
                    onDeleteTicket={onDeleteTicket}
                  />
                ))
              ) : (
                <div 
                  style={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--text-muted)', 
                    fontSize: '0.8rem',
                    border: '1px dashed rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    minHeight: '200px'
                  }}
                >
                  No tickets
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TicketBoard;
