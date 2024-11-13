const express = require('express');
const { createTicket, assignUserToTicket, getTicketDetails, getTicketAnalytics } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/tickets', protect, createTicket);
router.post('/tickets/:ticketId/assign', protect, assignUserToTicket);
router.get('/tickets/analytics', protect, getTicketAnalytics);
router.get('/tickets/:ticketId', protect, getTicketDetails);

module.exports = router;
