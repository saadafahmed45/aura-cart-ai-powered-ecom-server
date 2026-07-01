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
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets, phones, and accessories' },
  { name: 'Clothing', slug: 'clothing', description: 'Trendy wear and accessories' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Appliances and home decor' },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Cosmetics and skincare' }
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

    const electronicsId = createdCategories.find(c => c.slug === 'electronics')._id;
    const clothingId = createdCategories.find(c => c.slug === 'clothing')._id;
    const homeId = createdCategories.find(c => c.slug === 'home-kitchen')._id;
    const beautyId = createdCategories.find(c => c.slug === 'beauty-personal-care')._id;

    // Seed Products
    const productsData = [
      {
        name: 'Pro Noise Cancelling Headphones',
        description: 'Experience pure audio immersion with industry-leading hybrid active noise cancelling technology, 40-hour battery life, and crystal clear wireless audio transmission.',
        price: 299,
        discountPrice: 249,
        category: electronicsId,
        brand: 'SonicSound',
        stock: 15,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop'],
        ratings: 4.5,
        numReviews: 1
      },
      {
        name: 'V2 Smart Premium Smartphone',
        description: 'Next-gen performance featuring a 6.7-inch OLED screen, triple camera array with optical zoom, 128GB base storage, and 5G support.',
        price: 899,
        discountPrice: 799,
        category: electronicsId,
        brand: 'Aero',
        stock: 8,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop'],
        ratings: 4.8,
        numReviews: 2
      },
      {
        name: 'Classic Leather Jacket',
        description: 'Handcrafted from full-grain leather, this timeless jacket features robust silver hardware, soft inner satin lining, and multiple utility pockets.',
        price: 180,
        discountPrice: 150,
        category: clothingId,
        brand: 'Heritage',
        stock: 22,
        images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop'],
        ratings: 4.2,
        numReviews: 1
      },
      {
        name: 'Minimalist Mesh Sneakers',
        description: 'Extremely lightweight, breathable, and designed for peak ergonomics. Perfect for both casual wear and running.',
        price: 95,
        discountPrice: 0,
        category: clothingId,
        brand: 'Stride',
        stock: 50,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop'],
        ratings: 4.6,
        numReviews: 3
      },
      {
        name: 'Automatic Drip Coffee Maker',
        description: 'Wake up to the rich aroma of freshly brewed coffee. Program your brew up to 24 hours in advance with custom concentration options.',
        price: 120,
        discountPrice: 99,
        category: homeId,
        brand: 'BrewMaster',
        stock: 12,
        images: ['https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=800&auto=format&fit=crop'],
        ratings: 4.4,
        numReviews: 1
      },
      {
        name: 'Elegance Luxury Perfume',
        description: 'An exquisite blend of sweet jasmine notes, rich cedar wood, and amber undertones. Perfect for formal evenings.',
        price: 85,
        discountPrice: 75,
        category: beautyId,
        brand: 'Oura',
        stock: 30,
        images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop'],
        ratings: 4.7,
        numReviews: 2
      }
    ];

    const seededProducts = await Product.create(productsData);
    console.log(`Seeded ${seededProducts.length} products.`);

    // Seed Coupons
    const seededCoupons = await Coupon.create(couponsData);
    console.log(`Seeded ${seededCoupons.length} coupons.`);

    // Add a few reviews
    const user = createdUsers.find(u => u.role === 'user');
    const headphone = seededProducts.find(p => p.name.includes('Headphones'));
    await Review.create({
      product: headphone._id,
      user: user._id,
      rating: 5,
      comment: 'Superb quality sound! Active noise cancelling works like a charm. Highly recommend.',
      isApproved: true
    });

    console.log('Seeded review.');

    // Recalculate average ratings
    await Review.calculateAverageRating(headphone._id);
    console.log('Average ratings aggregated.');

    console.log('Database seeding complete successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
