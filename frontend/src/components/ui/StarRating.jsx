import { Star } from './Icons'

export default function StarRating({ rating = 0, size = 16, showValue = true }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75
  const rounded = Math.round(rating)

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`transition-colors ${
              star <= rounded
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-500 text-gray-500'
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-400 font-medium">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}
