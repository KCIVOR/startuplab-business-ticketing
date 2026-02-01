import express from 'express';
import { getSummary, getRecentTransactions } from '../controller/analyticsController.js';
import {authMiddleware} from '../middleware/auth.js';
const router = express.Router();

router.get('/analytics/summary',authMiddleware, getSummary);
router.get('/analytics/transactions', authMiddleware, getRecentTransactions);

export default router;
