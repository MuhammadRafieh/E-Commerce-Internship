import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const WishlistContext = createContext(null)
const STORAGE_KEY = 'ecommerce_wishlist'

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch { /* reset on corruption */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }
    catch { /* storage full */ }
  }, [items])

  const isWishlisted = useCallback((productId) =>
    items.some((i) => i.product === productId),
    [items],
  )

  const toggleWishlist = useCallback((product) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.product === product.id || i.product === product._id)
      if (exists) return prev.filter((i) => i.product !== (product.id || product._id))
      return [...prev, { product: product.id || product._id, name: product.name, price: product.price, image: product.image }]
    })
  }, [])

  const removeFromWishlist = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.product !== productId))
  }, [])

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggleWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
