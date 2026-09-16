import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Mail, MapPin, Phone, ChevronRight } from '../ui/Icons'
import { categoryService } from '../../services/categoryService'

const staticSections = [
  {
    title: 'Support',
    links: [
      { name: 'Contact Us', path: '/contact' },
      { name: 'FAQs', path: '/faqs' },
      { name: 'Shipping & Returns', path: '/shipping' },
      { name: 'Size Guide', path: '/size-guide' },
      { name: 'Warranty', path: '/warranty' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '/careers' },
      { name: 'Press', path: '/press' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
    ],
  },
]

export default function Footer() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    categoryService.getAll().then((res) => setCategories(res.data)).catch(() => {})
  }, [])

  const shopLinks = categories.map((cat) => ({
    name: cat.name,
    path: `/shop?category=${cat.slug}`,
  }))

  const footerSections = [
    ...(shopLinks.length > 0 ? [{ title: 'Shop', links: shopLinks }] : []),
    ...staticSections,
  ]
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Store</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mb-6">
              Premium e-commerce destination for curated products. We bring you the best
              selection with exceptional service and fast worldwide shipping.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-primary-500 shrink-0" />
                <span>6 Noor Chamber, Bangali gali Ganpat road Urdu bazar Lahore</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-primary-500 shrink-0" />
                <span>+92 321 4469509</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-primary-500 shrink-0" />
                <span>rafieh123456@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-400 hover:text-primary-300 transition-colors inline-flex items-center gap-1 group"
                    >
                      <ChevronRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold">Stay in the loop</h3>
              <p className="text-sm text-gray-400 mt-1">Subscribe for exclusive deals and new arrivals.</p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full sm:w-auto gap-2"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 sm:w-64 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors active:scale-[0.97]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Store. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-primary-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-300 transition-colors">Terms</Link>
            <Link to="/shipping" className="hover:text-primary-300 transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
