import mongoose from 'mongoose'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import Product from './models/Product.js'
import Category from './models/Category.js'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce'

const defaultCategories = [
  { name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop' },
  { name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop' },
  { name: 'Home & Living', slug: 'home-living', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop' },
  { name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop' },
  { name: 'Sports', slug: 'sports', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop' },
  { name: 'Books', slug: 'books', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop' },
]

async function seed() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log(`Connected: ${mongoose.connection.host}`)

    /* Seed products */
    const data = readFileSync(join(__dirname, 'seed.json'), 'utf-8')
    const products = JSON.parse(data)

    console.log(`Clearing existing products...`)
    await Product.deleteMany({})

    console.log(`Inserting ${products.length} products...`)
    const inserted = await Product.insertMany(products)

    console.log(`\n✓ Seeded ${inserted.length} products successfully:`)
    inserted.forEach((p) => {
      console.log(`  • ${p.name} (Rs ${p.price}) — ${p.category}`)
    })

    /* Seed categories */
    console.log(`\nClearing existing categories...`)
    await Category.deleteMany({})

    console.log(`Inserting ${defaultCategories.length} categories...`)
    const cats = await Category.insertMany(defaultCategories)

    console.log(`\n✓ Seeded ${cats.length} categories:`)
    cats.forEach((c) => console.log(`  • ${c.name} (${c.slug})`))

    await mongoose.disconnect()
    console.log('\nDisconnected. Seed complete.')
    process.exit(0)
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
