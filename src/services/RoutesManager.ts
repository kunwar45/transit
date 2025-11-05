import type { Route } from '../types/route';
import type { FeatureCollection, LineString, Feature } from 'geojson';

/**
 * RoutesManager - Handles route data management and validation
 * 
 * This class provides a centralized way to manage transit routes:
 * - Add/remove/update routes
 * - Validate route data
 * - Convert routes to GeoJSON format for map rendering
 * - Filter and search routes
 * - Batch operations
 */
export class RoutesManager {
  private routes: Map<string, Route>;

  constructor(initialRoutes: Route[] = []) {
    this.routes = new Map();
    this.addRoutes(initialRoutes);
  }

  /**
   * Add a single route
   */
  addRoute(route: Route): void {
    if (!route.id) {
      throw new Error('Route must have an id');
    }
    if (this.routes.has(route.id)) {
      throw new Error(`Route with id "${route.id}" already exists`);
    }
    this.validateRoute(route);
    this.routes.set(route.id, route);
  }

  /**
   * Add multiple routes at once (batch operation)
   */
  addRoutes(routes: Route[]): void {
    for (const route of routes) {
      this.addRoute(route);
    }
  }

  /**
   * Update an existing route
   */
  updateRoute(id: string, updates: Partial<Omit<Route, 'id'>>): void {
    const existingRoute = this.routes.get(id);
    if (!existingRoute) {
      throw new Error(`Route with id "${id}" not found`);
    }
    
    const updatedRoute: Route = {
      ...existingRoute,
      ...updates,
      id // Ensure id cannot be changed
    };
    
    this.validateRoute(updatedRoute);
    this.routes.set(id, updatedRoute);
  }

  /**
   * Remove a route by id
   */
  removeRoute(id: string): boolean {
    return this.routes.delete(id);
  }

  /**
   * Remove multiple routes by ids
   */
  removeRoutes(ids: string[]): void {
    for (const id of ids) {
      this.routes.delete(id);
    }
  }

  /**
   * Get a route by id
   */
  getRoute(id: string): Route | undefined {
    return this.routes.get(id);
  }

  /**
   * Get all routes
   */
  getAllRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get routes filtered by name (case-insensitive partial match)
   */
  getRoutesByName(searchTerm: string): Route[] {
    const lowerSearch = searchTerm.toLowerCase();
    return this.getAllRoutes().filter(route => 
      route.name.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Get routes filtered by color
   */
  getRoutesByColor(color: string): Route[] {
    return this.getAllRoutes().filter(route => 
      (route.color || '#FF0000').toUpperCase() === color.toUpperCase()
    );
  }

  /**
   * Clear all routes
   */
  clearAll(): void {
    this.routes.clear();
  }

  /**
   * Get the count of routes
   */
  getRouteCount(): number {
    return this.routes.size;
  }

  /**
   * Check if a route exists
   */
  hasRoute(id: string): boolean {
    return this.routes.has(id);
  }

  /**
   * Convert all routes to GeoJSON FeatureCollection for map rendering
   */
  toGeoJSON(): FeatureCollection<LineString> {
    const features: Feature<LineString>[] = this.getAllRoutes().map(route => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: route.coordinates
      },
      properties: {
        id: route.id,
        name: route.name,
        color: route.color || '#FF0000',
        lineWidth: route.lineWidth || 4,
        ...route.properties
      }
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Validate route data
   */
  private validateRoute(route: Route): void {
    if (!route.coordinates || route.coordinates.length < 2) {
      throw new Error('Route must have at least 2 coordinates');
    }

    for (const coord of route.coordinates) {
      if (!Array.isArray(coord) || coord.length !== 2) {
        throw new Error('Each coordinate must be [longitude, latitude]');
      }
      const [lng, lat] = coord;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error('Coordinates must be numbers');
      }
      if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
    }
  }
}

