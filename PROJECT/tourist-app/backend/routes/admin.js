const express = require('express');
const router = express.Router();
const Place = require('../models/Place');

// GET /api/admin/stats — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const total = await Place.countDocuments({ isActive: true });
    const byCategory = await Place.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const avgRating = await Place.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    res.json({
      success: true,
      data: {
        total,
        byCategory,
        averageRating: avgRating[0]?.avg?.toFixed(2) || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/places — all places including inactive
router.get('/places', async (req, res) => {
  try {
    const places = await Place.find().sort({ createdAt: -1 });
    res.json({ success: true, data: places });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
