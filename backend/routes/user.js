const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken')
const checkRole = require('../middleware/checkRole')
const {
  getOfficers,
  getProfile,
  updateProfile
} = require('../controllers/user')

router.get('/officers', verifyToken, checkRole('admin'), getOfficers)
router.get('/profile', verifyToken, getProfile)
router.put('/profile', verifyToken, updateProfile)

module.exports = router