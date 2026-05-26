import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

const TicketForm = ({ isOpen, onClose, onSubmitTicket, error }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    customerEmail: '',
    priority: 'low'
  });

  const [formErrors, setFormErrors] = useState({});

  // Reset form when opened/closed
  useEffect(() => {
    if (isOpen) {
      setFormData({
        subject: '',
        description: '',
        customerEmail: '',
        priority: 'low'
      });
      setFormErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Customer email is required';
    } else if (!emailRegex.test(formData.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmitTicket(formData);
  };

  // Close when clicking outside on the backdrop
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('drawer-backdrop')) {
      onClose();
    }
  };

  return (
    <div 
      className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className="drawer-content">
        <div className="drawer-header">
          <h2 className="drawer-title">Create New Support Ticket</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>

        <form className="ticket-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="customerEmail">Customer Email *</label>
            <input
              type="text"
              id="customerEmail"
              name="customerEmail"
              className="form-input"
              placeholder="e.g. customer@example.com"
              value={formData.customerEmail}
              onChange={handleChange}
            />
            {formErrors.customerEmail && (
              <span className="form-error">
                <AlertCircle size={12} />
                <span>{formErrors.customerEmail}</span>
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="subject">Subject *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="form-input"
              placeholder="Brief summary of the issue"
              value={formData.subject}
              onChange={handleChange}
            />
            {formErrors.subject && (
              <span className="form-error">
                <AlertCircle size={12} />
                <span>{formErrors.subject}</span>
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              placeholder="Please provide full details of the issue..."
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />
            {formErrors.description && (
              <span className="form-error">
                <AlertCircle size={12} />
                <span>{formErrors.description}</span>
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="priority">Priority *</label>
            <select
              id="priority"
              name="priority"
              className="form-select"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="low">Low (72-hour SLA)</option>
              <option value="medium">Medium (24-hour SLA)</option>
              <option value="high">High (4-hour SLA)</option>
              <option value="urgent">Urgent (1-hour SLA)</option>
            </select>
          </div>
        </form>

        <div className="form-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary drawer-submit-btn"
            onClick={handleSubmit}
          >
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketForm;
