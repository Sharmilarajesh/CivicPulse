const Issue = require('../models/Issue')
const Notification = require('../models/Notification')
const User = require('../models/User')
const {
  sendStatusUpdateEmail,
  sendIssueReportedCitizenEmail,
  sendIssueReportedAdminEmail,
  sendIssueAssignedOfficerEmail,
  sendStatusUpdateAdminEmail,
  sendIssueAssignedAdminEmail
} = require('../utils/email')
const cloudinary = require('../utils/cloudinary')
const { detectDistrict, geocodeAddressText, normalizeDistrict } = require('../utils/detectDistrict')

//  Create Issue 
const createIssue = async (req, res) => {
  try {
    const {
      title, description, category,
      lat, lng, address, city, state, ward
    } = req.body

    const photos = req.files ? req.files.map(f => f.path) : []

    let parsedLat = parseFloat(lat)
    let parsedLng = parseFloat(lng)
    let district = null

    if (parsedLat === 0 && parsedLng === 0) {
      // Manual entry, try to geocode the address
      const queryParts = []
      if (address) queryParts.push(address)
      if (city) queryParts.push(city)
      if (state) queryParts.push(state)
      const queryText = queryParts.join(', ')

      const geocodeResult = await geocodeAddressText(queryText)
      if (geocodeResult) {
        parsedLat = geocodeResult.lat
        parsedLng = geocodeResult.lng
        district = geocodeResult.district
      } else {
        // Fallback: use city as district (normalized to official TN district spelling/casing)
        district = normalizeDistrict(city) || null
      }
    } else {
      district = await detectDistrict(parsedLat, parsedLng)
    }

    const newIssue = new Issue({
      title, description, category,
      location: {
        lat: parsedLat,
        lng: parsedLng,
        address,
        city: city || '',
        state: state || ''
      },
      photos,
      district,
      ward: ward || '',
      reportedBy: req.user.id
    })

    await newIssue.save()

    // Fire-and-forget notifications
    ;(async () => {
      try {
        // Fetch reporter email and name
        const reporter = await User.findById(req.user.id)
        if (reporter) {
          sendIssueReportedCitizenEmail(
            reporter.email,
            reporter.name,
            newIssue.title,
            newIssue.category
          ).catch(err => console.error('Citizen report email failed:', err.message))
        }

        const query = {
          $or: [
            { role: 'super_admin' },
            { role: 'admin', district: newIssue.district }
          ]
        }
        // If district is null, it just won't match any district admins, which is fine
        const targets = await User.find(query)
        const message = `New issue reported: "${newIssue.title}" in ${newIssue.district || newIssue.ward || newIssue.location.city || 'your area'}`
        
        // Send email to admins/super admins
        const locationStr = `${newIssue.location.address || ''}, ${newIssue.location.city || ''}, ${newIssue.location.state || ''}`
        targets.forEach(admin => {
          sendIssueReportedAdminEmail(
            admin.email,
            admin.name,
            newIssue.title,
            newIssue.category,
            locationStr
          ).catch(err => console.error('Admin report email failed:', err.message))
        })

        const notifications = targets.map(user => ({
          userId: user._id,
          issueId: newIssue._id,
          message,
          type: 'status_change'
        }))
        
        if (notifications.length > 0) {
          const savedNotifs = await Notification.insertMany(notifications)
          const populatedNotifs = await Notification.populate(savedNotifs, { path: 'issueId', select: 'title status' })
          populatedNotifs.forEach(n => {
            if (req.io) {
              req.io.to(n.userId.toString()).emit('notification', n)
            }
          })
        }
      } catch (notifyErr) {
        console.error('Failed to send createIssue notifications:', notifyErr)
      }
    })()

    res.status(201).json({
      message: 'Issue reported successfully',
      issue: newIssue
    })
  } catch (err) {
    console.error('Create issue error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

//  Get Public Issues 
const getPublicIssues = async (req, res) => {
  try {
    const issues = await Issue.find()
      .select('_id title description category status location upvotes photos createdAt')
      .sort({ createdAt: -1 })

    res.status(200).json(issues)
  } catch (err) {
    console.error('Get public issues error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

//  Get All Issues (admin) ─
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
    
    // Restrict district admins to their assigned district
    if (req.user.role === 'admin') {
      const adminUser = await User.findById(req.user.id)
      if (adminUser && adminUser.district) {
        filter.district = adminUser.district
      }
    }

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

//  Get My Issues (citizen) 
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

//  Get Ward Issues (officer) ─
const getWardIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ ward: req.params.wardId })
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })

    res.status(200).json({ issues })
  } catch (err) {
    console.error('Get ward issues error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

//  Get Assigned Issues (officer) 
const getAssignedIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ assignedTo: req.user.id })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({ issues })
  } catch (err) {
    console.error('Get assigned issues error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

//  Get Issue By ID 
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

//  Update Status (officer) 
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
      issue.resolutionPhoto = req.file ? req.file.path : (resolutionPhoto || '')
    }

    await issue.save()

    // Fire-and-forget notifications
    ;(async () => {
      try {
        const citizenMessage = `Your issue "${issue.title}" status changed to ${newStatus.replace(/_/g, ' ')}`
        const targets = [
          { id: issue.reportedBy._id, message: citizenMessage, type: newStatus === 'resolved' ? 'resolved' : 'status_change' }
        ]

        // Find all Super Admins and District Admins for this issue's district
        const query = {
          $or: [
            { role: 'super_admin' },
            { role: 'admin', district: issue.district }
          ]
        }
        const admins = await User.find(query)

        admins.forEach(admin => {
          let message;
          if (admin.role === 'super_admin') {
            message = `Issue "${issue.title}" in ${issue.district || 'unknown district'} status updated to ${newStatus.replace(/_/g, ' ')}`
          } else {
            message = `Issue "${issue.title}" status updated to ${newStatus.replace(/_/g, ' ')}`
          }
          targets.push({ id: admin._id, message, type: 'status_change' })
        })

        const notifications = targets.map(t => ({
          userId: t.id,
          issueId: issue._id,
          message: t.message,
          type: t.type
        }))

        if (notifications.length > 0) {
          const savedNotifs = await Notification.insertMany(notifications)
          const populatedNotifs = await Notification.populate(savedNotifs, { path: 'issueId', select: 'title status' })
          populatedNotifs.forEach(n => {
            if (req.io) {
              req.io.to(n.userId.toString()).emit('notification', n)
            }
          })
        }

        // Send email to reporting citizen
        sendStatusUpdateEmail(
          issue.reportedBy.email,
          issue.reportedBy.name,
          issue.title,
          newStatus
        ).catch(err => console.error('Status email failed:', err.message))

        // Send email to all relevant admins / super admins
        admins.forEach(admin => {
          sendStatusUpdateAdminEmail(
            admin.email,
            admin.name,
            issue.title,
            newStatus,
            issue.district
          ).catch(err => console.error('Admin status email failed:', err.message))
        })

      } catch (notifyErr) {
        console.error('Failed to send updateStatus notifications:', notifyErr)
      }
    })()

    res.status(200).json({
      message: 'Status updated successfully',
      issue
    })
  } catch (err) {
    console.error('Update status error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

//  Assign Officer (admin)
const assignOfficer = async (req, res) => {
  try {
    const { officerId } = req.body

    const issue = await Issue.findById(req.params.id).populate('reportedBy', 'name email')
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    if (issue.status === 'resolved') {
      return res.status(400).json({ message: 'Cannot assign an officer to a resolved issue.' })
    }

    const officer = await User.findById(officerId)
    if (!officer) {
      return res.status(404).json({ message: 'Officer not found' })
    }

    issue.assignedTo = officerId
    issue.status = 'assigned'
    issue.ward = officer.ward
    await issue.save()

    // Fire-and-forget notifications
    ;(async () => {
      try {
        const query = {
          $or: [
            { role: 'super_admin' },
            { role: 'admin', district: issue.district }
          ]
        }
        const admins = await User.find(query)

        const targets = [
          { id: officerId, message: `You have been assigned a new issue: "${issue.title}"`, type: 'assigned' },
          { id: issue.reportedBy._id, message: `An officer has been assigned to your issue: "${issue.title}"`, type: 'status_change' }
        ]

        admins.forEach(admin => {
          let message;
          if (admin.role === 'super_admin') {
            message = `Issue "${issue.title}" in ${issue.district || 'unknown district'} was assigned to an officer`
          } else {
            message = `Issue "${issue.title}" was assigned to an officer`
          }
          targets.push({ id: admin._id, message, type: 'status_change' })
        })

        const notifications = targets.map(t => ({
          userId: t.id,
          issueId: issue._id,
          message: t.message,
          type: t.type
        }))

        if (notifications.length > 0) {
          const savedNotifs = await Notification.insertMany(notifications)
          const populatedNotifs = await Notification.populate(savedNotifs, { path: 'issueId', select: 'title status' })
          populatedNotifs.forEach(n => {
            if (req.io) {
              req.io.to(n.userId.toString()).emit('notification', n)
            }
          })
        }

        // Send email to the citizen reporting the issue
        if (issue.reportedBy && issue.reportedBy.email) {
          sendStatusUpdateEmail(
            issue.reportedBy.email,
            issue.reportedBy.name,
            issue.title,
            'assigned'
          ).catch(err => console.error('Citizen status assignment email failed:', err.message))
        }

        // Send email to the assigned officer
        const locationStr = `${issue.location.address || ''}, ${issue.location.city || ''}, ${issue.location.state || ''}`
        sendIssueAssignedOfficerEmail(
          officer.email,
          officer.name,
          issue.title,
          issue.category,
          locationStr
        ).catch(err => console.error('Officer assignment email failed:', err.message))

        // Send email to all relevant admins / super admins
        admins.forEach(admin => {
          sendIssueAssignedAdminEmail(
            admin.email,
            admin.name,
            issue.title,
            officer.name,
            issue.district
          ).catch(err => console.error('Admin assignment email failed:', err.message))
        })

      } catch (notifyErr) {
        console.error('Failed to send assignOfficer notifications:', notifyErr)
      }
    })()

    res.status(200).json({
      message: 'Officer assigned successfully',
      issue
    })
  } catch (err) {
    console.error('Assign officer error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

//  Toggle Upvote (citizen) 
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

//  Delete Issue (admin) 
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    // Delete all photos from Cloudinary before deleting issue
    if (issue.photos && issue.photos.length > 0) {
      const deletePromises = issue.photos.map(photoUrl => {
        const urlParts = photoUrl.split('/')
        const filename = urlParts[urlParts.length - 1]
        const folder = urlParts[urlParts.length - 2]
        const publicId = `${folder}/${filename.split('.')[0]}`
        return cloudinary.uploader.destroy(publicId)
      })
      await Promise.allSettled(deletePromises)
    }

    // Also delete resolution photo if exists
    if (issue.resolutionPhoto) {
      const urlParts = issue.resolutionPhoto.split('/')
      const filename = urlParts[urlParts.length - 1]
      const folder = urlParts[urlParts.length - 2]
      const publicId = `${folder}/${filename.split('.')[0]}`
      await cloudinary.uploader.destroy(publicId).catch(err =>
        console.error('Failed to delete resolution photo:', err.message)
      )
    }

    // Now delete from MongoDB
    await Issue.findByIdAndDelete(req.params.id)
    await Notification.deleteMany({ issueId: req.params.id })

    res.status(200).json({ message: 'Issue and images deleted successfully' })

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
  deleteIssue,
  getAssignedIssues
}