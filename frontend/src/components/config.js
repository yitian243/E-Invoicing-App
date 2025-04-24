// Get environment variables from window.ENV (set by env-config.js)
// With fallback to default values
const ENV = window.ENV || {};

export const BACKEND_PORT = 5000; // Keep for backward compatibility
export const BACKEND_URL = ENV.BACKEND_URL || `http://localhost:${BACKEND_PORT}`;
