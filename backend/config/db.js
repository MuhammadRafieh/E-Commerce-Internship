import mongoose from 'mongoose'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

export async function connectDB(retryCount = 0) {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce'

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log(`MongoDB connected: ${mongoose.connection.host}`)
  } catch (err) {
    console.error(`MongoDB connection attempt ${retryCount + 1} failed:`, err.message)

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`)
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      return connectDB(retryCount + 1)
    }

    console.error('All MongoDB connection attempts failed. Exiting.')
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message)
})

process.on('SIGINT', async () => {
  await mongoose.connection.close()
  console.log('MongoDB connection closed due to app termination')
  process.exit(0)
})
