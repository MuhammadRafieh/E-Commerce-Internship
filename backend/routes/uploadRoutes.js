import { Router } from 'express'
import { upload } from '../config/upload.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

router.post('/', protect, adminOnly, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large — max 5MB'
          : err.message || 'Upload failed'
      return res.status(400).json({ message })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' })
    }
    const url = `/uploads/${req.file.filename}`
    res.json({ url })
  })
})

export default router
