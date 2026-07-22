import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true }, // e.g. "30ml", "50ml", "100ml"
  price: { type: Number, required: true },
  salePrice: { type: Number, default: 0 },
  sku: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  image: { type: String }, // Optional variant specific image
  active: { type: Boolean, default: true }
});

const fragranceSchema = new mongoose.Schema({
  fragranceFamily: { type: String },
  topNotes: [{ type: String }],
  middleNotes: [{ type: String }],
  baseNotes: [{ type: String }],
  concentration: { type: String, enum: ['EDP', 'EDT', 'Parfum', 'Cologne', 'Eau Fraiche', 'Other'], default: 'EDP' },
  gender: { type: String, enum: ['Men', 'Women', 'Unisex'], default: 'Unisex' },
  season: [{ type: String }], // e.g. Summer, Winter, Spring, Autumn, All Season
  occasion: [{ type: String }] // e.g. Daily, Office, Party, Wedding, Date Night
});

const performanceSchema = new mongoose.Schema({
  longevity: { type: Number, min: 0, max: 100, default: 80 },
  projection: { type: Number, min: 0, max: 100, default: 80 }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  shortDescription: { type: String },
  fullDescription: { type: String, required: true },
  images: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
  featured: { type: Boolean, default: false },
  bestSeller: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },

  variants: [variantSchema],
  fragrance: fragranceSchema,
  performance: performanceSchema,

  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },

  // Denormalized fields for quick querying
  lowestPrice: { type: Number, default: 0 },
  highestPrice: { type: Number, default: 0 },
  totalStock: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Pre-save hook to calculate lowest/highest price and sum of stock
productSchema.pre('save', function(next) {
  if (this.variants && this.variants.length > 0) {
    const activeVariants = this.variants.filter(v => v.active);
    const variantsToUse = activeVariants.length > 0 ? activeVariants : this.variants;

    const prices = [];
    let stockSum = 0;

    variantsToUse.forEach(v => {
      const p = v.salePrice > 0 && v.salePrice < v.price ? v.salePrice : v.price;
      prices.push(p);
      stockSum += v.stock;
    });

    this.lowestPrice = Math.min(...prices);
    this.highestPrice = Math.max(...prices);
    this.totalStock = stockSum;
  } else {
    this.lowestPrice = 0;
    this.highestPrice = 0;
    this.totalStock = 0;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
