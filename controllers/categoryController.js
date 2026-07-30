import Category from '../models/Category.js';
import ErrorResponse from '../utils/errorResponse.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ order: 1, name: 1 });
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category (Admin only)
// @route   POST /api/v1/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  const { name, description } = req.body;
  try {
    if (!name) {
      return next(new ErrorResponse('Category name is required', 400));
    }

    const slug = slugify(name);
    const categoryExists = await Category.findOne({ slug });

    if (categoryExists) {
      return next(new ErrorResponse('Category already exists', 400));
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const count = await Category.countDocuments();

    const category = await Category.create({ 
      name, 
      slug, 
      description, 
      image: imageUrl,
      order: count
    });

    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category (Admin only)
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  const { name, description } = req.body;
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    
    if (name) {
      category.slug = slugify(name);
    }

    if (req.file) {
      category.image = await uploadToCloudinary(req.file.buffer);
    }

    const updatedCategory = await category.save();
    res.status(200).json({
      success: true,
      category: updatedCategory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder categories (Admin only)
// @route   PUT /api/v1/categories/reorder
// @access  Private/Admin
export const reorderCategories = async (req, res, next) => {
  const { orders } = req.body;
  try {
    if (!orders || !Array.isArray(orders)) {
      return next(new ErrorResponse('Please provide valid category orders', 400));
    }

    const bulkOps = orders.map((item, index) => {
      const categoryId = typeof item === 'string' ? item : (item.id || item._id);
      const orderVal = typeof item === 'object' && typeof item.order === 'number' ? item.order : index;
      return {
        updateOne: {
          filter: { _id: categoryId },
          update: { order: orderVal }
        }
      };
    });

    if (bulkOps.length > 0) {
      await Category.bulkWrite(bulkOps);
    }

    const categories = await Category.find({}).sort({ order: 1, name: 1 });

    res.status(200).json({
      success: true,
      message: 'Categories reordered successfully',
      categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category (Admin only)
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
