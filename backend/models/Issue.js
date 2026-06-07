const mongoose = require('mongoose')

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['pothole', 'garbage', 'streetlight', 'water', 'sewage', 'other']
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' }
  },
  district: {
    type: String,
    default: null
  },
  photos: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['reported', 'under_review', 'assigned', 'in_progress', 'resolved'],
    default: 'reported'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  upvotes: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  resolutionPhoto: {
    type: String,
    default: ''
  },
  resolutionNote: {
    type: String,
    default: ''
  },
  ward: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

issueSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('Issue', issueSchema)