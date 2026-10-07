import { apiRequest, toQueryString } from './client';

export function fetchEvents(params = {}) {
  return apiRequest(`/events${toQueryString({ is_published: true, ...params })}`);
}
