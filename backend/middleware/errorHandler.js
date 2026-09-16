export const errorHandler = (err, req, res, _next) => {
  console.error(err)

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ message: messages.join(', ') })
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate field value' })
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Server error',
  })
}
