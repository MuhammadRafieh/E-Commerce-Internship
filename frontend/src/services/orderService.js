import api from './api'

export const orderService = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/mine'),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  markAsPaid: (id) => api.put(`/orders/${id}/pay`),
}
