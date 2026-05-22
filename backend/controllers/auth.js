const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const {
  sendWelcomeEmail,
  sendPasswordResetEmail
} = require('../utils/email')

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// ─── Register ─────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role, ward } = req.body

    if (role === 'admin') {
      return res.status(400).json({ message: 'Admin registration is not allowed' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'citizen',
      ward: ward || ''
    })

    await newUser.save()

    sendWelcomeEmail(email, name).catch(err =>
      console.error('Welcome email failed:', err.message)
    )

    const token = generateToken(newUser)

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        ward: newUser.ward
      }
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Login ────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const token = generateToken(user)

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Forgot Password ──────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(200).json({
        message: 'If this email exists, a reset link has been sent.'
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    user.passwordResetToken = resetTokenHash
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000
    await user.save()

    await sendPasswordResetEmail(email, user.name, resetToken)

    res.status(200).json({
      message: 'If this email exists, a reset link has been sent.'
    })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Reset Password ───────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' })
    }

    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        message: 'Reset token is invalid or has expired'
      })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    res.status(200).json({ message: 'Password reset successful. Please login.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

module.exports = { register, login, forgotPassword, resetPassword }