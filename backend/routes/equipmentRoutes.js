const express = require('express');
const {
  getEquipments,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.route('/')
  .get(getEquipments)
  .post(protect, authorize('Equipment Owner', 'Admin'), createEquipment);

router.route('/:id')
  .get(getEquipment)
  .put(protect, authorize('Equipment Owner', 'Admin'), updateEquipment)
  .delete(protect, authorize('Equipment Owner', 'Admin'), deleteEquipment);

module.exports = router;
