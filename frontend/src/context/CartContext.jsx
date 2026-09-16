import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'ecommerce_cart'
const CART_VERSION = 2

const INITIAL = { version: CART_VERSION, items: [], coupon: null, discount: 0 }

function sanitizeItems(items) {
  return items.filter((i) => i && i.product && Number(i.price) > 0).map((i) => ({
    ...i,
    price: Number(i.price) || 0,
    quantity: Math.max(1, Number(i.quantity) || 1),
  }))
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === CART_VERSION && Array.isArray(parsed.items)) {
        return { ...parsed, items: sanitizeItems(parsed.items) }
      }
    }
  } catch {
    /* corrupted data — reset */
  }
  return { ...INITIAL }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity } = action.payload
      const existing = state.items.find((i) => i.product === product)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product === product
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          ),
        }
      }
      return { ...state, items: [...state.items, action.payload] }
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter((i) => i.product !== action.payload),
      }

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.product === action.payload.product
            ? { ...i, quantity: action.payload.quantity }
            : i,
        ),
      }

    case 'CLEAR_CART':
      return { ...INITIAL }

    case 'APPLY_COUPON':
      return {
        ...state,
        coupon: action.payload.coupon,
        discount: action.payload.discount,
      }

    case 'REMOVE_COUPON':
      return { ...state, coupon: null, discount: 0 }

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, null, loadCart)

  /* persist on every state change */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or unavailable — silently ignore */
    }
  }, [state])

  const addToCart = useCallback((product, quantity, name, price, image) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { product, quantity, name, price, image },
    })
  }, [])

  const removeFromCart = useCallback((productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId })
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { product: productId, quantity },
    })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const applyCoupon = useCallback((coupon, discount) => {
    dispatch({ type: 'APPLY_COUPON', payload: { coupon, discount } })
  }, [])

  const removeCoupon = useCallback(() => {
    dispatch({ type: 'REMOVE_COUPON' })
  }, [])

  const totalItems = state.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  const totalPrice = state.items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0,
  )

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        coupon: state.coupon,
        discount: state.discount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
