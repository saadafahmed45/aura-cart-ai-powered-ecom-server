import HeroSlide from '../models/HeroSlide.js';
import ErrorResponse from '../utils/errorResponse.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Get active hero slides (public)
// @route   GET /api/v1/hero-slides
// @access  Public
export const getHeroSlides = async (req, res, next) => {
  try {
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, slides });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all hero slides (admin)
// @route   GET /api/v1/hero-slides/all
// @access  Private/Admin
export const getAllHeroSlides = async (req, res, next) => {
  try {
    const slides = await HeroSlide.find().sort({ order: 1 });
    res.status(200).json({ success: true, slides });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a hero slide
// @route   POST /api/v1/hero-slides
// @access  Private/Admin
export const createHeroSlide = async (req, res, next) => {
  try {
    const { title, description, buttonText, buttonLink, order, isActive } = req.body;

    if (!req.file) {
      return next(new ErrorResponse('Please upload an image for the slide', 400));
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer);

    const slide = await HeroSlide.create({
      image: imageUrl,
      title,
      description,
      buttonText,
      buttonLink,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, slide });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a hero slide
// @route   PUT /api/v1/hero-slides/:id
// @access  Private/Admin
export const updateHeroSlide = async (req, res, next) => {
  try {
    let slide = await HeroSlide.findById(req.params.id);

    if (!slide) {
      return next(new ErrorResponse('Hero slide not found', 404));
    }

    const { title, description, buttonText, buttonLink, order, isActive } = req.body;

    // If a new image is uploaded, upload to cloudinary and delete old one
    if (req.file) {
      // Delete old image from Cloudinary
      if (slide.image && slide.image.includes('cloudinary')) {
        const publicId = slide.image.split('/').slice(-2).join('/').split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.log('Failed to delete old image from Cloudinary:', err.message);
        }
      }

      slide.image = await uploadToCloudinary(req.file.buffer);
    }

    if (title !== undefined) slide.title = title;
    if (description !== undefined) slide.description = description;
    if (buttonText !== undefined) slide.buttonText = buttonText;
    if (buttonLink !== undefined) slide.buttonLink = buttonLink;
    if (order !== undefined) slide.order = order;
    if (isActive !== undefined) slide.isActive = isActive;

    await slide.save();

    res.status(200).json({ success: true, slide });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a hero slide
// @route   DELETE /api/v1/hero-slides/:id
// @access  Private/Admin
export const deleteHeroSlide = async (req, res, next) => {
  try {
    const slide = await HeroSlide.findById(req.params.id);

    if (!slide) {
      return next(new ErrorResponse('Hero slide not found', 404));
    }

    // Delete image from Cloudinary
    if (slide.image && slide.image.includes('cloudinary')) {
      const publicId = slide.image.split('/').slice(-2).join('/').split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log('Failed to delete image from Cloudinary:', err.message);
      }
    }

    await slide.deleteOne();

    res.status(200).json({ success: true, message: 'Hero slide deleted successfully' });
  } catch (error) {
    next(error);
  }
};
