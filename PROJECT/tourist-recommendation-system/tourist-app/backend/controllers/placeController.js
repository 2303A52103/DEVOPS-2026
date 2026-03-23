const Place = require('../models/Place');

const getAllPlaces = async (req, res) => {
  try {
    const { location, category, budget, search, sort, limit = 20, page = 1 } = req.query;
    const filter = { isActive: true };

    // Location filter
    if (location && location.trim()) {
      filter.location = { $regex: location.trim(), $options: 'i' };
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }

    // Budget filter
    if (budget && budget !== 'all') {
      filter.budget = budget.toLowerCase();
    }

    // Search — matches across name, description, location, and category
    if (search && search.trim()) {
      const terms = search.trim().split(/\s+/).filter(Boolean);
      // Each word must appear in at least one field
      const termFilters = terms.map((term) => ({
        $or: [
          { name:        { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
          { location:    { $regex: term, $options: 'i' } },
          { category:    { $regex: term, $options: 'i' } },
          { budget:      { $regex: term, $options: 'i' } },
          { bestTimeToVisit: { $regex: term, $options: 'i' } },
        ],
      }));
      filter.$and = [...(filter.$and || []), ...termFilters];
    }

    // Sort
    let sortOption = { rating: -1 };
    if (sort === 'rating')  sortOption = { rating: -1 };
    else if (sort === 'name')   sortOption = { name: 1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'budget_low')  sortOption = { budget: 1 };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Place.countDocuments(filter);
    const places = await Place.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: places.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: places,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getTopRated = async (req, res) => {
  try {
    const places = await Place.find({ isActive: true, rating: { $gte: 4 } })
      .sort({ rating: -1 })
      .limit(6);
    res.json({ success: true, data: places });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.json({ success: true, data: place });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const createPlace = async (req, res) => {
  try {
    const { name, description, location, category, imageUrl, rating, budget, bestTimeToVisit, lat, lng } = req.body;
    let finalImageUrl = imageUrl || '';
    if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

    const place = await Place.create({
      name, description, location, category,
      imageUrl: finalImageUrl,
      rating: rating ? parseFloat(rating) : 0,
      budget, bestTimeToVisit,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    });
    res.status(201).json({ success: true, message: 'Place added successfully!', data: place });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updatePlace = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.imageUrl = `/uploads/${req.file.filename}`;
    if (updates.rating) updates.rating = parseFloat(updates.rating);
    if (updates.lat)    updates.lat    = parseFloat(updates.lat);
    if (updates.lng)    updates.lng    = parseFloat(updates.lng);

    const place = await Place.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.json({ success: true, message: 'Place updated!', data: place });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const deletePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.json({ success: true, message: 'Place removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getAllPlaces, getTopRated, getPlaceById, createPlace, updatePlace, deletePlace };
