const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type ApiOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
};

type ApiResponse<T> = { data: T };

export class ApiError extends Error {
  response?: { status: number; data: { detail: string } };

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.response = { status, data: { detail: message } };
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers = new Headers(options.headers || {});

  if (!token && typeof window !== 'undefined' && !path.startsWith('/auth/')) {
    throw new ApiError('Please sign in again before continuing.', 401);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {}

    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('auth-storage');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  return { data: await response.json() as T };
}

export const apiClient = {
  defaults: { baseURL: `${API_URL}/api/v1` },
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: any, config: { headers?: HeadersInit; onUploadProgress?: (event: { loaded: number; total?: number }) => void } = {}) => {
    if (body instanceof FormData) {
      const file = body.get('file');
      if (file instanceof File) {
        config.onUploadProgress?.({ loaded: file.size, total: file.size });
      }
    }
    return request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}), headers: config.headers });
  },
  patch: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
