const Notification = require('../models/Notification')

// ─── Get Notifications ────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate('issueId', 'title status')
      .sort({ createdAt: -1 })
      .limit(20)

    res.status(200).json(notifications)
  } catch (err) {
    console.error('Get notifications error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Mark As Read ─────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    notification.isRead = true
    await notification.save()

    res.status(200).json({ message: 'Marked as read' })
  } catch (err) {
    console.error('Mark as read error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

module.exports = { getNotifications, markAsRead }