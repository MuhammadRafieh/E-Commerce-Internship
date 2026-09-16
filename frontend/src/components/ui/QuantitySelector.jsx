import { Minus, Plus } from './Icons'

export default function QuantitySelector({ value, onChange, min = 1, max = 99 }) {
  const decrement = () => {
    if (value > min) onChange(value - 1)
  }

  const increment = () => {
    if (value < max) onChange(value + 1)
  }

  return (
    <div className="inline-flex items-center border border-night-600 rounded-lg overflow-hidden">
      <button
        onClick={decrement}
        disabled={value <= min}
        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:bg-white/15"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="w-10 text-center text-sm font-medium select-none text-gray-200" aria-live="polite">
        {value}
      </span>
      <button
        onClick={increment}
        disabled={value >= max}
        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:bg-white/15"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}