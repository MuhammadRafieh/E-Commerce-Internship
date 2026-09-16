import Category from '../models/Category.js'

export const getCategories = async (req, res) => {
  const categories = await Category.find().sort('name')
  res.json(categories)
}

export const createCategory = async (req, res) => {
  const { name, image } = req.body
  const slug = name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')

  const existing = await Category.findOne({ slug })
  if (existing) {
    return res.status(400).json({ message: 'Category already exists' })
  }

  const category = await Category.create({ name, slug, image })
  res.status(201).json(category)
}

export const updateCategory = async (req, res) => {
  const { name, image } = req.body
  const update = {}
  if (name) {
    update.name = name
    update.slug = name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')
  }
  if (image) update.image = image

  const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
  if (!category) {
    return res.status(404).json({ message: 'Category not found' })
  }
  res.json(category)
}

export const deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) {
    return res.status(404).json({ message: 'Category not found' })
  }
  res.json({ message: 'Category deleted' })
}
