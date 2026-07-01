import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrderStatus,
  getAnalyticsStats
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/myorders', getMyOrders);

router.get('/analytics/stats', admin, getAnalyticsStats);

router.get('/:id', getOrderById);

// Admin only routes
router.get('/', admin, getOrders);
router.put('/:id/status', admin, updateOrderStatus);

export default router;
