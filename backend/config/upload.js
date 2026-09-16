import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase())
  const mimeOk = allowed.test(file.mimetype.split('/')[1])
  cb(null, extOk && mimeOk)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})
