const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getAllPlaces,
  getTopRated,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
} = require('../controllers/placeController');

// GET /api/places/top-rated  — must be before /:id
router.get('/top-rated', getTopRated);

// GET  /api/places          — list + filter
router.get('/', getAllPlaces);

// GET  /api/places/:id
router.get('/:id', getPlaceById);

// POST /api/places          — create with optional image upload
router.post('/', upload.single('image'), createPlace);

// PUT  /api/places/:id
router.put('/:id', upload.single('image'), updatePlace);

// DELETE /api/places/:id    — soft-delete
router.delete('/:id', deletePlace);

module.exports = router;
