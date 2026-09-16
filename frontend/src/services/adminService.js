import api from './api'

export const adminService = {
  getSalesAnalytics: () => api.get('/admin/sales-analytics'),
  getCoupons: () => api.get('/coupons'),
  createCoupon: (data) => api.post('/coupons', data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
  toggleCoupon: (id) => api.patch(`/coupons/${id}/toggle`),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
}
