const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('crm_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, newPassword) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
  },

  // Users (Admin)
  getUsers: () => apiRequest('/users'),
  createUser: (userData) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  updateUser: (id, updates) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteUser: (id) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Customers
  getCustomers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/customers${q ? `?${q}` : ''}`);
  },
  getCustomerById: (id) => apiRequest(`/customers/${id}`),
  createCustomer: (customerData) =>
    apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),
  updateCustomer: (id, updates) =>
    apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteCustomer: (id) =>
    apiRequest(`/customers/${id}`, {
      method: 'DELETE',
    }),

  // Leads
  getLeads: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/leads${q ? `?${q}` : ''}`);
  },
  getLeadById: (id) => apiRequest(`/leads/${id}`),
  createLead: (leadData) =>
    apiRequest('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    }),
  updateLead: (id, updates) =>
    apiRequest(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  convertLead: (id) =>
    apiRequest(`/leads/${id}/convert`, {
      method: 'POST',
    }),
  deleteLead: (id) =>
    apiRequest(`/leads/${id}`, {
      method: 'DELETE',
    }),

  // Deals
  getDeals: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/deals${q ? `?${q}` : ''}`);
  },
  getDealById: (id) => apiRequest(`/deals/${id}`),
  createDeal: (dealData) =>
    apiRequest('/deals', {
      method: 'POST',
      body: JSON.stringify(dealData),
    }),
  updateDeal: (id, updates) =>
    apiRequest(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  updateDealStage: (id, stage) =>
    apiRequest(`/deals/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }),
  deleteDeal: (id) =>
    apiRequest(`/deals/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/tasks${q ? `?${q}` : ''}`);
  },
  createTask: (taskData) =>
    apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  toggleTaskComplete: (id, status) =>
    apiRequest(`/tasks/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(status ? { status } : {}),
    }),
  deleteTask: (id) =>
    apiRequest(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Notes
  getNotes: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/notes${q ? `?${q}` : ''}`);
  },
  createNote: (noteData) =>
    apiRequest('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    }),
  deleteNote: (id) =>
    apiRequest(`/notes/${id}`, {
      method: 'DELETE',
    }),

  // Dashboard & Activity Logs
  getDashboardSummary: () => apiRequest('/dashboard/summary'),
  getActivityLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/activity-logs${q ? `?${q}` : ''}`);
  },

  // Reports
  getReportsSummary: () => apiRequest('/reports/summary'),
  getExportCSVUrl: () => `${API_BASE_URL}/reports/export`,

  // Settings
  getSettings: () => apiRequest('/settings'),
  updateBranchSettings: (data) =>
    apiRequest('/settings/branch', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateSecuritySettings: (data) =>
    apiRequest('/settings/security', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateNotificationSettings: (data) =>
    apiRequest('/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changePassword: (currentPassword, newPassword) =>
    apiRequest('/settings/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Global Search
  search: (query) => apiRequest(`/search?q=${encodeURIComponent(query)}`),
};
