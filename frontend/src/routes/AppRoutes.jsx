import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Home from '../pages/Home'
import Shop from '../pages/Shop'
import ProductDetail from '../pages/ProductDetail'
import Cart from '../pages/Cart'
import Checkout from '../pages/Checkout'
import Login from '../pages/Login'
import Register from '../pages/Register'
import About from '../pages/About'
import Contact from '../pages/Contact'
import FAQs from '../pages/FAQs'
import MyProfile from '../pages/MyProfile'
import MyOrders from '../pages/MyOrders'
import OrderSuccess from '../pages/OrderSuccess'
import AdminDashboard from '../pages/AdminDashboard'
import AdminOrders from '../pages/AdminOrders'
import AdminSalesDashboard from '../pages/AdminSalesDashboard'
import AdminCoupons from '../pages/AdminCoupons'
import NotFound from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faqs" element={<FAQs />} />

        {/* Protected — require auth */}
        <Route path="/profile" element={<ProtectedRoute requireAdmin={false}><MyProfile /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute requireAdmin={false}><MyOrders /></ProtectedRoute>} />
        <Route path="/order-success" element={<OrderSuccess />} />

        {/* Admin — protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute requireAdmin>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sales"
          element={
            <ProtectedRoute requireAdmin>
              <AdminSalesDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute requireAdmin>
              <AdminCoupons />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
