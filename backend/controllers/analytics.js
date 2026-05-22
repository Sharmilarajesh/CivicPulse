const Issue = require('../models/Issue')

// ─── Get Summary ──────────────────────────────────────────
const getSummary = async (req, res) => {
  try {
    const byStatus = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const byCategory = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    const total = await Issue.countDocuments()

    res.status(200).json({ byStatus, byCategory, total })
  } catch (err) {
    console.error('Get summary error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// ─── Get Resolution Time ──────────────────────────────────
const getResolutionTime = async (req, res) => {
  try {
    const resolvedIssues = await Issue.find({ status: 'resolved' })

    const wardMap = {}

    resolvedIssues.forEach(issue => {
      const ward = issue.ward || 'Unknown'
      const hours = (new Date(issue.updatedAt) - new Date(issue.createdAt)) / (1000 * 60 * 60)

      if (!wardMap[ward]) {
        wardMap[ward] = { totalHours: 0, count: 0 }
      }

      wardMap[ward].totalHours += hours
      wardMap[ward].count += 1
    })

    const result = Object.keys(wardMap).map(ward => ({
      ward,
      avgHours: Math.round(wardMap[ward].totalHours / wardMap[ward].count),
      totalResolved: wardMap[ward].count
    }))

    res.status(200).json(result)
  } catch (err) {
    console.error('Get resolution time error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

module.exports = { getSummary, getResolutionTime }