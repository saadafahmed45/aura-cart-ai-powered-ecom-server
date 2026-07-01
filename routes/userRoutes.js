import express from 'express';
import {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  toggleWishlist,
  getUsers,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User specific routes
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.route('/addresses')
  .post(protect, addAddress);

router.route('/addresses/:addressId')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.route('/wishlist')
  .get(protect, getWishlist);

router.route('/wishlist/:productId')
  .post(protect, toggleWishlist);

// Admin routes
router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id')
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

export default router;
