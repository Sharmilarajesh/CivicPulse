const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['citizen', 'officer', 'admin', 'super_admin'],
    default: 'citizen'
  },
  ward: {
    type: String,
    default: ''
  },
  district: {
    type: String,
    default: null
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPasswordSet: {
    type: Boolean,
    default: false
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  inviteToken: {
    type: String,
    default: undefined
  },
  inviteTokenExpires: {
    type: Date,
    default: undefined
  },
  passwordResetToken: {
    type: String,
    default: undefined
  },
  passwordResetExpires: {
    type: Date,
    default: undefined
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('User', userSchema)