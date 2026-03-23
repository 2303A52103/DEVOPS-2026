const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  getAllPlaces, getTopRated, getMyPlaces,
  getPlaceById, createPlace, updatePlace, deletePlace,
} = require('../controllers/placeController');

router.get('/top-rated', getTopRated);
router.get('/my',  protect, getMyPlaces);          // logged-in user's own places
router.get('/',    getAllPlaces);                   // public
router.get('/:id', getPlaceById);                  // public

router.post('/',     protect, upload.single('image'), createPlace);   // any logged-in user
router.put('/:id',   protect, upload.single('image'), updatePlace);   // owner or admin
router.delete('/:id',protect, deletePlace);                           // owner or admin

module.exports = router;
