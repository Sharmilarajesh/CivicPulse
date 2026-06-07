module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      socket.join(userId)
    })

    socket.on('disconnect', () => {
    })
  })
}