import Coupon from '../models/Coupon.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Validate coupon code
// @route   POST /api/v1/coupons/validate
// @access  Private
export const validateCoupon = async (req, res, next) => {
  const { code } = req.body;
  try {
    if (!code) {
      return next(new ErrorResponse('Please provide coupon code', 400));
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return next(new ErrorResponse('Invalid coupon code', 404));
    }

    if (!coupon.isActive) {
      return next(new ErrorResponse('Coupon is inactive', 400));
    }

    if (coupon.expiryDate < new Date()) {
      return next(new ErrorResponse('Coupon has expired', 400));
    }

    res.status(200).json({
      success: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        amount: coupon.amount
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN DASHBOARD CONTROLLERS
// ==========================================

// @desc    Get all coupons (Admin only)
// @route   GET /api/v1/coupons
// @access  Private/Admin
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon (Admin only)
// @route   POST /api/v1/coupons
// @access  Private/Admin
export const createCoupon = async (req, res, next) => {
  const { code, discountType, amount, expiryDate, isActive } = req.body;
  try {
    if (!code || !discountType || !amount || !expiryDate) {
      return next(new ErrorResponse('Please provide all coupon fields', 400));
    }

    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return next(new ErrorResponse('Coupon code already exists', 400));
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      amount: Number(amount),
      expiryDate: new Date(expiryDate),
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon (Admin only)
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res, next) => {
  const { code, discountType, amount, expiryDate, isActive } = req.body;
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return next(new ErrorResponse('Coupon not found', 404));
    }

    coupon.code = code ? code.toUpperCase() : coupon.code;
    coupon.discountType = discountType || coupon.discountType;
    coupon.amount = amount !== undefined ? Number(amount) : coupon.amount;
    coupon.expiryDate = expiryDate ? new Date(expiryDate) : coupon.expiryDate;
    coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;

    await coupon.save();

    res.status(200).json({
      success: true,
      coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (Admin only)
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return next(new ErrorResponse('Coupon not found', 404));
    }

    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
