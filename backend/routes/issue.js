const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const verifyToken = require('../middleware/verifyToken')
const checkRole = require('../middleware/checkRole')
const validate = require('../middleware/validate')
const upload = require('../utils/multer')
const {
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
} = require('../controllers/issue')

const createIssueRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be 5 to 100 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be 10 to 1000 characters'),
  body('category').notEmpty().withMessage('Category is required')
    .isIn(['pothole', 'garbage', 'streetlight', 'water', 'sewage', 'other'])
    .withMessage('Invalid category'),
  body('lat').notEmpty().withMessage('Latitude is required')
    .isFloat({ min: 6.0, max: 37.6 }).withMessage('Invalid latitude for India'),
  body('lng').notEmpty().withMessage('Longitude is required')
    .isFloat({ min: 68.0, max: 97.4 }).withMessage('Invalid longitude for India'),
  body('address').trim().notEmpty().withMessage('Address is required')
]

const updateStatusRules = [
  body('newStatus').notEmpty().withMessage('Status is required')
    .isIn(['under_review', 'assigned', 'in_progress', 'resolved'])
    .withMessage('Invalid status value')
]

const assignOfficerRules = [
  body('officerId').notEmpty().withMessage('Officer ID is required')
    .isMongoId().withMessage('Invalid officer ID')
]

// Public
router.get('/public', getPublicIssues)

// Citizen
router.post('/', verifyToken, checkRole('citizen'),
  upload.array('photos', 3), createIssueRules, validate, createIssue)
router.get('/mine', verifyToken, checkRole('citizen'), getMyIssues)
router.patch('/:id/upvote', verifyToken, checkRole('citizen'), toggleUpvote)

// Officer
router.get('/ward/:wardId', verifyToken, checkRole('officer'), getWardIssues)
router.patch('/:id/status', verifyToken, checkRole('officer'),
  updateStatusRules, validate, updateStatus)

// Admin
router.get('/', verifyToken, checkRole('admin'), getAllIssues)
router.patch('/:id/assign', verifyToken, checkRole('admin'),
  assignOfficerRules, validate, assignOfficer)
router.delete('/:id', verifyToken, checkRole('admin'), deleteIssue)

// Any logged in user
router.get('/:id', verifyToken, getIssueById)

module.exports = router