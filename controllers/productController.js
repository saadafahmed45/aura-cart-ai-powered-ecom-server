import Product from '../models/Product.js';
import Category from '../models/Category.js';
import ErrorResponse from '../utils/errorResponse.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';

// @desc    Get all products (with search, filter, sort, paginate)
// @route   GET /api/v1/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = {};

    // 1. Search
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // 2. Category
    if (req.query.category) {
      const categoryObj = await Category.findOne({
        $or: [
          { slug: req.query.category },
          { name: req.query.category }
        ]
      });
      if (categoryObj) {
        query.category = categoryObj._id;
      } else {
        return res.status(200).json({
          success: true,
          products: [],
          page: 1,
          pages: 0,
          total: 0
        });
      }
    }

    // 3. Brand
    if (req.query.brand) {
      query.brand = { $regex: req.query.brand, $options: 'i' };
    }

    // 4. Price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = Number(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = Number(req.query.maxPrice);
      }
    }

    // 5. Rating
    if (req.query.rating) {
      query.ratings = { $gte: Number(req.query.rating) };
    }

    // Sort order
    let sort = { createdAt: -1 };
    if (req.query.sort) {
      if (req.query.sort === 'priceAsc') {
        sort = { price: 1 };
      } else if (req.query.sort === 'priceDesc') {
        sort = { price: -1 };
      } else if (req.query.sort === 'rating') {
        sort = { ratings: -1 };
      } else if (req.query.sort === 'popular') {
        sort = { numReviews: -1 };
      }
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const brands = await Product.distinct('brand');

    res.status(200).json({
      success: true,
      products,
      page,
      pages: Math.ceil(count / limit),
      total: count,
      brands
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details
// @route   GET /api/v1/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');

    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related products (same category)
// @route   GET /api/v1/products/:id/related
// @access  Public
export const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    })
      .limit(4)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      products: related
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product (Admin only)
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, discountPrice, category, brand, stock } = req.body;

    if (!name || !description || !price || !category || !brand) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new ErrorResponse('Invalid category ID', 400));
    }

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        imageUrls.push(url);
      }
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      category,
      brand,
      stock: Number(stock) || 0,
      images: imageUrls
    });

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Admin only)
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    const { name, description, price, discountPrice, category, brand, stock, keepImages } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return next(new ErrorResponse('Invalid category ID', 400));
      }
      product.category = category;
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.discountPrice = discountPrice !== undefined ? Number(discountPrice) : product.discountPrice;
    product.brand = brand || product.brand;
    product.stock = stock !== undefined ? Number(stock) : product.stock;

    let updatedImages = [];
    if (keepImages) {
      const parsedKeep = typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages;
      updatedImages = Array.isArray(parsedKeep) ? parsedKeep : [parsedKeep];
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        updatedImages.push(url);
      }
    }

    if (updatedImages.length > 0 || (req.files && req.files.length > 0)) {
      product.images = updatedImages;
    }

    await product.save();

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin only)
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
