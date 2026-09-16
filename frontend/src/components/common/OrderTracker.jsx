import { Package, Check, Truck, MapPin, User, Home } from '../ui/Icons'

const ORDER_STEPS = [
  { key: 'ordered', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'arrived_at_city', label: 'Arrived at City', icon: MapPin },
  { key: 'assigned_to_rider', label: 'Assigned to Rider', icon: User },
  { key: 'delivered', label: 'Delivered', icon: Home },
]

const STATUS_LABELS = {
  ordered: 'Order Placed',
  confirmed: 'Confirmed',
  dispatched: 'Dispatched',
  arrived_at_city: 'Arrived at City',
  assigned_to_rider: 'Assigned to Rider',
  delivered: 'Delivered',
}

export default function OrderTracker({ status = 'ordered', statusHistory = [] }) {
  const currentIdx = ORDER_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="py-4">
      <div className="relative">
        {ORDER_STEPS.map((step, idx) => {
          const Icon = step.icon
          const isCompleted = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isFuture = idx > currentIdx

          const historyEntry = statusHistory.find((h) => h.status === step.key)
          const timestamp = historyEntry?.timestamp

          return (
            <div key={step.key} className="flex items-start gap-3 pb-6 last:pb-0 relative">
              {idx < ORDER_STEPS.length - 1 && (
                <div
                  className={`absolute left-[15px] top-8 w-0.5 h-full -translate-x-1/2 ${
                    idx < currentIdx ? 'bg-green-500' : 'bg-night-600'
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-primary-600 text-white ring-4 ring-primary-500/30 animate-pulse'
                      : 'bg-night-800 text-gray-500'
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="pt-0.5 flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                {timestamp && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(timestamp).toLocaleDateString('en-PK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                {historyEntry?.note && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">{historyEntry.note}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ORDER_STEPS, STATUS_LABELS }
