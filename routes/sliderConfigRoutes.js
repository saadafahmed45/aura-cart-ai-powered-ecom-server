import express from 'express';
import {
  getSliderConfig,
  updateSliderConfig
} from '../controllers/sliderConfigController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getSliderConfig)
  .put(protect, admin, updateSliderConfig);

export default router;
