const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { authLimiter } = require('../middleware/rateLimiter')
const validate = require('../middleware/validate')
const {
  register,
  login,
  forgotPassword,
  resetPassword
} = require('../controllers/auth')

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2 to 50 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role').optional()
    .isIn(['citizen', 'officer']).withMessage('Role must be citizen or officer')
]

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
]

const forgotPasswordRules = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
]

const resetPasswordRules = [
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
]

router.post('/register', authLimiter, registerRules, validate, register)
router.post('/login', authLimiter, loginRules, validate, login)
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, forgotPassword)
router.post('/reset-password', authLimiter, resetPasswordRules, validate, resetPassword)

module.exports = router