import { useRef, useEffect, useCallback } from 'react';
import { RoutesManager } from '../services/RoutesManager';
import type { Route } from '../types/route';
import type { MapRef } from '../Map';
import type { FeatureCollection, LineString } from 'geojson';
import { fetchGeoJSON, normalizeGeoJSON } from '../utils/geoJsonUtils';

/**
 * Custom hook for managing routes with the map
 * 
 * This hook provides a React-friendly interface for managing routes:
 * - Automatically syncs routes with the map
 * - Provides methods to add/remove/update routes
 * - Handles batch operations efficiently
 * 
 * @param mapRef - Reference to the Map component
 * @param initialRoutes - Optional initial routes to load
 * @returns Object with route management methods and the RoutesManager instance
 */
export function useRoutes(mapRef: React.RefObject<MapRef | null>, initialRoutes: Route[] = []) {
  const routesManagerRef = useRef<RoutesManager>(new RoutesManager(initialRoutes));
  const isInitializedRef = useRef(false);

  // Initialize routes when map is ready
  useEffect(() => {
    if (!mapRef.current || isInitializedRef.current) return;

    // Wait for map to be ready
    const timer = setTimeout(() => {
      if (mapRef.current && initialRoutes.length > 0) {
        syncRoutesToMap();
        isInitializedRef.current = true;
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [mapRef]);

  // Sync routes from RoutesManager to the map
  const syncRoutesToMap = useCallback(() => {
    if (!mapRef.current) return;
    
    // Wait a bit longer to ensure map is fully loaded
    const attemptSync = () => {
      if (!mapRef.current) return;
      
      const geoJSON = routesManagerRef.current.toGeoJSON();
      mapRef.current.updateRoutes(geoJSON);
    };
    
    // Try immediately, and also retry if needed
    setTimeout(attemptSync, 100);
  }, [mapRef]);

  // Add a single route
  const addRoute = useCallback((route: Route) => {
    routesManagerRef.current.addRoute(route);
    syncRoutesToMap();
  }, [syncRoutesToMap]);

  // Add multiple routes (batch operation)
  const addRoutes = useCallback((routes: Route[]) => {
    routesManagerRef.current.addRoutes(routes);
    syncRoutesToMap();
  }, [syncRoutesToMap]);

  // Update an existing route
  const updateRoute = useCallback((id: string, updates: Partial<Omit<Route, 'id'>>) => {
    routesManagerRef.current.updateRoute(id, updates);
    syncRoutesToMap();
  }, [syncRoutesToMap]);

  // Remove a single route
  const removeRoute = useCallback((id: string) => {
    routesManagerRef.current.removeRoute(id);
    syncRoutesToMap();
  }, [syncRoutesToMap]);

  // Remove multiple routes
  const removeRoutes = useCallback((ids: string[]) => {
    routesManagerRef.current.removeRoutes(ids);
    syncRoutesToMap();
  }, [syncRoutesToMap]);

  // Clear all routes
  const clearAllRoutes = useCallback(() => {
    routesManagerRef.current.clearAll();
    syncRoutesToMap();
  }, [syncRoutesToMap]);

  // Get a route by id
  const getRoute = useCallback((id: string) => {
    return routesManagerRef.current.getRoute(id);
  }, []);

  // Get all routes
  const getAllRoutes = useCallback(() => {
    return routesManagerRef.current.getAllRoutes();
  }, []);

  // Get routes by name
  const getRoutesByName = useCallback((searchTerm: string) => {
    return routesManagerRef.current.getRoutesByName(searchTerm);
  }, []);

  // Get routes by color
  const getRoutesByColor = useCallback((color: string) => {
    return routesManagerRef.current.getRoutesByColor(color);
  }, []);

  // Get route count
  const getRouteCount = useCallback(() => {
    return routesManagerRef.current.getRouteCount();
  }, []);

  // Load GeoJSON from URL
  const loadGeoJSONFromURL = useCallback(async (
    url: string,
    defaultColor: string = '#FF0000',
    defaultLineWidth: number = 4
  ) => {
    const geoJSON = await fetchGeoJSON(url, defaultColor, defaultLineWidth);
    if (!mapRef.current) return;
    mapRef.current.updateRoutes(geoJSON);
    return geoJSON;
  }, [mapRef]);

  // Load GeoJSON directly (from service response)
  const loadGeoJSON = useCallback((geoJSON: FeatureCollection<LineString>, defaultColor?: string, defaultLineWidth?: number) => {
    if (!mapRef.current) return;
    const normalized = normalizeGeoJSON(geoJSON, defaultColor, defaultLineWidth);
    mapRef.current.updateRoutes(normalized);
  }, [mapRef]);

  return {
    // Route management methods
    addRoute,
    addRoutes,
    updateRoute,
    removeRoute,
    removeRoutes,
    clearAllRoutes,
    
    // Query methods
    getRoute,
    getAllRoutes,
    getRoutesByName,
    getRoutesByColor,
    getRouteCount,
    
    // GeoJSON loading methods
    loadGeoJSONFromURL,
    loadGeoJSON,
    
    // Direct access to RoutesManager (for advanced use cases)
    routesManager: routesManagerRef.current
  };
}

