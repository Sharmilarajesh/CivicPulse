const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken')
const checkRole = require('../middleware/checkRole')
const {
  getSummary,
  getResolutionTime
} = require('../controllers/analytics')

router.get('/summary', verifyToken, checkRole('admin'), getSummary)
router.get('/resolution-time', verifyToken, checkRole('admin'), getResolutionTime)

module.exports = router