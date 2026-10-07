import { apiRequest, toQueryString } from './client';

export function fetchServices(params = {}) {
  return apiRequest(`/services${toQueryString({ limit: 20, is_published: true, ...params })}`);
}
