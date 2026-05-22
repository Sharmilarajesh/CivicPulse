const User = require('../models/User')

// ─── Get All Officers ─────────────────────────────────────
const getOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer' })
      .select('name email ward')

    res.status(200).json(officers)
  } catch (err) {
    console.error('Get officers error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Get Profile ──────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json(user)
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Update Profile ───────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, ward } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, ward },
      { new: true }
    ).select('-password')

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

module.exports = { getOfficers, getProfile, updateProfile }