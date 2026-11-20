interface ApiRequestOptions {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method?: string;
  portalToken?: string;
  teamAccessToken?: string;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.portalToken) headers.set('X-Portal-Token', options.portalToken);
  if (options.teamAccessToken) {
    headers.set('Authorization', `Bearer ${options.teamAccessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method || (hasBody ? 'POST' : 'GET'),
      headers,
      body: options.body,
    });
  } catch {
    throw new ApiRequestError(
      'The API could not be reached. Check the connection and API service configuration.',
      0
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : `The request failed (${response.status}). Please try again.`;
    throw new ApiRequestError(message, response.status);
  }
  return payload as T;
}
