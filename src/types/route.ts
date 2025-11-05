/**
 * Route data structure for bus/transit routes
 */
export interface Route {
  id: string;
  name: string;
  coordinates: number[][]; // [longitude, latitude][]
  color?: string; // Hex color code, defaults to red
  lineWidth?: number; // Line width in pixels, defaults to 4
  properties?: Record<string, unknown>; // Additional metadata
}

/**
 * Route data for map rendering
 */
export interface RouteData {
  routes: Route[];
}

