import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

dotenv.config();

const usersData = [
  {
    name: 'Admin User',
    email: 'admin@ecommerce.com',
    password: 'Password123!',
    role: 'admin',
    status: 'active'
  },
  {
    name: 'Jane Doe',
    email: 'user@ecommerce.com',
    password: 'Password123!',
    role: 'user',
    status: 'active',
    addresses: [
      {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
        isDefault: true
      }
    ]
  }
];

const categoriesData = [
  { name: 'Inspired Perfumes', slug: 'inspired-perfumes', description: 'Fragrances inspired by world-famous iconic scent profiles.' },
  { name: 'Custom Perfumes', slug: 'custom-perfumes', description: 'Design your own signature fragrance, mixed precisely by our master perfumers.' },
  { name: 'Gift Sets', slug: 'gift-sets', description: 'Luxurious custom-curated fragrance gifts for special occasions.' },
  { name: 'Perfume Samples', slug: 'perfume-samples', description: 'Vials of our famous scents to sample in the comfort of your home.' },
  { name: 'Luxury Collections', slug: 'luxury-collections', description: 'Limited-run signature compositions of highest purity and rare materials.' }
];

const couponsData = [
  {
    code: 'WELCOME10',
    discountType: 'percentage',
    amount: 10,
    expiryDate: new Date('2027-12-31'),
    isActive: true
  },
  {
    code: 'SAVE20',
    discountType: 'fixed',
    amount: 20,
    expiryDate: new Date('2027-12-31'),
    isActive: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear DB
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Coupon.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();

    console.log('Database cleared.');

    // Seed Users
    const createdUsers = await User.create(usersData);
    console.log(`Seeded ${createdUsers.length} users.`);

    // Seed Categories
    const createdCategories = await Category.create(categoriesData);
    console.log(`Seeded ${createdCategories.length} categories.`);

    const inspiredId = createdCategories.find(c => c.slug === 'inspired-perfumes')._id;
    const customId = createdCategories.find(c => c.slug === 'custom-perfumes')._id;
    const giftId = createdCategories.find(c => c.slug === 'gift-sets')._id;
    const sampleId = createdCategories.find(c => c.slug === 'perfume-samples')._id;
    const luxuryId = createdCategories.find(c => c.slug === 'luxury-collections')._id;

    // Seed Products
    const productsData = [
      {
        name: 'No. 33 Santal Aura',
        slug: 'no-33-santal-aura',
        brand: 'Inspired by Le Labo',
        category: inspiredId,
        shortDescription: 'An addictive woody blend that captures the spirit of the American West.',
        fullDescription: 'Richly saturated with smoked wood, leathery accents, and warm spices. No. 33 Santal Aura evokes the soft drift of smoke under dark desert skies.',
        images: [
          'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: true,
        bestSeller: true,
        newArrival: false,
        variants: [
          { size: '50ml', price: 90, salePrice: 75, sku: 'LL-SA-50', stock: 15, active: true },
          { size: '100ml', price: 120, salePrice: 95, sku: 'LL-SA-100', stock: 25, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Woody',
          topNotes: ['Cardamom', 'Iris'],
          middleNotes: ['Violet', 'Papyrus', 'Leather'],
          baseNotes: ['Sandalwood', 'Cedarwood', 'Amber'],
          concentration: 'Parfum',
          gender: 'Unisex',
          season: ['Winter', 'Autumn', 'Spring'],
          occasion: ['Daily', 'Date Night', 'Office']
        },
        performance: {
          longevity: 90,
          projection: 80
        },
        ratings: 4.8,
        numReviews: 1
      },
      {
        name: 'Lost Cherry Blossom',
        slug: 'lost-cherry-blossom',
        brand: 'Inspired by Tom Ford',
        category: inspiredId,
        shortDescription: 'A full-bodied journey into the once-forbidden cherry sweetness.',
        fullDescription: 'A contrasting scent that reveals a tempting dichotomy of playful, candy-like gleam on the outside and luscious flesh on the inside.',
        images: [
          'https://images.unsplash.com/photo-1590156546746-c58d0473950b?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: true,
        bestSeller: false,
        newArrival: true,
        variants: [
          { size: '50ml', price: 110, salePrice: 95, sku: 'TF-LC-50', stock: 10, active: true },
          { size: '100ml', price: 150, salePrice: 135, sku: 'TF-LC-100', stock: 12, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Oriental Sweet',
          topNotes: ['Black Cherry', 'Bitter Almond'],
          middleNotes: ['Cherry Syrup', 'Turkish Rose', 'Jasmine'],
          baseNotes: ['Peru Balsam', 'Roasted Tonka Bean', 'Sandalwood'],
          concentration: 'EDP',
          gender: 'Unisex',
          season: ['Winter', 'Autumn'],
          occasion: ['Party', 'Date Night', 'Wedding']
        },
        performance: {
          longevity: 85,
          projection: 85
        },
        ratings: 4.9,
        numReviews: 2
      },
      {
        name: 'Saffron & Suede',
        slug: 'saffron-and-suede',
        brand: 'Inspired by Byredo',
        category: inspiredId,
        shortDescription: 'A beautiful tribute to warm spices, dark leather, and soft saffron.',
        fullDescription: 'Captures the heritage and warmth of Middle Eastern traditions with notes of raspberry, black violet, and dark leathery accords.',
        images: [
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: false,
        bestSeller: true,
        newArrival: false,
        variants: [
          { size: '50ml', price: 85, salePrice: 0, sku: 'BY-SS-50', stock: 20, active: true },
          { size: '100ml', price: 110, salePrice: 0, sku: 'BY-SS-100', stock: 30, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Leather Spicy',
          topNotes: ['Saffron', 'Juniper Berries', 'Pomelo'],
          middleNotes: ['Black Violet', 'Accord Cuir', 'Cristal Rose'],
          baseNotes: ['Blonde Woods', 'Raspberry', 'Vetiver'],
          concentration: 'EDP',
          gender: 'Unisex',
          season: ['Autumn', 'Winter'],
          occasion: ['Office', 'Party', 'Date Night']
        },
        performance: {
          longevity: 80,
          projection: 70
        },
        ratings: 4.6,
        numReviews: 1
      },
      {
        name: 'Gypsy Oud',
        slug: 'gypsy-oud',
        brand: 'Inspired by Byredo',
        category: inspiredId,
        shortDescription: 'The scent of fresh soil, deep forests, and campfires.',
        fullDescription: 'A glamorization of the Romany lifestyle. The scent of pine needles, orris, lemon, incense, and deep sandalwood layers.',
        images: [
          'https://images.unsplash.com/photo-1588405748373-122b2321bc31?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: false,
        bestSeller: false,
        newArrival: true,
        variants: [
          { size: '50ml', price: 85, salePrice: 70, sku: 'BY-GO-50', stock: 8, active: true },
          { size: '100ml', price: 115, salePrice: 90, sku: 'BY-GO-100', stock: 18, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Woody Oriental',
          topNotes: ['Bergamot', 'Lemon', 'Pepper'],
          middleNotes: ['Incense', 'Pine Needles', 'Orris'],
          baseNotes: ['Amber', 'Vanilla', 'Sandalwood'],
          concentration: 'EDP',
          gender: 'Unisex',
          season: ['Spring', 'Summer', 'Autumn'],
          occasion: ['Daily', 'Casual', 'Office']
        },
        performance: {
          longevity: 75,
          projection: 70
        },
        ratings: 4.5,
        numReviews: 1
      },
      {
        name: 'Oud Wood Intense',
        slug: 'oud-wood-intense',
        brand: 'Inspired by Tom Ford',
        category: inspiredId,
        shortDescription: 'Smoky, rich, and mysterious agarwood masterpiece.',
        fullDescription: 'One of the most rare, precious, and expensive ingredients in a perfumer\'s arsenal, oud wood is often burned in incense-filled temples. Richly combined with rosewood and warm cardamom.',
        images: [
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1583467875263-d55f74a1e6f1?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: true,
        bestSeller: true,
        newArrival: false,
        variants: [
          { size: '50ml', price: 120, salePrice: 105, sku: 'TF-OW-50', stock: 6, active: true },
          { size: '100ml', price: 160, salePrice: 145, sku: 'TF-OW-100', stock: 15, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Woody Oud',
          topNotes: ['Rosewood', 'Cardamom', 'Chinese Pepper'],
          middleNotes: ['Oud Wood', 'Sandalwood', 'Vetiver'],
          baseNotes: ['Tonka Bean', 'Vanilla', 'Amber'],
          concentration: 'Parfum',
          gender: 'Men',
          season: ['Winter', 'Autumn'],
          occasion: ['Formal', 'Business', 'Wedding']
        },
        performance: {
          longevity: 95,
          projection: 90
        },
        ratings: 4.7,
        numReviews: 2
      },
      {
        name: 'Philosykos Fig & Wood',
        slug: 'philosykos-fig-and-wood',
        brand: 'Inspired by Diptyque',
        category: inspiredId,
        shortDescription: 'An ode to the entire fig tree: green leaves, white wood, and milky figs.',
        fullDescription: 'Green freshness of the leaves, the density of the white wood, the milky flavor of the figs. Refreshing, natural and elegant.',
        images: [
          'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: false,
        bestSeller: false,
        newArrival: false,
        variants: [
          { size: '50ml', price: 70, salePrice: 0, sku: 'DP-PF-50', stock: 15, active: true },
          { size: '100ml', price: 95, salePrice: 0, sku: 'DP-PF-100', stock: 40, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Green Fruity',
          topNotes: ['Fig Leaves', 'Fig Fruit'],
          middleNotes: ['Coconut', 'Green Notes'],
          baseNotes: ['Fig Tree', 'Cedarwood', 'Woody Notes'],
          concentration: 'EDT',
          gender: 'Unisex',
          season: ['Spring', 'Summer'],
          occasion: ['Daily', 'Casual', 'Office']
        },
        performance: {
          longevity: 70,
          projection: 65
        },
        ratings: 4.4,
        numReviews: 1
      },
      {
        name: 'Aura Custom Blend Kit',
        slug: 'aura-custom-blend-kit',
        brand: 'Aura Signature',
        category: customId,
        shortDescription: 'An immersive home experience to blend your own customized fragrance.',
        fullDescription: 'Includes 5 raw base oil notes, a mixing vial, and guide from our master perfumers to design your own signature presence.',
        images: [
          'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1617897903246-719242758050?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: true,
        bestSeller: true,
        newArrival: false,
        variants: [
          { size: '1 Kit', price: 180, salePrice: 160, sku: 'AU-CK-1', stock: 50, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Interactive Blending',
          topNotes: ['Bergamot', 'Grapefruit'],
          middleNotes: ['Jasmine', 'Rose', 'Lavender'],
          baseNotes: ['Cedarwood', 'Sandalwood', 'Patchouli'],
          concentration: 'Parfum',
          gender: 'Unisex',
          season: ['All Season'],
          occasion: ['Creative', 'Gifting', 'Party']
        },
        performance: {
          longevity: 80,
          projection: 80
        },
        ratings: 4.9,
        numReviews: 2
      },
      {
        name: 'The Discovery Set',
        slug: 'the-discovery-set',
        brand: 'Aura Signature',
        category: sampleId,
        shortDescription: 'Explore our core scents before choosing your signature perfume.',
        fullDescription: 'Contains five 2ml spray vials of Santal Aura, Lost Cherry, Gypsy Oud, Saffron & Suede, and Philosykos in a luxury sleeve.',
        images: [
          'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: false,
        bestSeller: false,
        newArrival: true,
        variants: [
          { size: '5 x 2ml', price: 30, salePrice: 25, sku: 'AU-DS-5', stock: 100, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Discovery Samples',
          topNotes: ['Mixed Citrus'],
          middleNotes: ['Mixed Floral', 'Leather'],
          baseNotes: ['Mixed Cedarwood', 'Sandalwood'],
          concentration: 'EDP',
          gender: 'Unisex',
          season: ['All Season'],
          occasion: ['Sampling', 'Daily']
        },
        performance: {
          longevity: 75,
          projection: 70
        },
        ratings: 4.8,
        numReviews: 1
      },
      {
        name: 'Imperial Gold Gift Set',
        slug: 'imperial-gold-gift-set',
        brand: 'Aura Signature',
        category: giftId,
        shortDescription: 'A luxurious gift presentation containing our top selling Santal Aura.',
        fullDescription: 'Contains Santal Aura 100ml perfume bottle alongside a scented soy candle and traveling perfume atomiser in a gold foil box.',
        images: [
          'https://images.unsplash.com/photo-1587017539504-67cf730227c7?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: false,
        bestSeller: true,
        newArrival: false,
        variants: [
          { size: '1 Set', price: 220, salePrice: 195, sku: 'AU-IGS-1', stock: 20, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Luxury Gift Set',
          topNotes: ['Cardamom'],
          middleNotes: ['Leather', 'Violet'],
          baseNotes: ['Sandalwood', 'Amber'],
          concentration: 'Parfum',
          gender: 'Unisex',
          season: ['Winter', 'Autumn'],
          occasion: ['Gifting', 'Luxury', 'Party']
        },
        performance: {
          longevity: 90,
          projection: 80
        },
        ratings: 5.0,
        numReviews: 1
      },
      {
        name: 'Aura Grand Reserve',
        slug: 'aura-grand-reserve',
        brand: 'Aura Signature',
        category: luxuryId,
        shortDescription: 'Handcrafted in micro-batches with high-grade ambergris and Bulgarian rose.',
        fullDescription: 'The absolute pinnacle of olfactory luxury and timeless presence. Infused with aged agarwood and precious saffron threads.',
        images: [
          'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&auto=format&fit=crop'
        ],
        status: 'active',
        featured: true,
        bestSeller: false,
        newArrival: true,
        variants: [
          { size: '100ml', price: 250, salePrice: 0, sku: 'AU-GR-100', stock: 8, active: true }
        ],
        fragrance: {
          fragranceFamily: 'Chypre Floral',
          topNotes: ['Bulgarian Rose', 'Saffron'],
          middleNotes: ['Ambergris', 'Vetiver'],
          baseNotes: ['White Musk', 'Aged Agarwood'],
          concentration: 'Parfum',
          gender: 'Unisex',
          season: ['Winter', 'Autumn'],
          occasion: ['Formal', 'Signature', 'Wedding']
        },
        performance: {
          longevity: 98,
          projection: 95
        },
        ratings: 4.9,
        numReviews: 1
      }
    ];

    const seededProducts = await Product.create(productsData);
    console.log(`Seeded ${seededProducts.length} products.`);

    // Seed Coupons
    const seededCoupons = await Coupon.create(couponsData);
    console.log(`Seeded ${seededCoupons.length} coupons.`);

    // Add a few reviews
    const user = createdUsers.find(u => u.role === 'user');
    const santal = seededProducts.find(p => p.name.includes('Santal Aura'));
    await Review.create({
      product: santal._id,
      user: user._id,
      rating: 5,
      comment: 'Absolutely phenomenal. Smells exactly like the original, if not with better projection. The bottle design is super minimalist and clean.',
      isApproved: true
    });

    console.log('Seeded review.');

    // Recalculate average ratings
    await Review.calculateAverageRating(santal._id);
    console.log('Average ratings aggregated.');

    console.log('Database seeding complete successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
