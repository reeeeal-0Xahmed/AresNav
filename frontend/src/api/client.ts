import {
  MarsLayersMap,
  Poi,
  SpaceWeather,
  MarsImage,
  TerrainMeta,
  RouteRequestPayload,
  RouteResponseSuccess,
  SavedRouteRecord,
} from './types';
import { MarsApiError, normalizeApiError } from './errors';
import { mockLayers } from '../mocks/mockLayers';
import { mockTerrain } from '../mocks/mockTerrain';
import { mockPois } from '../mocks/mockPois';
import { mockSpaceWeather } from '../mocks/mockSpaceWeather';
import { mockImages } from '../mocks/mockImages';
import { mockRouteSuccess, generateDynamicMockRoute } from '../mocks/mockRoutes';

/**
 * Checks if mock mode is forced via environment variable.
 * Defaults to true if VITE_USE_MOCK=true or in local dev when backend is absent.
 */
export function isMockModeConfigured(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true';
}

let mockModeOverride: boolean | null = null;

export function getEffectiveMockMode(): boolean {
  if (mockModeOverride !== null) return mockModeOverride;
  return isMockModeConfigured();
}

export function setMockMode(active: boolean): void {
  mockModeOverride = active;
}

/**
 * Reads and URL-decodes the Laravel XSRF-TOKEN cookie.
 */
export function getXsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

let csrfPromise: Promise<void> | null = null;

/**
 * Requests Laravel Sanctum CSRF cookie once before state-mutating requests.
 */
export async function ensureCsrfCookie(): Promise<void> {
  if (getEffectiveMockMode()) return;
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const res = await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        console.warn(`CSRF cookie request returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('Unable to initialize CSRF cookie. Server may be down:', err);
    }
  })();

  return csrfPromise;
}

/**
 * Unified fetch wrapper with credentials, CSRF, and error normalization.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isPostOrMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes((options.method || 'GET').toUpperCase());

  if (isPostOrMutating) {
    await ensureCsrfCookie();
  }

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (isPostOrMutating) {
    const xsrf = getXsrfToken();
    if (xsrf) {
      headers.set('X-XSRF-TOKEN', xsrf);
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw await normalizeApiError(response);
    }

    const json = await response.json();

    // Check for HTTP 200 with status: "error" (e.g. error_code: NO_PATH)
    if (json && json.status === 'error') {
      throw new MarsApiError({
        status: response.status,
        code: json.error_code || 'NO_PATH',
        message: json.message || 'No traversable path could be computed.',
      });
    }

    // Backend endpoints wrap data in { status: 'success', data: ... } or return payload directly
    if (json && json.status === 'success' && 'data' in json) {
      return json.data as T;
    }

    return json as T;
  } catch (error) {
    if (error instanceof MarsApiError) {
      throw error;
    }
    // Network or connection failure
    throw new MarsApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Mission control network connection failure.',
    });
  }
}

// ============================================================================
// Public API Methods
// ============================================================================

export async function getLayers(): Promise<MarsLayersMap> {
  if (getEffectiveMockMode()) {
    return Promise.resolve(mockLayers);
  }
  try {
    return await apiFetch<MarsLayersMap>('/mars/layers');
  } catch (err) {
    console.warn('Falling back to mock layers due to API failure:', err);
    return mockLayers;
  }
}

export async function getPois(): Promise<{ count: number; data: Poi[] }> {
  if (getEffectiveMockMode()) {
    return Promise.resolve({ count: mockPois.length, data: mockPois });
  }
  try {
    const res = await apiFetch<Poi[]>('/mars/science/pois');
    if (Array.isArray(res)) {
      return { count: res.length, data: res };
    }
    return res as unknown as { count: number; data: Poi[] };
  } catch (err) {
    console.warn('Falling back to mock POIs due to API failure:', err);
    return { count: mockPois.length, data: mockPois };
  }
}

export async function getSpaceWeather(): Promise<SpaceWeather> {
  if (getEffectiveMockMode()) {
    return Promise.resolve(mockSpaceWeather);
  }
  try {
    return await apiFetch<SpaceWeather>('/mars/space-weather');
  } catch (err) {
    console.warn('Falling back to mock space weather due to API failure:', err);
    return mockSpaceWeather;
  }
}

export async function getImages(): Promise<MarsImage[]> {
  if (getEffectiveMockMode()) {
    return Promise.resolve(mockImages);
  }
  try {
    return await apiFetch<MarsImage[]>('/mars/images');
  } catch (err) {
    console.warn('Falling back to mock images due to API failure:', err);
    return mockImages;
  }
}

export async function getTerrain(mapId = 'jezero-regional-200m'): Promise<TerrainMeta> {
  if (getEffectiveMockMode()) {
    return Promise.resolve(mockTerrain);
  }
  try {
    return await apiFetch<TerrainMeta>(`/mars/terrain/${mapId}`);
  } catch (err) {
    console.warn('Falling back to mock terrain due to API failure:', err);
    return mockTerrain;
  }
}

export async function postRoute(payload: RouteRequestPayload): Promise<RouteResponseSuccess> {
  if (getEffectiveMockMode()) {
    // Artificial latency for realism
    await new Promise((r) => setTimeout(r, 600));
    return Promise.resolve(generateDynamicMockRoute(payload));
  }

  return await apiFetch<RouteResponseSuccess>('/mars/routes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRouteById(requestId: string): Promise<SavedRouteRecord> {
  if (getEffectiveMockMode()) {
    return Promise.resolve({
      request_id: requestId,
      processing_status: 'success',
      map_id: 'jezero-regional-200m',
      start: mockRouteSuccess.start,
      target: mockRouteSuccess.target,
      input_coordinates: {
        start: mockRouteSuccess.requested_start,
        target: mockRouteSuccess.requested_target,
      },
      result: mockRouteSuccess,
    });
  }

  return await apiFetch<SavedRouteRecord>(`/mars/routes/${requestId}`);
}

export interface BackendStatus {
  online: boolean;
  mockMode: boolean;
  latencyMs?: number;
  message?: string;
}

export async function checkBackendStatus(): Promise<BackendStatus> {
  if (getEffectiveMockMode()) {
    return {
      online: true,
      mockMode: true,
      message: 'Running in Mock Mode (VITE_USE_MOCK=true)',
    };
  }

  const start = performance.now();
  try {
    const res = await fetch('/mars/space-weather', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      return { online: true, mockMode: false, latencyMs: latency };
    }
    return {
      online: false,
      mockMode: false,
      latencyMs: latency,
      message: `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      online: false,
      mockMode: false,
      message: err instanceof Error ? err.message : 'Offline',
    };
  }
}
