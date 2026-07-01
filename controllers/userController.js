import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.status(200).json({
        success: true,
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status
        }
      });
    } else {
      return next(new ErrorResponse('User not found', 404));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add address
// @route   POST /api/v1/users/addresses
// @access  Private
export const addAddress = async (req, res, next) => {
  const { street, city, state, zip, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({ street, city, state, zip, country, isDefault: isDefault || user.addresses.length === 0 });
    await user.save();

    res.status(200).json({
      success: true,
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update address
// @route   PUT /api/v1/users/addresses/:addressId
// @access  Private
export const updateAddress = async (req, res, next) => {
  const { addressId } = req.params;
  const { street, city, state, zip, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);

    if (!address) {
      return next(new ErrorResponse('Address not found', 404));
    }

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zip = zip || address.zip;
    address.country = country || address.country;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();
    res.status(200).json({
      success: true,
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/v1/users/addresses/:addressId
// @access  Private
export const deleteAddress = async (req, res, next) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.user._id);
    
    user.addresses.pull(addressId);

    const defaultExists = user.addresses.some(addr => addr.isDefault);
    if (!defaultExists && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({
      success: true,
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wishlist
// @route   GET /api/v1/users/wishlist
// @access  Private
export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.status(200).json({
      success: true,
      wishlist: user.wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add/Remove product to wishlist (Toggle)
// @route   POST /api/v1/users/wishlist/:productId
// @access  Private
export const toggleWishlist = async (req, res, next) => {
  const { productId } = req.params;
  try {
    const user = await User.findById(req.user._id);
    
    const index = user.wishlist.indexOf(productId);
    if (index !== -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    
    // Fetch populated wishlist to return it
    const updatedUser = await User.findById(req.user._id).populate('wishlist');

    res.status(200).json({
      success: true,
      wishlist: updatedUser.wishlist,
      message: index !== -1 ? 'Product removed from wishlist' : 'Product added to wishlist'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN DASHBOARD CONTROLLERS
// ==========================================

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } }
          ]
        }
      : {};

    const count = await User.countDocuments(searchQuery);
    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
      page,
      pages: Math.ceil(count / limit),
      total: count
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details/role/status (Admin only)
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    user.role = req.body.role || user.role;
    user.status = req.body.status || user.status;

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;

    await user.save();

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (user.role === 'admin' && req.user._id.toString() === user._id.toString()) {
      return next(new ErrorResponse('You cannot delete your own admin account', 400));
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
