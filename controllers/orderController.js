import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import Cart from '../models/Cart.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  const { orderItems, shippingAddress, couponCode } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return next(new ErrorResponse('No order items provided', 400));
    }

    if (!shippingAddress) {
      return next(new ErrorResponse('Please provide shipping address', 400));
    }

    let subtotal = 0;
    const finalOrderItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(new ErrorResponse(`Product not found: ${item.product}`, 404));
      }

      if (product.stock < item.quantity) {
        return next(new ErrorResponse(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400));
      }

      const price = product.discountPrice > 0 ? product.discountPrice : product.price;
      subtotal += price * item.quantity;

      finalOrderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price,
        image: product.images[0] || ''
      });

      product.stock -= item.quantity;
      await product.save();
    }

    let discountAmount = 0;
    let couponAppliedId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && coupon.expiryDate > new Date()) {
        couponAppliedId = coupon._id;
        if (coupon.discountType === 'percentage') {
          discountAmount = (subtotal * coupon.amount) / 100;
        } else if (coupon.discountType === 'fixed') {
          discountAmount = coupon.amount;
        }
        discountAmount = Math.min(discountAmount, subtotal);
      }
    }

    const taxPrice = Math.round((subtotal - discountAmount) * 0.1 * 100) / 100;
    const shippingPrice = (subtotal - discountAmount) > 100 ? 0 : 10;
    const totalPrice = Math.round((subtotal - discountAmount + taxPrice + shippingPrice) * 100) / 100;

    const order = await Order.create({
      user: req.user._id,
      orderItems: finalOrderItems,
      shippingAddress,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      shippingPrice,
      taxPrice,
      totalPrice,
      couponApplied: couponAppliedId,
      discountAmount
    });

    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/v1/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      orders,
      page,
      pages: Math.ceil(count / limit),
      total: count
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/v1/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('couponApplied', 'code amount discountType');

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to view this order', 401));
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN DASHBOARD CONTROLLERS
// ==========================================

// @desc    Get all orders (Admin only)
// @route   GET /api/v1/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      orders,
      page,
      pages: Math.ceil(count / limit),
      total: count
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order and/or payment status (Admin only)
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  const { orderStatus, paymentStatus } = req.body;
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === 'Delivered') {
        order.deliveredAt = Date.now();
        order.paymentStatus = 'Paid';
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Dashboard Analytics (Admin only)
// @route   GET /api/v1/orders/analytics/stats
// @access  Private/Admin
export const getAnalyticsStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();

    const revenueAgg = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'Paid' },
            { orderStatus: 'Delivered' }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          orderStatus: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySales = monthlySalesAgg.map(item => ({
      name: `${months[item._id.month - 1]} ${item._id.year}`,
      sales: Math.round(item.sales * 100) / 100,
      orders: item.orders
    }));

    const categoryDistributionAgg = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          value: { $sum: 1 }
        }
      }
    ]);
    
    const categoryDistribution = [];
    for (const item of categoryDistributionAgg) {
      if (item._id) {
        const cat = await Category.findById(item._id);
        categoryDistribution.push({
          name: cat ? cat.name : 'Unknown',
          value: item.value
        });
      }
    }

    const orderStatusesAgg = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    const statusDistribution = orderStatusesAgg.map(item => ({
      status: item._id,
      count: item.count
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalUsers,
        totalProducts
      },
      monthlySales,
      categoryDistribution,
      statusDistribution
    });
  } catch (error) {
    next(error);
  }
};
