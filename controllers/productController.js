import Product from '../models/Product.js';
import Category from '../models/Category.js';
import ErrorResponse from '../utils/errorResponse.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';
import mongoose from 'mongoose';

// Slug generator helper
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
};

// @desc    Get all products (with search, filter, sort, paginate)
// @route   GET /api/v1/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = {};

    // 1. Search (Name, Brand, SKU)
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
        { 'variants.sku': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // 2. Category
    if (req.query.category) {
      const isObjectId = mongoose.isValidObjectId(req.query.category);
      const categoryObj = await Category.findOne({
        $or: [
          { slug: req.query.category },
          { name: req.query.category },
          ...(isObjectId ? [{ _id: req.query.category }] : [])
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
          total: 0,
          brands: []
        });
      }
    }

    // 3. Brand
    if (req.query.brand) {
      query.brand = { $regex: req.query.brand, $options: 'i' };
    }

    // 4. Status (Dashboard sees all, public shop sees only active)
    if (req.query.dashboard === 'true') {
      if (req.query.status) {
        query.status = req.query.status;
      }
    } else {
      query.status = 'active';
    }

    // 5. Featured / Best Seller / New Arrival
    if (req.query.featured) {
      query.featured = req.query.featured === 'true';
    }
    if (req.query.bestSeller) {
      query.bestSeller = req.query.bestSeller === 'true';
    }
    if (req.query.newArrival) {
      query.newArrival = req.query.newArrival === 'true';
    }

    // 6. Price range (based on denormalized lowestPrice)
    if (req.query.minPrice || req.query.maxPrice) {
      query.lowestPrice = {};
      if (req.query.minPrice) {
        query.lowestPrice.$gte = Number(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.lowestPrice.$lte = Number(req.query.maxPrice);
      }
    }

    // 7. Rating
    if (req.query.rating) {
      query.ratings = { $gte: Number(req.query.rating) };
    }

    // Sort order (based on denormalized lowestPrice)
    let sort = { createdAt: -1 };
    if (req.query.sort) {
      if (req.query.sort === 'priceAsc') {
        sort = { lowestPrice: 1 };
      } else if (req.query.sort === 'priceDesc') {
        sort = { lowestPrice: -1 };
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

    const brands = await Product.distinct('brand', { status: 'active' });

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
      status: 'active',
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
    const { 
      name, 
      brand, 
      category, 
      shortDescription, 
      fullDescription,
      status,
      featured,
      bestSeller,
      newArrival
    } = req.body;

    if (!name || !fullDescription || !category || !brand) {
      return next(new ErrorResponse('Please provide all required basic fields', 400));
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new ErrorResponse('Invalid category ID', 400));
    }

    // Image Uploads
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        imageUrls.push(url);
      }
    }

    // Parsing nested properties sent as JSON strings
    let variants = [];
    if (req.body.variants) {
      variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
    }

    let fragrance = {};
    if (req.body.fragrance) {
      fragrance = typeof req.body.fragrance === 'string' ? JSON.parse(req.body.fragrance) : req.body.fragrance;
    }

    let performance = {};
    if (req.body.performance) {
      performance = typeof req.body.performance === 'string' ? JSON.parse(req.body.performance) : req.body.performance;
    }

    const slug = slugify(name) + '-' + Math.random().toString(36).substring(2, 6);

    const product = await Product.create({
      name,
      slug,
      brand,
      category,
      shortDescription,
      fullDescription,
      images: imageUrls,
      status: status || 'active',
      featured: featured === 'true' || featured === true,
      bestSeller: bestSeller === 'true' || bestSeller === true,
      newArrival: newArrival === 'true' || newArrival === true,
      variants,
      fragrance,
      performance
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

    const { 
      name, 
      brand, 
      category, 
      shortDescription, 
      fullDescription,
      status,
      featured,
      bestSeller,
      newArrival,
      keepImages 
    } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return next(new ErrorResponse('Invalid category ID', 400));
      }
      product.category = category;
    }

    if (name) {
      product.name = name;
      // update slug optionally or keep original. Let's keep original unless explicitly changed
    }
    
    product.brand = brand || product.brand;
    product.shortDescription = shortDescription !== undefined ? shortDescription : product.shortDescription;
    product.fullDescription = fullDescription || product.fullDescription;
    product.status = status || product.status;
    
    product.featured = featured === 'true' || featured === true;
    product.bestSeller = bestSeller === 'true' || bestSeller === true;
    product.newArrival = newArrival === 'true' || newArrival === true;

    // Parsing nested properties
    if (req.body.variants) {
      product.variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
    }

    if (req.body.fragrance) {
      product.fragrance = typeof req.body.fragrance === 'string' ? JSON.parse(req.body.fragrance) : req.body.fragrance;
    }

    if (req.body.performance) {
      product.performance = typeof req.body.performance === 'string' ? JSON.parse(req.body.performance) : req.body.performance;
    }

    // Images logic
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

    if (updatedImages.length > 0 || (req.files && req.files.length > 0) || keepImages !== undefined) {
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
