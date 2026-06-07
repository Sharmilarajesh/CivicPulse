const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken')
const {
  getNotifications,
  markAsRead,
  deleteNotification
} = require('../controllers/notification')

router.get('/', verifyToken, getNotifications)
router.patch('/:id/read', verifyToken, markAsRead)
router.delete('/:id', verifyToken, deleteNotification)

module.exports = router