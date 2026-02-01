// orderRoutes.js
import express from 'express';
import { createOrder, getOrderById } from '../controller/orderController.js';

const router = express.Router();

// POST /api/orders
router.post('/orders', createOrder);
// GET /api/orders/:orderId
router.get('/orders/:orderId', getOrderById);

export default router;
