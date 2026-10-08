export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface RequestOptions extends RequestInit {
  params?: Record<string, unknown>;
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') qs.append(key, String(item));
      });
    } else {
      qs.append(key, String(value));
    }
  });
  return qs.toString();
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    } catch {
      return null;
    }
  }

  /** Double-submit CSRF: backend sets the non-httpOnly cf_csrf_token cookie at
   * login and rejects state-changing cookie-auth requests without a matching
   * X-CSRF-Token header (backend/app/core/csrf.py). */
  private getCsrfToken(): string | null {
    try {
      const match = document.cookie.match(/(?:^|;\s*)cf_csrf_token=([^;]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  }

  private buildRequest(endpoint: string, options: RequestOptions = {}) {
    const { params, ...fetchOptions } = options;
    let url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const query = buildQueryString(params);
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
    const token = this.getAuthToken();
    const csrfToken = this.getCsrfToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    // If uploading FormData, delete Content-Type to allow boundary header
    if (fetchOptions.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    return {
      url,
      fetchOptions: { ...fetchOptions, headers, credentials: 'include' as RequestCredentials },
    };
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { url, fetchOptions } = this.buildRequest(endpoint, options);
    const response = await fetch(url, fetchOptions);

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.errors?.[0]?.message || `Request failed with status ${response.status}`;
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  /** Raw Response — used for file downloads where headers (Content-Disposition)
   * and the body stream matter and must not be pre-parsed. */
  async getResponse(endpoint: string, options: RequestOptions = {}): Promise<Response> {
    const { url, fetchOptions } = this.buildRequest(endpoint, { ...options, method: 'GET' });
    return fetch(url, fetchOptions);
  }

  get<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

export async function apiRequest(endpoint: string, options: any = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body;
  if (method === 'GET') return apiClient.get(endpoint, options);
  if (method === 'POST') return apiClient.post(endpoint, body, options);
  if (method === 'PUT') return apiClient.put(endpoint, body, options);
  if (method === 'PATCH') return apiClient.patch(endpoint, body, options);
  if (method === 'DELETE') return apiClient.delete(endpoint, options);
  return apiClient.request(endpoint, options);
}

export default apiClient;
