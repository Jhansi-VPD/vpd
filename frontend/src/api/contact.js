import { apiRequest } from './client';

export function submitContactForm(payload) {
  return apiRequest('/contact', { method: 'POST', body: payload });
}
