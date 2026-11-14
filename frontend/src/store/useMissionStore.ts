import { create } from 'zustand';
import {
  TerrainMeta,
  MarsLayersMap,
  Poi,
  MarsImage,
  SpaceWeather,
  CoordinateGeo,
  RouteResponseSuccess,
} from '../api/types';
import { MarsApiError } from '../api/errors';
import {
  getTerrain,
  getLayers,
  getPois,
  getSpaceWeather,
  getImages,
  postRoute,
  getRouteById,
  checkBackendStatus,
  BackendStatus,
} from '../api/client';
import { isWithinRequestedBounds } from '../lib/bounds';
import { DemoPreset } from '../lib/demoPresets';

interface MissionState {
  // Context Data
  terrainMeta: TerrainMeta | null;
  layers: MarsLayersMap | null;
  pois: Poi[];
  images: MarsImage[];
  spaceWeather: SpaceWeather | null;
  backendStatus: BackendStatus;

  // Route Planning State
  start: CoordinateGeo | null;
  target: CoordinateGeo | null;
  routeResult: RouteResponseSuccess | null;
  selectedPathRank: number; // 1, 2, or 3
  selectedPoi: Poi | null;
  pickingMode: 'start' | 'target' | null;
  blockedPoint: 'start' | 'target' | null;
  rateLimitCountdown: number;

  // UI / Status Flags
  isLoadingInitial: boolean;
  isLoadingRoute: boolean;
  routeError: MarsApiError | null;
  activeLayerId: string;
  visibleOverlays: string[];
  layerOpacities: Record<string, number>;
  layerErrors: Record<string, string | null>;
  showTraversabilityGrid: boolean;

  // Actions
  setTerrainMeta: (meta: TerrainMeta | null) => void;
  setLayers: (layers: MarsLayersMap | null) => void;
  setPois: (pois: Poi[]) => void;
  setImages: (images: MarsImage[]) => void;
  setSpaceWeather: (weather: SpaceWeather | null) => void;
  setBackendStatus: (status: BackendStatus) => void;

  setStart: (point: CoordinateGeo | null) => void;
  setTarget: (point: CoordinateGeo | null) => void;
  setPickingMode: (mode: 'start' | 'target' | null) => void;
  setBlockedPoint: (point: 'start' | 'target' | null) => void;
  setRateLimitCountdown: (count: number) => void;
  setRouteResult: (result: RouteResponseSuccess | null) => void;
  setSelectedPathRank: (rank: number) => void;
  setSelectedPoi: (poi: Poi | null) => void;
  setRouteError: (error: MarsApiError | null) => void;
  setActiveLayerId: (id: string) => void;
  toggleOverlay: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerError: (id: string, error: string | null) => void;
  toggleTraversabilityGrid: () => void;

  planRoute: () => Promise<void>;
  applyDemoPreset: (preset: DemoPreset) => Promise<void>;
  loadRouteByRequestId: (requestId: string) => Promise<boolean>;
  resetRoute: () => void;
  fetchInitialMissionData: () => Promise<void>;
}

const STORAGE_KEY_ROUTE = 'aresnav_last_route_result';
const STORAGE_KEY_RANK = 'aresnav_selected_path_rank';

function loadPersistedRoute(): RouteResponseSuccess | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ROUTE);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to parse persisted route from sessionStorage:', e);
    return null;
  }
}

function loadPersistedRank(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_RANK);
    const parsed = raw ? parseInt(raw, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > 3 ? 1 : parsed;
  } catch {
    return 1;
  }
}

