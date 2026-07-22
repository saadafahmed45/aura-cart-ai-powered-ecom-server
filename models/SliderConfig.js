import mongoose from 'mongoose';

const sliderConfigSchema = new mongoose.Schema(
  {
    height: {
      type: String,
      default: '85vh',
      trim: true
    },
    autoplayInterval: {
      type: Number,
      default: 6000,
      min: 1000
    },
    overlayOpacity: {
      type: Number,
      default: 15,
      min: 0,
      max: 100
    },
    overlayColor: {
      type: String,
      default: '#000000',
      trim: true
    },
    objectFit: {
      type: String,
      enum: ['cover', 'contain', 'fill'],
      default: 'cover'
    },
    contentMaxWidth: {
      type: String,
      default: 'max-w-7xl',
      trim: true
    },
    contentAlign: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left'
    }
  },
  { timestamps: true }
);

const SliderConfig = mongoose.model('SliderConfig', sliderConfigSchema);

export default SliderConfig;
