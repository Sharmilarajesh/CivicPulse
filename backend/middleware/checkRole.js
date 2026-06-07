const checkRole = (...roles) => {
  return (req, res, next) => {
    // Super admin bypasses all role restrictions
    if (req.user.role === 'super_admin') {
      return next()
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient role.' 
      })
    }
    next()
  }
}

module.exports = checkRole