export const useMissionStore = create<MissionState>((set, get) => ({
  terrainMeta: null,
  layers: null,
  pois: [],
  images: [],
  spaceWeather: null,
  backendStatus: { online: false, mockMode: false },

  start: null,
  target: null,
  routeResult: loadPersistedRoute(),
  selectedPathRank: loadPersistedRank(),
  selectedPoi: null,
  pickingMode: null,
  blockedPoint: null,
  rateLimitCountdown: 0,

  isLoadingInitial: false,
  isLoadingRoute: false,
  routeError: null,
  activeLayerId: 'base_viking',
  visibleOverlays: ['hirise_jezero'],
  layerOpacities: {
    hirise_jezero: 0.8,
    geology: 0.6,
    mola_color: 0.7,
    ctx_5m: 0.9,
  },
  layerErrors: {},
  showTraversabilityGrid: false,

  setTerrainMeta: (meta) => set({ terrainMeta: meta }),
  setLayers: (layers) => set({ layers }),
  setPois: (pois) => set({ pois }),
  setImages: (images) => set({ images }),
  setSpaceWeather: (weather) => set({ spaceWeather: weather }),
  setBackendStatus: (status) => set({ backendStatus: status }),

  setStart: (point) => set({ start: point, routeError: null, blockedPoint: null }),
  setTarget: (point) => set({ target: point, routeError: null, blockedPoint: null }),
  setPickingMode: (mode) => set({ pickingMode: mode }),
  setBlockedPoint: (point) => set({ blockedPoint: point }),
  setRateLimitCountdown: (count) => set({ rateLimitCountdown: count }),

  setRouteResult: (result) => {
    set({ routeResult: result, selectedPathRank: 1, routeError: null, blockedPoint: null });
    if (typeof window !== 'undefined') {
      try {
        if (result) {
          sessionStorage.setItem(STORAGE_KEY_ROUTE, JSON.stringify(result));
          sessionStorage.setItem(STORAGE_KEY_RANK, '1');
        } else {
          sessionStorage.removeItem(STORAGE_KEY_ROUTE);
          sessionStorage.removeItem(STORAGE_KEY_RANK);
        }
      } catch (e) {
        console.warn('Could not persist route to sessionStorage:', e);
      }
    }
  },

  setSelectedPathRank: (rank) => {
    set({ selectedPathRank: rank });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY_RANK, rank.toString());
      } catch {
        // Ignore storage error
      }
    }
  },

  setSelectedPoi: (poi) => set({ selectedPoi: poi }),
  setRouteError: (error) => set({ routeError: error }),
  setActiveLayerId: (id) => set({ activeLayerId: id }),
  toggleOverlay: (id) =>
    set((state) => ({
      visibleOverlays: state.visibleOverlays.includes(id)
        ? state.visibleOverlays.filter((x) => x !== id)
        : [...state.visibleOverlays, id],
    })),
  setLayerOpacity: (id, opacity) =>
    set((state) => ({
      layerOpacities: { ...state.layerOpacities, [id]: opacity },
    })),
  setLayerError: (id, error) =>
    set((state) => ({
      layerErrors: { ...state.layerErrors, [id]: error },
    })),
  toggleTraversabilityGrid: () =>
    set((state) => ({ showTraversabilityGrid: !state.showTraversabilityGrid })),

  planRoute: async () => {
    const { start, target } = get();
    if (!start || !target) {
      set({
        routeError: new MarsApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Both Start and Target waypoints must be selected before planning.',
        }),
      });
      return;
    }

    if (!isWithinRequestedBounds(start.lon, start.lat) || !isWithinRequestedBounds(target.lon, target.lat)) {
      set({
        routeError: new MarsApiError({
          status: 422,
          code: 'OUT_OF_BOUNDS',
          message: 'Waypoints must remain within Jezero Crater requested operational bounds.',
        }),
      });
      return;
    }

    // Capture exact numeric coordinates to guard against race conditions
    const reqStart: CoordinateGeo = { lon: Number(start.lon), lat: Number(start.lat) };
    const reqTarget: CoordinateGeo = { lon: Number(target.lon), lat: Number(target.lat) };

    set({ isLoadingRoute: true, routeError: null, blockedPoint: null, pickingMode: null });

    try {
      // Step 1: Read fresh map version from GET /mars/terrain (never hardcode version!)
      const freshTerrain = await getTerrain('jezero-regional-200m');
      set({ terrainMeta: freshTerrain });

      // Step 2: POST to /mars/routes
      const response = await postRoute({
        map_id: 'jezero-regional-200m',
        map_version: freshTerrain.version,
        start: reqStart,
        target: reqTarget,
      });

      // Verify response matches current selection (Task 3 requirement 3)
      const curStart = get().start;
      const curTarget = get().target;
      if (
        !curStart ||
        !curTarget ||
        Math.abs(curStart.lon - reqStart.lon) > 1e-5 ||
        Math.abs(curStart.lat - reqStart.lat) > 1e-5 ||
        Math.abs(curTarget.lon - reqTarget.lon) > 1e-5 ||
        Math.abs(curTarget.lat - reqTarget.lat) > 1e-5
      ) {
        console.warn('Ignoring outdated route response: selection changed while waiting.');
        set({ isLoadingRoute: false });
        return;
      }

      get().setRouteResult(response);
      set({ isLoadingRoute: false });
    } catch (err) {
      const apiErr = err instanceof MarsApiError
        ? err
        : new MarsApiError({
            status: 0,
            code: 'SERVER_ERROR',
            message: err instanceof Error ? err.message : 'Unknown pathfinding failure.',
          });

      // Handle specific error codes per Task 3 requirement 7
      let blockedPoint: 'start' | 'target' | null = null;
      if (apiErr.code === 'BLOCKED_POINT') {
        const msg = (apiErr.message || '').toLowerCase();
        if (msg.includes('البداية') || msg.includes('start')) {
          blockedPoint = 'start';
        } else if (msg.includes('النهاية') || msg.includes('target')) {
          blockedPoint = 'target';
        } else {
          blockedPoint = 'start';
        }
      } else if (apiErr.code === 'MAP_CHANGED' || apiErr.status === 409) {
        // Auto-refresh terrain on map changed
        getTerrain('jezero-regional-200m').then((t) => set({ terrainMeta: t })).catch(() => {});
      } else if (apiErr.status === 429 || apiErr.code === 'PLANNER_BUSY') {
        // Start 5-second rate limit countdown
        set({ rateLimitCountdown: 5 });
        const interval = setInterval(() => {
          const current = get().rateLimitCountdown;
          if (current <= 1) {
            clearInterval(interval);
            set({ rateLimitCountdown: 0 });
          } else {
            set({ rateLimitCountdown: current - 1 });
          }
        }, 1000);
      }

      set({
        routeError: apiErr,
        blockedPoint,
        isLoadingRoute: false,
      });
    }
  },

  applyDemoPreset: async (preset: DemoPreset) => {
    set({
      start: preset.start,
      target: preset.target,
      pickingMode: null,
      blockedPoint: null,
      routeError: null,
    });
    await get().planRoute();
  },

  loadRouteByRequestId: async (requestId: string): Promise<boolean> => {
    set({ isLoadingRoute: true, routeError: null });
    try {
      const record = await getRouteById(requestId);
      if (record && record.result && record.result.status === 'success') {
        const res = record.result as RouteResponseSuccess;
        get().setRouteResult(res);
        if (res.requested_start && 'lon' in res.requested_start) {
          set({ start: res.requested_start as CoordinateGeo });
        }
        if (res.requested_target && 'lon' in res.requested_target) {
          set({ target: res.requested_target as CoordinateGeo });
        }
        set({ isLoadingRoute: false });
        return true;
      }
      set({ isLoadingRoute: false });
      return false;
    } catch (err) {
      console.warn('Failed to load route by request id:', err);
      set({ isLoadingRoute: false });
      return false;
    }
  },

  resetRoute: () => {
    get().setRouteResult(null);
    set({
      start: null,
      target: null,
      routeError: null,
      blockedPoint: null,
      pickingMode: null,
    });
  },

  fetchInitialMissionData: async () => {
    set({ isLoadingInitial: true });
    try {
      const [status, terrain, layers, pois, weather, images] = await Promise.all([
        checkBackendStatus(),
        getTerrain('jezero-regional-200m'),
        getLayers(),
        getPois(),
        getSpaceWeather(),
        getImages(),
      ]);

      set({
        backendStatus: status,
        terrainMeta: terrain,
        layers,
        pois: pois.data || [],
        spaceWeather: weather,
        images,
        isLoadingInitial: false,
      });
    } catch (err) {
      console.warn('Error during initial mission data fetch:', err);
      set({ isLoadingInitial: false });
    }
  },
}));
