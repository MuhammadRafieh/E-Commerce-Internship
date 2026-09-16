import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Search, ShoppingBag, User, ChevronDown } from '../ui/Icons'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/shop' },
  { name: 'Deals', path: '/shop?deals=true' },
  { name: 'About', path: '/about' },
]

const adminLink = { name: 'Admin', path: '/admin' }

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { totalItems } = useCart()
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  const isActive = (linkPath) => {
    if (linkPath === '/') return pathname === '/'
    const [p, qs] = linkPath.split('?')
    if (pathname !== p) return false
    if (!qs) return !search
    const params = new URLSearchParams(qs)
    for (const [k, v] of params) {
      if (new URLSearchParams(search).get(k) !== v) return false
    }
    return true
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-gray-950 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors active:bg-white/15"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">Store</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'text-primary-300 bg-primary-500/15'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
            {isAdmin && (
              <>
                <Link
                  to={adminLink.path}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === '/admin'
                      ? 'text-primary-300 bg-primary-500/15'
                      : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/15'
                  }`}
                >
                  {adminLink.name}
                </Link>
                <Link
                  to="/admin/sales"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === '/admin/sales'
                      ? 'text-primary-300 bg-primary-500/15'
                      : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/15'
                  }`}
                >
                  Sales
                </Link>
                <Link
                  to="/admin/orders"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === '/admin/orders'
                      ? 'text-primary-300 bg-primary-500/15'
                      : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/15'
                  }`}
                >
                  Orders
                </Link>
                <Link
                  to="/admin/coupons"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === '/admin/coupons'
                      ? 'text-primary-300 bg-primary-500/15'
                      : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/15'
                  }`}
                >
                  Coupons
                </Link>
              </>
            )}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors active:bg-white/15 text-gray-300 hover:text-white"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Account */}
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors active:bg-white/15 text-gray-300 hover:text-white"
                >
                  <User size={20} />
                  <span className="text-sm font-medium hidden md:inline">{user.name}</span>
                  <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-xl border border-gray-700 py-1 z-20 animate-fade-in">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/5 hover:text-white" onClick={() => setUserMenuOpen(false)}>My Profile</Link>
                      <Link to="/orders" className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/5 hover:text-white" onClick={() => setUserMenuOpen(false)}>My Orders</Link>
                      <hr className="my-1 border-gray-700" />
                      <button onClick={() => { logout(); setUserMenuOpen(false) }} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300">Sign Out</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <User size={18} />
                <span className="hidden md:inline">Sign In</span>
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors active:bg-white/15 text-gray-300 hover:text-white"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full ring-2 ring-gray-950 animate-fade-in">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar dropdown */}
        {searchOpen && (
          <div className="pb-4 animate-slide-down">
            <form onSubmit={handleSearch} className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-gray-950 shadow-2xl animate-slide-right flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">Store</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors active:bg-white/15"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const active = isActive(link.path)
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        active
                          ? 'text-primary-300 bg-primary-500/15'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}
                {isAdmin && (
                  <>
                    <Link
                      to={adminLink.path}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        pathname === '/admin'
                          ? 'text-primary-300 bg-primary-500/15'
                          : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/15'
                      }`}
                    >
                      {adminLink.name}
                    </Link>
                    <Link
                      to="/admin/sales"
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        pathname === '/admin/sales'
                          ? 'text-primary-300 bg-primary-500/15'
                          : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/15'
                      }`}
                    >
                      Sales
                    </Link>
                    <Link
                      to="/admin/orders"
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        pathname === '/admin/orders'
                          ? 'text-primary-300 bg-primary-500/15'
                          : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/15'
                      }`}
                    >
                      Orders
                    </Link>
                    <Link
                      to="/admin/coupons"
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        pathname === '/admin/coupons'
                          ? 'text-primary-300 bg-primary-500/15'
                          : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/15'
                      }`}
                    >
                      Coupons
                    </Link>
                  </>
                )}
              </nav>
              <hr className="my-4 border-gray-800" />
              {user ? (
                <div className="space-y-1">
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-gray-300 rounded-lg hover:bg-white/5 hover:text-white">My Profile</Link>
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-gray-300 rounded-lg hover:bg-white/5 hover:text-white">My Orders</Link>
                  <button onClick={() => { logout(); setMobileOpen(false) }} className="block w-full text-left px-4 py-3 text-sm text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300">Sign Out</button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-white/5 hover:text-white"
                >
                  <User size={18} />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
