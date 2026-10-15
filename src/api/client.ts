import { AxiosError, create, type AxiosAdapter } from 'axios';

import { mockAdapter } from '../mocks/mockServer';

/** Error shape the UI works with, whatever went wrong underneath. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;
    const serverMessage = (error.response?.data as { message?: string } | undefined)?.message;
    if (status === null) return new ApiError('Network error. Check your connection.', null);
    return new ApiError(serverMessage ?? `Request failed (${status})`, status);
  }
  return new ApiError('Something went wrong', null);
}

export function createApiClient(adapter: AxiosAdapter = mockAdapter, baseURL = '/api') {
  const client = create({ baseURL, adapter, timeout: 10_000 });
  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(toApiError(error)),
  );
  return client;
}

// Demo build: every request is answered by the in-app mock server. For a real backend,
// call createApiClient(undefined, process.env.EXPO_PUBLIC_API_URL) instead.
export const apiClient = createApiClient(mockAdapter, '');
