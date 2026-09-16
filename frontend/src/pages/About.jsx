import { Link } from 'react-router-dom'
import { Shield, Package, Headphones, RefreshCw, MapPin } from '../components/ui/Icons'

const stats = [
  { label: 'Products', value: '10,000+' },
  { label: 'Happy Customers', value: '50,000+' },
  { label: 'Years in Business', value: '12+' },
  { label: 'Countries Served', value: '30+' },
]

const values = [
  { icon: Shield, title: 'Quality First', desc: 'We handpick every product to ensure premium quality and durability.' },
  { icon: Package, title: 'Fast Delivery', desc: 'Free shipping on orders over Rs 50 with delivery within 3-5 business days.' },
  { icon: Headphones, title: '24/7 Support', desc: 'Our support team is available around the clock to help with any questions.' },
  { icon: RefreshCw, title: 'Easy Returns', desc: 'Not satisfied? Return any item within 30 days for a full refund.' },
]

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-200 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-100 font-medium">About Us</span>
      </nav>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary-600 to-primary-800 mb-16">
        <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">Our Story</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto leading-relaxed">
            We believe everyone deserves access to quality products at fair prices. Founded in 2014,
            Store has grown from a small dream into a trusted destination for millions of shoppers.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {stats.map((s) => (
          <div key={s.label} className="text-center p-6 bg-night-900 rounded-xl border border-night-700 shadow-sm">
            <p className="text-3xl font-bold text-primary-400">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            To make quality products accessible to everyone by breaking down traditional retail barriers.
            We work directly with manufacturers and artisans to bring you the best prices without
            compromising on quality.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Every product on our platform is vetted by our team. We&apos;re committed to sustainable
            sourcing, fair labor practices, and reducing our environmental footprint.
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop"
            alt="Team working together"
            className="w-full h-72 object-cover"
          />
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">Why Shop With Us</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div key={v.title} className="p-6 bg-night-900 rounded-xl border border-night-700 shadow-sm hover:shadow-md hover:border-night-600 transition-all">
              <div className="w-10 h-10 bg-primary-500/15 rounded-xl flex items-center justify-center mb-4">
                <v.icon size={20} className="text-primary-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Visit Us */}
      <div className="mb-16 p-8 bg-night-900 rounded-2xl border border-night-700 shadow-sm">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">Visit Us</h2>
        <div className="flex items-start justify-center gap-3 text-gray-400">
          <MapPin size={20} className="text-primary-400 shrink-0 mt-0.5" />
          <p className="text-lg leading-relaxed">
            6 Noor Chamber, Bangali gali Ganpat road Urdu bazar Lahore
          </p>
        </div>
      </div>
    </div>
  )
}
