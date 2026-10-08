declare const process: any;

export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  '/api/v1';
export const API_URL = API_BASE_URL;

export class ApiRequestError extends Error {
  status: number;
  errors: any[];
  data: any;

  constructor(message: string, status: number = 0, errors: any[] = [], data: any = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

export function toQueryString(params: Record<string, any> = {}): string {
  if (!params || typeof params !== 'object') return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

function getCsrfTokenFromCookie(): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)cf_csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private getAuthToken(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('vpd_access_token') ||
        sessionStorage.getItem('vpd_access_token');
      // 'vpd_session_token' is a local placeholder; actual auth uses httpOnly cookies
      if (token === 'vpd_session_token') return null;
      return token;
    } catch {
      return null;
    }
  }

  async request<T = any>(endpoint: string, options: RequestInit & { params?: any; token?: string; headers?: any } = {}): Promise<T> {
    let url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    if (options.params && typeof options.params === 'object') {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    const token = options.token || this.getAuthToken();
    const csrfToken = getCsrfTokenFromCookie();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    // If uploading FormData, delete Content-Type to allow boundary header
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Auto-refresh token on 401 if not already an auth endpoint
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      try {
        const refreshCsrf = getCsrfTokenFromCookie();
        const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(refreshCsrf ? { 'X-CSRF-Token': refreshCsrf } : {}),
          },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          // Retry original request with newly issued cookie/csrf token
          const retryCsrf = getCsrfTokenFromCookie();
          const retryHeaders = {
            ...headers,
            ...(retryCsrf ? { 'X-CSRF-Token': retryCsrf } : {}),
          };
          response = await fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
          });
        }
      } catch {
        // Refresh failed, continue with original 401 response
      }
    }

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage = data?.message;
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        const errorDetails = data.errors
          .map((e: any) => `${e.field ? `${e.field.replace(/^body\./, '')}: ` : ''}${e.message}`)
          .join(', ');
        errorMessage = errorMessage ? `${errorMessage}: ${errorDetails}` : errorDetails;
      }
      errorMessage =
        errorMessage ||
        (typeof data === 'string' && data.length < 200 ? data : `Request failed with status ${response.status}`);
      const error: any = new ApiRequestError(errorMessage, response.status, data?.errors || [], data);
      throw error;
    }

    return data;
  }

  get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T = any>(endpoint: string, options?: RequestInit) {
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
