import express from 'express';
import {
  getProductReviews,
  createProductReview,
  getReviews,
  approveReview,
  deleteReview
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getReviews);

router.route('/:id')
  .delete(protect, deleteReview);

router.route('/:id/approve')
  .put(protect, admin, approveReview);

router.route('/product/:productId')
  .get(getProductReviews)
  .post(protect, createProductReview);

export default router;
