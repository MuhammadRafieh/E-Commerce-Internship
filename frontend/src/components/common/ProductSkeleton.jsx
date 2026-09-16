export function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-night-900 border border-night-700 animate-pulse">
      <div className="aspect-square bg-night-800 group-hover:scale-105 transition-transform duration-500" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-night-800 rounded-full w-3/4" />
        <div className="h-4 bg-night-800 rounded-full w-1/2" />
        <div className="h-3 bg-night-800 rounded-full w-1/4" />
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square bg-night-800 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-4 bg-night-800 rounded-full w-1/4" />
          <div className="h-8 bg-night-800 rounded-full w-3/4" />
          <div className="h-6 bg-night-800 rounded-full w-1/3" />
          <div className="space-y-2 pt-4">
            <div className="h-3 bg-night-800 rounded-full w-full" />
            <div className="h-3 bg-night-800 rounded-full w-full" />
            <div className="h-3 bg-night-800 rounded-full w-2/3" />
          </div>
          <div className="h-12 bg-night-800 rounded-xl w-full pt-4" />
        </div>
      </div>
    </div>
  )
}

export function ShopGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
