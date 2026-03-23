const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Place name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['beach', 'hill', 'city', 'forest', 'desert', 'historical', 'adventure'],
        message: 'Category must be one of: beach, hill, city, forest, desert, historical, adventure',
      },
      lowercase: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },
    budget: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Budget must be one of: low, medium, high',
      },
      default: 'medium',
    },
    bestTimeToVisit: {
      type: String,
      default: '',
    },
    // Geographic coordinates for map display
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
placeSchema.index({ name: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Place', placeSchema);
