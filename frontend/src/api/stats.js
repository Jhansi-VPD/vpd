import { apiRequest } from './client';

export function getStats() {
  return apiRequest('/stats');
}

export function exportMyData(token) {
  return apiRequest('/users/me/export', { token });
}

export function deleteMyData(token) {
  return apiRequest('/users/me', { method: 'DELETE', token });
}
