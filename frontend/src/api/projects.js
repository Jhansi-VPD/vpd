import { apiRequest, toQueryString } from './client';

export function fetchProjects({ industry, ...rest } = {}) {
  const params = { limit: 12, ...rest };
  if (industry && industry !== 'All') params.industry = industry;
  return apiRequest(`/projects${toQueryString(params)}`);
}
