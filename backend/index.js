const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()

const { apiLimiter } = require('./middleware/rateLimiter')

const app = express()
const server = http.createServer(app)

//  Socket.io 
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
})

//  Middleware
app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())
app.use(morgan('dev'))
app.use('/api', apiLimiter)

app.use((req, res, next) => {
  req.io = io
  next()
})

//  Routes 
app.use('/api/auth', require('./routes/auth'))
app.use('/api/issues', require('./routes/issue'))
app.use('/api/users', require('./routes/user'))
app.use('/api/notifications', require('./routes/notification'))
app.use('/api/analytics', require('./routes/analytics'))

//  Socket 
require('./socket')(io)

//  Health Check 
app.get('/', (req, res) => {
  res.json({ message: 'CivicPulse API is running!' })
})

//  MongoDB + Server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { 
    console.log('MongoDB connected successfully')
    server.listen(process.env.PORT || 5000, () => {
      console.log(`CivicPulse server running on port ${process.env.PORT || 5000}`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
  })