const User = require('../models/User')

//  Get All Officers 
const getOfficers = async (req, res) => {
  try {
    const filter = { role: 'officer' }

    // Restrict district admins to officers in their assigned district
    if (req.user.role === 'admin') {
      const adminUser = await User.findById(req.user.id)
      if (adminUser && adminUser.district) {
        filter.district = adminUser.district
      }
    } else {
      const { district } = req.query
      if (district) filter.district = district
    }

    const officers = await User.find(filter)
      .select('name email ward district')

    res.status(200).json(officers)
  } catch (err) {
    console.error('Get officers error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

//  Get Profile 
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

//  Update Profile 
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

//  Get All Users 
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query
    const filter = { role: { $ne: 'super_admin' } }
    if (role) filter.role = role

    const users = await User.find(filter)
      .select('name email role ward isActive isPasswordSet createdAt')
      .sort({ createdAt: -1 })

    res.status(200).json(users)
  } catch (err) {
    console.error('Get all users error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

//  Deactivate User 
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate yourself' })
    }

    if (user.role === 'super_admin') {
      return res.status(400).json({ message: 'Cannot deactivate a super admin' })
    }

    user.isActive = false
    await user.save()

    res.status(200).json({ message: 'User deactivated successfully' })
  } catch (err) {
    console.error('Deactivate user error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

//  Activate User 
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.isActive = true
    await user.save()

    res.status(200).json({ message: 'User activated successfully', user })
  } catch (err) {
    console.error('Activate user error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

module.exports = { getOfficers, getProfile, updateProfile, getAllUsers, deactivateUser, activateUser }