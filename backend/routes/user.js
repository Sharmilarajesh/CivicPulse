const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken')
const checkRole = require('../middleware/checkRole')
const {
  getOfficers,
  getProfile,
  updateProfile,
  getAllUsers,
  deactivateUser,
  activateUser
} = require('../controllers/user')

router.get('/all', verifyToken, checkRole('admin', 'super_admin'), getAllUsers)
router.delete('/:id', verifyToken, checkRole('super_admin'), deactivateUser)
router.put('/:id/activate', verifyToken, checkRole('super_admin'), activateUser)

router.get('/officers', verifyToken, checkRole('admin', 'super_admin'), getOfficers)
router.get('/profile', verifyToken, getProfile)
router.put('/profile', verifyToken, updateProfile)

module.exports = router