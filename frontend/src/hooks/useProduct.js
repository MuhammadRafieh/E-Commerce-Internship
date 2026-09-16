import { useState, useEffect } from 'react'
import { productService } from '../services/productService'

export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    productService
      .getById(id)
      .then((res) => setProduct(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id])

  return { product, loading, error }
}
