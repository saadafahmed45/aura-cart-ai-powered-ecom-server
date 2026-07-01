import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discountPrice stock images brand'
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync guest cart with user cart (on login)
// @route   POST /api/v1/cart/sync
// @access  Private
export const syncCart = async (req, res, next) => {
  const { items } = req.body;
  try {
    if (!Array.isArray(items)) {
      return next(new ErrorResponse('Items must be an array', 400));
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const item of items) {
      const existingItem = cart.items.find(i => i.product.toString() === item.product.toString());
      if (existingItem) {
        existingItem.quantity = Math.max(existingItem.quantity, item.quantity);
      } else {
        cart.items.push({ product: item.product, quantity: item.quantity });
      }
    }

    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice stock images brand'
    });

    res.status(200).json({
      success: true,
      cart: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/v1/cart
// @access  Private
export const addToCart = async (req, res, next) => {
  const { productId, quantity } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity) || 1;
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity) || 1 });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice stock images brand'
    });

    res.status(200).json({
      success: true,
      cart: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/:productId
// @access  Private
export const updateCartQuantity = async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  try {
    if (quantity <= 0) {
      return next(new ErrorResponse('Quantity must be greater than 0', 400));
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', 404));
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = Number(quantity);
      await cart.save();
    } else {
      return next(new ErrorResponse('Product not found in cart', 404));
    }

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice stock images brand'
    });

    res.status(200).json({
      success: true,
      cart: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/:productId
// @access  Private
export const removeFromCart = async (req, res, next) => {
  const { productId } = req.params;
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new ErrorResponse('Cart not found', 404));
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice stock images brand'
    });

    res.status(200).json({
      success: true,
      cart: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/v1/cart
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};
