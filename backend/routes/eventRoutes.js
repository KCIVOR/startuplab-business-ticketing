import express from 'express';
import { listEvents, getEventBySlug } from '../controller/eventController.js';

const router = express.Router();

// GET /api/events
router.get('/', listEvents);

// GET /api/events/:slug
router.get('/:slug', getEventBySlug);

export default router;
