import express from 'express';
import multer from 'multer';
import {
  listAdminEvents,
  getAdminEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  closeEvent,
  uploadEventImage
} from '../controller/adminEventController.js';
import {authMiddleware} from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/admin/events
router.get('/', listAdminEvents);

// POST /api/admin/events/image (upload without eventId)
router.post('/image', upload.single('image'), uploadEventImage);

// GET /api/admin/events/:id
router.get('/:id', getAdminEventById);

// POST /api/admin/events/:id/image
router.post('/:id/image', upload.single('image'), (req, _res, next) => {
  req.body.eventId = req.params.id;
  next();
}, uploadEventImage);

// POST /api/admin/events
router.post('/',authMiddleware, createEvent);

// PUT /api/admin/events/:id
router.put('/:id',authMiddleware, updateEvent);

// DELETE /api/admin/events/:id
router.delete('/:id', authMiddleware, deleteEvent);

// POST /api/admin/events/:id/publish
router.post('/:id/publish',authMiddleware, publishEvent);

// POST /api/admin/events/:id/close
router.post('/:id/close',authMiddleware, closeEvent);

export default router;
