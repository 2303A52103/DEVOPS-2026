const Place = require('../models/Place');

/* ── GET /api/places ─────────────────────────────── */
const getAllPlaces = async (req, res) => {
  try {
    const { location, category, budget, search, sort, limit = 20, page = 1 } = req.query;
    const filter = { isActive: true };

    if (location && location.trim()) filter.location = { $regex: location.trim(), $options: 'i' };
    if (category && category !== 'all') filter.category = category.toLowerCase();
    if (budget   && budget   !== 'all') filter.budget   = budget.toLowerCase();

    if (search && search.trim()) {
      const terms = search.trim().split(/\s+/).filter(Boolean);
      const termFilters = terms.map((t) => ({
        $or: [
          { name:        { $regex: t, $options: 'i' } },
          { description: { $regex: t, $options: 'i' } },
          { location:    { $regex: t, $options: 'i' } },
          { category:    { $regex: t, $options: 'i' } },
          { bestTimeToVisit: { $regex: t, $options: 'i' } },
        ],
      }));
      filter.$and = [...(filter.$and || []), ...termFilters];
    }

    let sortOption = { rating: -1 };
    if (sort === 'name')   sortOption = { name: 1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const total  = await Place.countDocuments(filter);
    const places = await Place.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit));

    res.json({ success: true, count: places.length, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/places/top-rated ───────────────────── */
const getTopRated = async (req, res) => {
  try {
    const places = await Place.find({ isActive: true, rating: { $gte: 4 } }).sort({ rating: -1 }).limit(6);
    res.json({ success: true, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/places/my ──────────────────────────── */
// Places added by the currently logged-in user
const getMyPlaces = async (req, res) => {
  try {
    const places = await Place.find({ addedBy: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: places.length, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/places/:id ─────────────────────────── */
const getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/places ────────────────────────────── */
// Any logged-in user can add a place
const createPlace = async (req, res) => {
  try {
    const { name, description, location, category, imageUrl, rating, budget, bestTimeToVisit, lat, lng } = req.body;
    let finalImageUrl = imageUrl || '';
    if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

    const place = await Place.create({
      name, description, location, category,
      imageUrl: finalImageUrl,
      rating:   rating ? parseFloat(rating) : 0,
      budget, bestTimeToVisit,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      addedBy:     req.user ? req.user._id   : null,
      addedByName: req.user ? req.user.name  : 'Admin',
    });

    res.status(201).json({ success: true, message: 'Place added successfully!', data: place });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: msgs.join(', ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── PUT /api/places/:id ─────────────────────────── */
// Owner or admin can edit
const updatePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });

    const isOwner = place.addedBy && place.addedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, message: 'Not authorised to edit this place' });

    const updates = { ...req.body };
    if (req.file) updates.imageUrl = `/uploads/${req.file.filename}`;
    if (updates.rating) updates.rating = parseFloat(updates.rating);
    if (updates.lat)    updates.lat    = parseFloat(updates.lat);
    if (updates.lng)    updates.lng    = parseFloat(updates.lng);

    const updated = await Place.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Place updated!', data: updated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: msgs.join(', ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── DELETE /api/places/:id ──────────────────────── */
// Owner or admin can delete
const deletePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });

    const isOwner = place.addedBy && place.addedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, message: 'Not authorised to delete this place' });

    await Place.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Place removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllPlaces, getTopRated, getMyPlaces, getPlaceById, createPlace, updatePlace, deletePlace };
