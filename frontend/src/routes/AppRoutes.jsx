import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProtectedRoute from '../components/auth/ProtectedRoute'

/* Pages are code-split so the initial bundle only carries what the first
   route needs. Layout/ProtectedRoute stay eager to keep the shell instant. */
const Home = lazy(() => import('../pages/Home'))
const Shop = lazy(() => import('../pages/Shop'))
const ProductDetail = lazy(() => import('../pages/ProductDetail'))
const Cart = lazy(() => import('../pages/Cart'))
const Checkout = lazy(() => import('../pages/Checkout'))
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/ResetPassword'))
const About = lazy(() => import('../pages/About'))
const Contact = lazy(() => import('../pages/Contact'))
const FAQs = lazy(() => import('../pages/FAQs'))
const MyProfile = lazy(() => import('../pages/MyProfile'))
const MyOrders = lazy(() => import('../pages/MyOrders'))
const OrderSuccess = lazy(() => import('../pages/OrderSuccess'))
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'))
const AdminOrders = lazy(() => import('../pages/AdminOrders'))
const AdminSalesDashboard = lazy(() => import('../pages/AdminSalesDashboard'))
const AdminCoupons = lazy(() => import('../pages/AdminCoupons'))
const NotFound = lazy(() => import('../pages/NotFound'))

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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
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
