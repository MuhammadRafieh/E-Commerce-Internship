import { useRef, useEffect, useState } from 'react'
import { useAnimationFrame, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'

const CARD_W = 200
const CARD_H = 280
const GAP = 24
const STEP = CARD_W + GAP
const ARC_H = 90

export default function ProductWheel({ products = [] }) {
  const scrollRef = useRef(0)
  const cardsRef = useRef([])
  const [vw, setVw] = useState(1200)

  useEffect(() => {
    const update = () => setVw(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const items = [...products, ...products, ...products]
  const oneSet = products.length * STEP

  useAnimationFrame((t, delta) => {
    if (products.length === 0) return
    scrollRef.current -= 0.5

    if (scrollRef.current <= -oneSet) {
      scrollRef.current += oneSet
    }

    const halfW = vw * 0.45

    for (let i = 0; i < items.length; i++) {
      const el = cardsRef.current[i]
      if (!el) continue

      const screenX = i * STEP + scrollRef.current

      if (screenX < -CARD_W || screenX > vw + CARD_W) {
        el.style.display = 'none'
        continue
      }
      el.style.display = 'block'

      const cardCenter = screenX + CARD_W / 2
      const dist = Math.abs(cardCenter - vw / 2) / halfW
      const clamped = Math.max(0, Math.min(1, dist))

      const arcY = -(1 - clamped) * ARC_H
      const baseY = 200 - CARD_H / 2
      const scale = 0.6 + (1 - clamped) * 0.4
      const opacity = 0.25 + (1 - clamped) * 0.75

      el.style.transform = `translate3d(${screenX}px, ${baseY + arcY}px, 0) scale(${scale})`
      el.style.opacity = opacity
      el.style.zIndex = Math.round(scale * 100)
    }
  })

  if (!products || products.length === 0) return null

  return (
    <section className="relative overflow-hidden select-none bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Animated ambient glow */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
        animate={{
          x: ['0%', '30%', '-10%', '20%', '0%'],
          y: ['0%', '-20%', '30%', '10%', '0%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute -bottom-1/2 -right-1/2 w-3/4 h-3/4 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        animate={{
          x: ['0%', '-20%', '30%', '-10%', '0%'],
          y: ['0%', '30%', '-20%', '-10%', '0%'],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative mx-auto" style={{ height: 400 }}>
        {/* Cards */}
        {items.map((product, i) => (
          <div
            key={`${product.id}-${i}`}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="absolute left-0 top-0 will-change-transform"
            style={{ width: CARD_W, height: CARD_H }}
          >
            <Link
              to={`/product/${product.id}`}
              className="block w-full h-full rounded-2xl overflow-hidden
                         bg-white/[0.08] backdrop-blur-xl
                         border border-white/15 shadow-xl
                         hover:border-white/30 hover:bg-white/[0.12]
                         transition-all duration-300 group"
            >
              <div className="aspect-[4/5] overflow-hidden bg-gray-800/50">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-white/90 truncate leading-tight">
                  {product.name}
                </p>
                <p className="text-sm font-bold text-primary-300 mt-1">
                  {formatCurrency(product.price)}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
