import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from '../components/ui/Icons'

const faqGroups = [
  {
    title: 'Orders',
    items: [
      { q: 'How do I place an order?', a: 'Browse our shop, add items to your cart, and proceed to checkout. You\'ll need to create an account or sign in to complete your purchase.' },
      { q: 'Can I modify or cancel my order?', a: 'You can modify or cancel your order within 1 hour of placing it. Contact our support team with your order number for assistance.' },
      { q: 'How do I track my order?', a: 'Once your order ships, you\'ll receive a tracking number via email. You can also view your order status in your account dashboard.' },
    ],
  },
  {
    title: 'Shipping & Delivery',
    items: [
      { q: 'What are the shipping options?', a: 'We offer standard (5-7 business days) and express (2-3 business days) shipping. Free standard shipping on orders over Rs 50.' },
      { q: 'Do you ship internationally?', a: 'Yes, we ship to over 30 countries. International delivery takes 7-14 business days and costs vary by destination.' },
      { q: 'What if my package is lost or damaged?', a: 'If your package is lost or arrives damaged, contact us within 48 hours of delivery. We\'ll send a replacement or issue a full refund.' },
    ],
  },
  {
    title: 'Returns & Exchanges',
    items: [
      { q: 'What is your return policy?', a: 'We accept returns within 30 days of delivery. Items must be unused and in original packaging. We\'ll refund the full purchase price.' },
      { q: 'How do I start a return?', a: 'Log into your account, go to your orders, and select "Return" on the item you want to return. Print the prepaid shipping label and drop it off.' },
      { q: 'How long do refunds take?', a: 'Refunds are processed within 5-7 business days after we receive your return. The amount will be credited to your original payment method.' },
    ],
  },
  {
    title: 'Payment',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, American Express, PayPal, and Apple Pay. All transactions are SSL encrypted.' },
      { q: 'Is my payment information secure?', a: 'Absolutely. We use industry-standard SSL encryption and never store your full card details on our servers.' },
      { q: 'Do you offer discounts or promo codes?', a: 'Yes! Subscribe to our newsletter for exclusive deals and promo codes. You can apply promo codes at checkout.' },
    ],
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-night-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-white hover:bg-white/5 transition-colors"
      >
        {q}
        <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed animate-fade-in">
          {a}
        </div>
      )}
    </div>
  )
}

export default function FAQs() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-200 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-100 font-medium">FAQs</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-500 mb-10">Quick answers to common questions.</p>

      <div className="space-y-8">
        {faqGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-lg font-semibold text-white mb-4">{group.title}</h2>
            <div className="space-y-3">
              {group.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
