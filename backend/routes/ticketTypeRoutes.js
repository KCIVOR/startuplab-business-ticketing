import express from 'express';
import {
  listTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType
} from '../controller/ticketTypeController.js';
import {authMiddleware} from '../middleware/auth.js';


const router = express.Router();

// GET /api/ticket-types?eventId=...
router.get('/', listTicketTypes);

// POST /api/ticket-types
router.post('/', authMiddleware, createTicketType);

// PUT /api/ticket-types/:id
router.put('/:id', authMiddleware, updateTicketType);

// DELETE /api/ticket-types/:id
router.delete('/:id', authMiddleware, deleteTicketType);

export default router;
