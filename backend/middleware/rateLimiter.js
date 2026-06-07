const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    message: 'Too many requests from this IP. Please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: {
    message: 'Too many login/register attempts. Please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = { apiLimiter, authLimiter }