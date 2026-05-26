import React, { useState, useEffect } from 'react';
import { Plus, ShieldAlert, SlidersHorizontal, RefreshCw } from 'lucide-react';
import StatsStrip from './components/StatsStrip';
import TicketBoard from './components/TicketBoard';
import TicketForm from './components/TicketForm';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState(null);

  // Filters state
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [breachedFilter, setBreachedFilter] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Show a visual toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Automatically clear toast after 4s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load tickets and stats
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string for filters
      const params = new URLSearchParams();
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }
      if (breachedFilter) {
        params.append('breached', 'true');
      }

      // Fetch filtered tickets
      const ticketsResponse = await fetch(`${API_BASE_URL}/tickets?${params.toString()}`);
      if (!ticketsResponse.ok) {
        throw new Error('Failed to fetch tickets from server');
      }
      const ticketsData = await ticketsResponse.json();
      setTickets(ticketsData);

      // Fetch stats
      const statsResponse = await fetch(`${API_BASE_URL}/tickets/stats`);
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch ticket statistics');
      }
      const statsData = await statsResponse.json();
      setStats(statsData);

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Unable to connect to the DeskFlow backend. Please verify that the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on filter change or mount
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 60 seconds to update ticket age
    const interval = setInterval(() => {
      fetchData();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [priorityFilter, breachedFilter]);

  // Handle ticket creation
  const handleCreateTicket = async (ticketData) => {
    setFormError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket');
      }

      // Success
      setIsFormOpen(false);
      showToast('Support ticket created successfully!');
      fetchData(); // Refetch to sync board and stats
    } catch (err) {
      console.error('Create ticket error:', err);
      setFormError(err.message || 'Error communicating with server');
    }
  };

  // Handle status movements
  const handleMoveStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      showToast(`Moved ticket status to ${newStatus.replace('_', ' ')}.`);
      fetchData(); // Refetch to sync board and stats
    } catch (err) {
      console.error('Update status error:', err);
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  // Handle ticket deletion
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to permanently delete this support ticket?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete ticket');
      }

      showToast('Support ticket deleted.');
      fetchData(); // Refetch to sync board and stats
    } catch (err) {
      console.error('Delete ticket error:', err);
      showToast(err.message || 'Error deleting ticket', 'error');
    }
  };

  // Handles drag snap-back with alert notice
  const handleInvalidDrop = (errorMessage) => {
    showToast(errorMessage, 'error');
  };

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.type === 'error' ? (
            <ShieldAlert size={18} style={{ color: '#ef4444' }} />
          ) : (
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <ShieldAlert size={28} className="logo-icon" />
          <h1 className="app-title">DeskFlow</h1>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus size={18} />
          <span>New Ticket</span>
        </button>
      </header>

      {/* Stats Summary Panel */}
      <StatsStrip stats={stats} loading={loading && !stats} />

      {/* Filter and Control Bar */}
      <div className="controls-bar">
        <div className="filters-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <SlidersHorizontal size={14} />
            <span>Filters:</span>
          </div>

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              className="checkbox-custom"
              checked={breachedFilter}
              onChange={(e) => setBreachedFilter(e.target.checked)}
            />
            <span>SLA Breached Only</span>
          </label>
        </div>

        <button 
          className="action-btn"
          onClick={fetchData}
          title="Manual refresh"
          style={{ padding: '0.5rem 0.75rem', borderRadius: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'spinner' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span style={{ marginLeft: '0.25rem' }}>Refresh</span>
        </button>
      </div>

      {/* Board View */}
      {error ? (
        <div className="error-container">
          <div className="error-message-box">
            <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Connection Error</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
            <button className="btn-secondary" onClick={fetchData}>Try Again</button>
          </div>
        </div>
      ) : loading && tickets.length === 0 ? (
        <div className="loading-container">
          <div className="spinner" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading triage board...</span>
        </div>
      ) : (
        <TicketBoard
          tickets={tickets}
          onMoveStatus={handleMoveStatus}
          onDeleteTicket={handleDeleteTicket}
          onInvalidDrop={handleInvalidDrop}
        />
      )}

      {/* Slide-out Form Drawer */}
      <TicketForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitTicket={handleCreateTicket}
        error={formError}
      />
    </div>
  );
}

export default App;
