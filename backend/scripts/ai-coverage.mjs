/* Coverage check: can a shopper find each product the way a human would ask?
   Run: npm run test:ai
   Reports any product with no plausible query that reaches it. */
import { answer } from '../utils/nlp/engine.js'
import Product from '../models/Product.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

/* Plausible phrasings per product — written the way a person would type,
   not the way the database is structured. */
const PROBES = {
  /* Note: "gold necklace" is deliberately NOT probed. This product's
     description is "orignal" and never states a material or colour, so the
     engine is right to exclude it when asked for gold — that would be a
     guess. Probing it would assert the wrong behaviour. */
  necklace: ['necklace', 'show me jewelry', 'jewellery', 'necklace under 20000'],
  'Cricket bat': ['cricket bat', 'sports equipment', 'bat under 2000'],
  TV: ['tv', 'television', 'big screen tv', 'show me electronics'],
  'Hydrating Hyaluronic Acid Serum': ['face serum', 'skincare', 'beauty products', 'serum under 1000'],
  'Premium Yoga Mat - Extra Thick': ['yoga mat', 'exercise mat', 'workout gear'],
  'The Art of Clean Code — Hardcover': ['clean code book', 'programming books', 'a book about code'],
  'Portable Bluetooth Speaker': ['bluetooth speaker', 'portable speaker', 'speaker under 500'],
  'Ceramic Pour-Over Coffee Set': ['coffee set', 'pour over coffee', 'kitchen items'],
  'Minimalist Leather Watch': ['leather watch', 'wrist watch', 'watch under 500'],
  'Slim Fit Organic Cotton T-Shirt': ['t-shirt', 'tshirt', 'cotton shirt', 'slim fit tee'],
  'Wireless Noise-Cancelling Headphones': ['wireless headphones', 'noise cancelling headphones', 'headphones under 500'],
}

await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce')
const products = await Product.find({}).lean()

let reachable = 0
const unreachable = []

for (const p of products) {
  /* Normalise the key so an em dash in the probe map still matches the
     hyphen actually stored in the database. */
  const key = Object.keys(PROBES).find((k) => k.replace(/[—-]/g, '-') === p.name.replace(/[—-]/g, '-'))
  const probes = (key && PROBES[key]) || [p.name]
  const hits = []

  for (const q of probes) {
    const { products: found } = await answer(q)
    if (found.some((x) => x.id === String(p._id))) hits.push(q)
  }

  if (hits.length) {
    reachable++
    const missed = probes.filter((q) => !hits.includes(q))
    console.log(`  OK   ${p.name.padEnd(38)} ${hits.length}/${probes.length}`)
    for (const q of missed) console.log(`         missed: "${q}"`)
  } else {
    unreachable.push(p.name)
    console.log(`  FAIL ${p.name.padEnd(38)} none of: ${probes.map((q) => `"${q}"`).join(', ')}`)
  }
}

console.log(`\nreachable: ${reachable}/${products.length}`)
if (unreachable.length) {
  console.log(`unreachable: ${unreachable.join(', ')}`)
  process.exitCode = 1
}

await mongoose.disconnect()
