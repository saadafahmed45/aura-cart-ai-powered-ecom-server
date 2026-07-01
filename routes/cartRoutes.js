import express from 'express';
import {
  getCart,
  syncCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.post('/sync', syncCart);

router.route('/:productId')
  .put(updateCartQuantity)
  .delete(removeFromCart);

export default router;
