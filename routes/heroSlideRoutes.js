import express from 'express';
import {
  getHeroSlides,
  getAllHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide
} from '../controllers/heroSlideController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getHeroSlides)
  .post(protect, admin, upload.single('image'), createHeroSlide);

router.route('/all')
  .get(protect, admin, getAllHeroSlides);

router.route('/:id')
  .put(protect, admin, upload.single('image'), updateHeroSlide)
  .delete(protect, admin, deleteHeroSlide);

export default router;
