import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Slide image is required']
    },
    title: {
      type: String,
      required: [true, 'Slide title is required'],
      trim: true,
      maxLength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      maxLength: [300, 'Description cannot exceed 300 characters']
    },
    buttonText: {
      type: String,
      trim: true,
      default: 'Shop Now'
    },
    buttonLink: {
      type: String,
      trim: true,
      default: '/products'
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

export default HeroSlide;
