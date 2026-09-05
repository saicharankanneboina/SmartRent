const express = require('express');
const { analyzeAndRecommend, getHistory } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/analyze', analyzeAndRecommend);
router.get('/', protect, getHistory);

module.exports = router;
