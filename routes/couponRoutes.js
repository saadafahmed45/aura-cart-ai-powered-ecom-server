import express from 'express';
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/validate', validateCoupon);

router.route('/')
  .get(admin, getCoupons)
  .post(admin, createCoupon);

router.route('/:id')
  .put(admin, updateCoupon)
  .delete(admin, deleteCoupon);

export default router;
