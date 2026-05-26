const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Helper to get priority SLA target in minutes
const getSlaTargetMinutes = (priority) => {
  switch (priority) {
    case 'urgent': return 60;      // 1 hour
    case 'high': return 240;       // 4 hours
    case 'medium': return 1440;    // 24 hours
    case 'low': return 4320;       // 72 hours
    default: return Infinity;
  }
};

// Helper to compute derived fields on a ticket document
const computeDerivedFields = (ticket) => {
  const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
  const createdAt = new Date(ticketObj.createdAt).getTime();
  const now = Date.now();
  
  let ageMinutes = 0;
  if (ticketObj.status === 'resolved' || ticketObj.status === 'closed') {
    // For resolved/closed tickets, age stops growing at resolvedAt
    const resolvedAt = ticketObj.resolvedAt ? new Date(ticketObj.resolvedAt).getTime() : createdAt;
    ageMinutes = Math.max(0, Math.floor((resolvedAt - createdAt) / 60000));
  } else {
    // For open/in_progress, age grows until now
    ageMinutes = Math.max(0, Math.floor((now - createdAt) / 60000));
  }

  const target = getSlaTargetMinutes(ticketObj.priority);
  const slaBreached = ageMinutes > target;

  return {
    ...ticketObj,
    ageMinutes,
    slaBreached
  };
};

// Status indices for transition verification
const STATUS_INDEX = {
  'open': 0,
  'in_progress': 1,
  'resolved': 2,
  'closed': 3
};

// @route   POST /tickets
// @desc    Create a new support ticket
router.post('/', async (req, res) => {
  try {
    const { subject, description, customerEmail, priority } = req.body;
    
    // Explicit validation before save to ensure clean 400 responses
    if (!subject) return res.status(400).json({ message: 'Subject is required' });
    if (!description) return res.status(400).json({ message: 'Description is required' });
    if (!customerEmail) return res.status(400).json({ message: 'Customer email is required' });
    if (!priority) return res.status(400).json({ message: 'Priority is required' });

    const allowedPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: `Priority must be one of: ${allowedPriorities.join(', ')}` });
    }

    const ticket = new Ticket({
      subject,
      description,
      customerEmail,
      priority
    });

    await ticket.save();
    
    // Return the ticket with derived fields computed
    res.status(201).json(computeDerivedFields(ticket));
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Server error creating ticket' });
  }
});

// @route   GET /tickets
// @desc    List tickets with status, priority, and slaBreached filters
router.get('/', async (req, res) => {
  try {
    const { status, priority, breached } = req.query;
    
    // Build query for direct DB fields
    const query = {};
    if (status) {
      if (!STATUS_INDEX.hasOwnProperty(status)) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      query.status = status;
    }
    if (priority) {
      const allowedPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority filter' });
      }
      query.priority = priority;
    }

    // Fetch tickets matching primary filters
    const tickets = await Ticket.find(query).sort({ createdAt: -1 });

    // Compute derived fields for each ticket
    let enrichedTickets = tickets.map(ticket => computeDerivedFields(ticket));

    // Apply client-side filtering for derived 'slaBreached' if requested
    if (breached !== undefined) {
      const isBreachedFilter = breached === 'true';
      enrichedTickets = enrichedTickets.filter(ticket => ticket.slaBreached === isBreachedFilter);
    }

    res.json(enrichedTickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Server error listing tickets' });
  }
});

// @route   GET /tickets/stats
// @desc    Get aggregate ticket counts and breached count
router.get('/stats', async (req, res) => {
  try {
    const tickets = await Ticket.find({});
    
    const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    let openSlaBreachedCount = 0;

    tickets.forEach(ticket => {
      const enriched = computeDerivedFields(ticket);
      
      // Group by status
      if (statusCounts.hasOwnProperty(enriched.status)) {
        statusCounts[enriched.status]++;
      }
      
      // Group by priority
      if (priorityCounts.hasOwnProperty(enriched.priority)) {
        priorityCounts[enriched.priority]++;
      }

      // Count open SLA breached (unresolved means status is 'open' or 'in_progress')
      if ((enriched.status === 'open' || enriched.status === 'in_progress') && enriched.slaBreached) {
        openSlaBreachedCount++;
      }
    });

    res.json({
      statusCounts,
      priorityCounts,
      openSlaBreachedCount
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({ message: 'Server error getting ticket statistics' });
  }
});

// @route   PATCH /tickets/:id
// @desc    Update a ticket (specifically its status and resolvedAt time)
router.patch('/:id', async (req, res) => {
  try {
    const { status, priority, subject, description, customerEmail } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // 1. Verify Status Transition if new status is supplied
    if (status) {
      if (!STATUS_INDEX.hasOwnProperty(status)) {
        return res.status(400).json({ message: `Invalid status: ${status}` });
      }

      const oldStatus = ticket.status;
      const newStatus = status;
      
      const oldIndex = STATUS_INDEX[oldStatus];
      const newIndex = STATUS_INDEX[newStatus];
      const diff = newIndex - oldIndex;

      // Status transition rules:
      // Can move forward exactly 1 step (diff === 1)
      // Can move backward exactly 1 step (diff === -1)
      // No-op is allowed (diff === 0)
      // All other transitions (skipping forward, jumping back > 1) are banned.
      if (Math.abs(diff) > 1) {
        return res.status(400).json({
          message: `Invalid status transition from "${oldStatus}" to "${newStatus}". You can only move forward 1 step or backward 1 step (e.g. open ⇄ in_progress ⇄ resolved ⇄ closed).`
        });
      }

      // Handle resolvedAt logic:
      if (newStatus === 'resolved') {
        // Moving to resolved: set resolution time
        ticket.resolvedAt = new Date();
      } else if (oldStatus === 'resolved' && (newStatus === 'in_progress' || newStatus === 'open')) {
        // Moving backward from resolved: clear resolution time
        ticket.resolvedAt = undefined;
      }
      
      ticket.status = newStatus;
    }

    // 2. Allow updating other details if provided (for flexibility)
    if (priority) {
      const allowedPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority value' });
      }
      ticket.priority = priority;
    }
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (customerEmail) {
      const validator = require('validator');
      if (!validator.isEmail(customerEmail)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }
      ticket.customerEmail = customerEmail;
    }

    await ticket.save();
    res.json(computeDerivedFields(ticket));
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Server error updating ticket' });
  }
});

// @route   DELETE /tickets/:id
// @desc    Delete a support ticket
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.deleteOne();
    res.json({ message: 'Ticket successfully deleted' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Server error deleting ticket' });
  }
});

module.exports = router;
