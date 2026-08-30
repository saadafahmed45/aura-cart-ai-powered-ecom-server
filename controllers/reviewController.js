import Review from '../models/Review.js';
import Product from '../models/Product.js';
import ErrorResponse from '../utils/errorResponse.js';
import mongoose from 'mongoose';

// @desc    Get reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    let targetProductId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(targetProductId)) {
      const prod = await Product.findOne({ slug: targetProductId });
      if (prod) targetProductId = prod._id;
    }

    const reviews = await Review.find({ product: targetProductId, isApproved: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update product review
// @route   POST /api/v1/reviews/product/:productId
// @access  Private
export const createProductReview = async (req, res, next) => {
  const { rating, comment } = req.body;
  let productId = req.params.productId;

  try {
    if (!rating || !comment) {
      return next(new ErrorResponse('Please provide rating and comment', 400));
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne({ slug: productId });
      if (prod) productId = prod._id.toString();
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id
    });

    if (alreadyReviewed) {
      alreadyReviewed.rating = Number(rating);
      alreadyReviewed.comment = comment;
      await alreadyReviewed.save();

      await Review.calculateAverageRating(productId);

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        review: alreadyReviewed
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN DASHBOARD CONTROLLERS
// ==========================================

// @desc    Get all reviews (Admin only)
// @route   GET /api/v1/reviews
// @access  Private/Admin
export const getReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.comment = { $regex: req.query.search, $options: 'i' };
    }

    const count = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      reviews,
      page,
      pages: Math.ceil(count / limit),
      total: count
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Disapprove review (Admin only)
// @route   PUT /api/v1/reviews/:id/approve
// @access  Private/Admin
export const approveReview = async (req, res, next) => {
  const { isApproved } = req.body;
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    review.isApproved = isApproved !== undefined ? isApproved : review.isApproved;
    await review.save();

    await Review.calculateAverageRating(review.product);

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private (User owns or Admin)
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this review', 401));
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    await Review.calculateAverageRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
