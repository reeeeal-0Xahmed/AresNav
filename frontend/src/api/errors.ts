/**
 * Mars Mission API Error Normalization
 * Handles backend error codes, HTTP codes, and user-facing remediation messages.
 */

export type MarsErrorCode =
  | 'BLOCKED_POINT'
  | 'OUT_OF_BOUNDS'
  | 'VALIDATION_ERROR'
  | 'MAP_CHANGED'
  | 'PLANNER_BUSY'
  | 'PLANNER_TIMEOUT'
  | 'NO_PATH'
  | 'MAP_NOT_FOUND'
  | 'TERRAIN_UNAVAILABLE'
  | 'INVALID_TERRAIN'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class MarsApiError extends Error {
  public status: number;
  public code: MarsErrorCode;
  public userMessage: string;
  public retryAfter?: number;
  public validationErrors?: Record<string, string[]>;
  public isBlockedPoint: boolean;
  public isMapChanged: boolean;
  public isPlannerBusy: boolean;
  public isTimeout: boolean;
  public isNoPath: boolean;

  constructor({
    status,
    code,
    message,
    userMessage,
    retryAfter,
    validationErrors,
  }: {
    status: number;
    code: MarsErrorCode;
    message: string;
    userMessage?: string;
    retryAfter?: number;
    validationErrors?: Record<string, string[]>;
  }) {
    super(message);
    this.name = 'MarsApiError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
    this.validationErrors = validationErrors;

    this.isBlockedPoint = code === 'BLOCKED_POINT';
    this.isMapChanged = code === 'MAP_CHANGED' || status === 409;
    this.isPlannerBusy = code === 'PLANNER_BUSY' || status === 429;
    this.isTimeout = code === 'PLANNER_TIMEOUT' || status === 504;
    this.isNoPath = code === 'NO_PATH';

    this.userMessage = userMessage || this.resolveUserMessage();
  }

  private resolveUserMessage(): string {
    switch (this.code) {
      case 'BLOCKED_POINT':
        return 'Selected point falls on impassable terrain (cliff, crater wall, or severe hazard). Please select an adjacent accessible cell.';
      case 'OUT_OF_BOUNDS':
        return 'Selected coordinate is outside the Jezero Crater regional bounds (West 76.80°, South 17.96°, East 78.06°, North 18.97°).';
      case 'MAP_CHANGED':
        return 'The terrain model version on the server has updated. Reloading map metadata before retrying...';
      case 'PLANNER_BUSY':
        return `Pathfinder calculation engine is currently busy. Please wait ${this.retryAfter ? `${this.retryAfter}s` : 'a few seconds'} before submitting another route.`;
      case 'PLANNER_TIMEOUT':
        return 'Pathfinding calculation timed out before completing. Try points closer together or avoiding steep crater ridges.';
      case 'NO_PATH':
        return 'No traversable route found between the selected start and target under current slope (<20°) and hazard constraints.';
      case 'SERVER_ERROR':
        return 'A server or pathfinder computation error occurred. Mission control is standing by.';
      case 'NETWORK_ERROR':
        return 'Unable to reach the Mars mission server. Running in mock offline mode.';
      default:
        return this.message || 'An unexpected error occurred during mission communication.';
    }
  }
}

/**
 * Normalizes HTTP response errors into a unified MarsApiError
 */
export async function normalizeApiError(response: Response): Promise<MarsApiError> {
  const status = response.status;
  let code: MarsErrorCode = 'UNKNOWN';
  let message = `Request failed with status ${status}`;
  let userMessage: string | undefined;
  let validationErrors: Record<string, string[]> | undefined;
  let retryAfter: number | undefined;

  const retryHeader = response.headers.get('Retry-After');
  if (retryHeader) {
    const parsed = parseInt(retryHeader, 10);
    if (!isNaN(parsed)) {
      retryAfter = parsed;
    }
  }

  try {
    const data = await response.json();
    if (data) {
      if (typeof data.message === 'string') {
        message = data.message;
      }
      if (typeof data.error_code === 'string') {
        code = data.error_code as MarsErrorCode;
      }
      if (data.errors && typeof data.errors === 'object') {
        validationErrors = data.errors;
        code = 'VALIDATION_ERROR';
      }
    }
  } catch {
    // Response body was not JSON
  }

  // Derive status-based code if not explicitly given
  if (code === 'UNKNOWN') {
    if (status === 409) code = 'MAP_CHANGED';
    else if (status === 422) code = 'VALIDATION_ERROR';
    else if (status === 429) code = 'PLANNER_BUSY';
    else if (status === 504) code = 'PLANNER_TIMEOUT';
    else if (status >= 500) code = 'SERVER_ERROR';
  }

  return new MarsApiError({
    status,
    code,
    message,
    userMessage,
    retryAfter,
    validationErrors,
  });
}
