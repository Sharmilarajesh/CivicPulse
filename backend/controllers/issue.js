const Issue = require('../models/Issue')
const Notification = require('../models/Notification')
const User = require('../models/User')
const { sendStatusUpdateEmail } = require('../utils/email')

// ─── Create Issue ─────────────────────────────────────────
const createIssue = async (req, res) => {
  try {
    const {
      title, description, category,
      lat, lng, address, city, state, ward
    } = req.body

    const photos = req.files ? req.files.map(f => f.path) : []

    const newIssue = new Issue({
      title, description, category,
      location: {
        lat, lng, address,
        city: city || '',
        state: state || ''
      },
      photos,
      ward: ward || '',
      reportedBy: req.user.id
    })

    await newIssue.save()

    res.status(201).json({
      message: 'Issue reported successfully',
      issue: newIssue
    })
  } catch (err) {
    console.error('Create issue error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Get Public Issues ────────────────────────────────────
const getPublicIssues = async (req, res) => {
  try {
    const issues = await Issue.find()
      .select('_id title category status location upvotes')
      .sort({ createdAt: -1 })

    res.status(200).json(issues)
  } catch (err) {
    console.error('Get public issues error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Get All Issues (admin) ───────────────────────────────
const getAllIssues = async (req, res) => {
  try {
    const {
      status, category, search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query

    const filter = {}
    if (status) filter.status = status
    if (category) filter.category = category
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ]
    }

    const sortOrder = order === 'asc' ? 1 : -1
    const sortOptions = {}
    if (sortBy === 'upvotes') {
      sortOptions.upvotesCount = sortOrder
    } else {
      sortOptions.createdAt = sortOrder
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    const total = await Issue.countDocuments(filter)

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email ward')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)

    res.status(200).json({
      issues,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    })
  } catch (err) {
    console.error('Get all issues error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Get My Issues (citizen) ──────────────────────────────
const getMyIssues = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query

    const filter = { reportedBy: req.user.id }
    if (status) filter.status = status

    const sortOrder = order === 'asc' ? 1 : -1
    const sortOptions = { [sortBy]: sortOrder }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    const total = await Issue.countDocuments(filter)

    const issues = await Issue.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)

    res.status(200).json({
      issues,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    })
  } catch (err) {
    console.error('Get my issues error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Get Ward Issues (officer) ────────────────────────────
const getWardIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ ward: req.params.wardId })
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })

    res.status(200).json(issues)
  } catch (err) {
    console.error('Get ward issues error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Get Issue By ID ──────────────────────────────────────
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email ward')

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    res.status(200).json(issue)
  } catch (err) {
    console.error('Get issue by id error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Update Status (officer) ──────────────────────────────
const updateStatus = async (req, res) => {
  try {
    const { newStatus, resolutionNote, resolutionPhoto } = req.body

    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email')

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    issue.status = newStatus

    if (newStatus === 'resolved') {
      issue.resolutionNote = resolutionNote || ''
      issue.resolutionPhoto = resolutionPhoto || ''
    }

    await issue.save()

    const message = `Your issue "${issue.title}" status changed to ${newStatus.replace(/_/g, ' ')}`

    const notification = new Notification({
      userId: issue.reportedBy._id,
      issueId: issue._id,
      message,
      type: newStatus === 'resolved' ? 'resolved' : 'status_change'
    })
    await notification.save()

    req.io.to(issue.reportedBy._id.toString()).emit('notification', {
      message,
      issueId: issue._id
    })

    sendStatusUpdateEmail(
      issue.reportedBy.email,
      issue.reportedBy.name,
      issue.title,
      newStatus
    ).catch(err => console.error('Status email failed:', err.message))

    res.status(200).json({
      message: 'Status updated successfully',
      issue
    })
  } catch (err) {
    console.error('Update status error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Assign Officer (admin) ───────────────────────────────
const assignOfficer = async (req, res) => {
  try {
    const { officerId } = req.body

    const issue = await Issue.findById(req.params.id)
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    const officer = await User.findById(officerId)
    if (!officer) {
      return res.status(404).json({ message: 'Officer not found' })
    }

    issue.assignedTo = officerId
    issue.status = 'assigned'
    issue.ward = officer.ward
    await issue.save()

    const message = `You have been assigned a new issue: "${issue.title}"`

    const notification = new Notification({
      userId: officerId,
      issueId: issue._id,
      message,
      type: 'assigned'
    })
    await notification.save()

    req.io.to(officerId.toString()).emit('notification', {
      message,
      issueId: issue._id
    })

    res.status(200).json({
      message: 'Officer assigned successfully',
      issue
    })
  } catch (err) {
    console.error('Assign officer error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Toggle Upvote (citizen) ──────────────────────────────
const toggleUpvote = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    const userId = req.user.id
    const alreadyUpvoted = issue.upvotes.includes(userId)

    if (alreadyUpvoted) {
      issue.upvotes = issue.upvotes.filter(id => id.toString() !== userId)
    } else {
      issue.upvotes.push(userId)
    }

    await issue.save()

    res.status(200).json({
      message: alreadyUpvoted ? 'Upvote removed' : 'Upvoted successfully',
      upvotes: issue.upvotes.length
    })
  } catch (err) {
    console.error('Toggle upvote error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Delete Issue (admin) ─────────────────────────────────
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    await Issue.findByIdAndDelete(req.params.id)
    await Notification.deleteMany({ issueId: req.params.id })

    res.status(200).json({ message: 'Issue deleted successfully' })
  } catch (err) {
    console.error('Delete issue error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

module.exports = {
  createIssue,
  getPublicIssues,
  getAllIssues,
  getMyIssues,
  getWardIssues,
  getIssueById,
  updateStatus,
  assignOfficer,
  toggleUpvote,
  deleteIssue
}