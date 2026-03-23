const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Place name is required'], trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: [1000, 'Description cannot exceed 1000 characters'] },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    category: {
      type: String, required: [true, 'Category is required'], lowercase: true,
      enum: { values: ['beach','hill','city','forest','desert','historical','adventure'], message: 'Invalid category' },
    },
    imageUrl:        { type: String, default: '' },
    rating:          { type: Number, min: 0, max: 5, default: 0 },
    budget:          { type: String, enum: ['low','medium','high'], default: 'medium' },
    bestTimeToVisit: { type: String, default: '' },
    lat:             { type: Number, default: null },
    lng:             { type: Number, default: null },
    isActive:        { type: Boolean, default: true },

    // track who added this place
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    addedByName: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

placeSchema.index({ name: 'text', description: 'text', location: 'text' });
module.exports = mongoose.model('Place', placeSchema);
