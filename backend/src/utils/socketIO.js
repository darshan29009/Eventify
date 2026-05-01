const { Server } = require('socket.io')

let ioInstance = null

const getIO = () => {
  return ioInstance
}

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  })

  ioInstance = io

  // Authentication middleware for socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization

    if (!token) {
      return next(new Error('Authentication error'))
    }

    try {
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET)
      socket.userId = decoded.id
      socket.userRole = decoded.role
      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected to socket`)

    // Join room based on user ID for personal notifications
    socket.join(`user:${socket.userId}`)

    // Admin joins admin room
    if (socket.userRole === 'admin') {
      socket.join('admin-room')
    }

    // Employee joins employee room
    if (socket.userRole === 'employee') {
      socket.join('employee-room')
    }

    // Customer joins customer room
    if (socket.userRole === 'customer') {
      socket.join('customer-room')
    }

    // Join booking room for real-time updates
    socket.on('join-booking', (bookingId) => {
      socket.join(`booking:${bookingId}`)
      console.log(`User ${socket.userId} joined booking ${bookingId}`)
    })

    // Leave booking room
    socket.on('leave-booking', (bookingId) => {
      socket.leave(`booking:${bookingId}`)
      console.log(`User ${socket.userId} left booking ${bookingId}`)
    })

    // Join task room
    socket.on('join-task', (taskId) => {
      socket.join(`task:${taskId}`)
      console.log(`User ${socket.userId} joined task ${taskId}`)
    })

    // Notify booking update
    socket.on('notify-booking-update', (data) => {
      io.to(`booking:${data.bookingId}`).emit('booking-updated', data)
      console.log(`Booking ${data.bookingId} updated notification sent`)
    })

    // Notify task update
    socket.on('notify-task-update', (data) => {
      io.to(`task:${data.taskId}`).emit('task-updated', data)
      console.log(`Task ${data.taskId} updated notification sent`)
    })

    // Notify new task assigned
    socket.on('notify-task-assigned', (data) => {
      io.to(`user:${data.employeeId}`).emit('task-assigned', data)
      console.log(`Task assigned notification sent to employee ${data.employeeId}`)
    })

    // Notify payment received
    socket.on('notify-payment', (data) => {
      io.to(`booking:${data.bookingId}`).emit('payment-received', data)
      io.to(`user:${data.customerId}`).emit('payment-confirmation', data)
      console.log(`Payment notification sent for booking ${data.bookingId}`)
    })

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.userId} disconnected: ${reason}`)
    })
  })

  return io
}

module.exports = { setupSocketIO, getIO }
