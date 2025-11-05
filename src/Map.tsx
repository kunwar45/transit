import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import maplibregl, { Map as MlMap, type LngLatLike } from 'maplibre-gl';
import type { FeatureCollection, LineString, Point } from 'geojson';
import type { Route } from './types/route';
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_CENTER: LngLatLike = [-75.6972, 45.4215]; // Ottawa
const DEFAULT_ZOOM = 11;

const EMPTY_ROUTES: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: []
};

const EMPTY_STOPS: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: []
};

interface MapProps {
  width?: number | string;
  height?: number | string;
}

export interface MapRef {
  addRoute: (coordinates: number[][]) => void;
  addRoutes: (routes: Route[]) => void;
  setRoutes: (routes: Route[]) => void;
  clearRoutes: () => void;
  updateRoutes: (geoJSON: FeatureCollection<LineString>) => void;
}

const Map = forwardRef<MapRef, MapProps>(({ width = 800, height = 500 }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const isMapReadyRef = useRef(false);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const styleUrl = import.meta.env.VITE_MAP_STYLE_URL as string | undefined;
    const defaultStyle = 'https://tiles.openfreemap.org/styles/bright';
    
    if (!styleUrl) {
      // eslint-disable-next-line no-console
      console.warn('VITE_MAP_STYLE_URL is not set. Using default style:', defaultStyle);
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl ?? defaultStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    });

    mapRef.current = map;

    map.on('load', () => {
      // Add empty GeoJSON sources that the app will populate later
      map.addSource('routes', {
        type: 'geojson',
        data: EMPTY_ROUTES
      });
      map.addSource('stops', {
        type: 'geojson',
        data: EMPTY_STOPS
      });

      // Styled line layer for routes with data-driven styling for colors
      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          // Use data-driven styling: get color from feature properties, default to red
          'line-color': ['coalesce', ['get', 'color'], '#FF0000'],
          // Use data-driven styling: get width from feature properties, default to 4
          'line-width': ['coalesce', ['get', 'lineWidth'], 4]
        }
      });

      // Styled circle layer for stops
      map.addLayer({
        id: 'stops-circle',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': 4,
          'circle-color': '#FF4136',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      // Mark map as ready
      isMapReadyRef.current = true;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    // Legacy method for backward compatibility
    addRoute: (coordinates: number[][]) => {
      if (!mapRef.current) return;
      
      const routeFeature = {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: coordinates
        },
        properties: {
          color: '#FF0000',
          lineWidth: 4
        }
      };

      const source = mapRef.current.getSource('routes') as maplibregl.GeoJSONSource;
      if (source) {
        const currentData = source._data as FeatureCollection<LineString>;
        source.setData({
          type: 'FeatureCollection',
          features: [...currentData.features, routeFeature]
        });
      }
    },
    // Add multiple routes at once (batch operation)
    addRoutes: (routes: Route[]) => {
      if (!mapRef.current) return;
      
      const source = mapRef.current.getSource('routes') as maplibregl.GeoJSONSource;
      if (source) {
        const currentData = source._data as FeatureCollection<LineString>;
        
        const newFeatures = routes.map(route => ({
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
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

        source.setData({
          type: 'FeatureCollection',
          features: [...currentData.features, ...newFeatures]
        });
      }
    },
    // Set all routes at once (replaces existing routes)
    setRoutes: (routes: Route[]) => {
      if (!mapRef.current) return;
      
      const source = mapRef.current.getSource('routes') as maplibregl.GeoJSONSource;
      if (source) {
        const features = routes.map(route => ({
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
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

        source.setData({
          type: 'FeatureCollection',
          features
        });
      }
    },
    // Update routes from GeoJSON (for use with RoutesManager)
    updateRoutes: (geoJSON: FeatureCollection<LineString>) => {
      if (!mapRef.current) return;
      
      const tryUpdate = () => {
        if (!mapRef.current) return false;
        const source = mapRef.current.getSource('routes') as maplibregl.GeoJSONSource | undefined;
        if (source) {
          source.setData(geoJSON);
          return true;
        }
        return false;
      };
      
      // If map is ready, try immediately
      if (isMapReadyRef.current) {
        if (tryUpdate()) return;
        // If source still doesn't exist, wait a bit and retry
        setTimeout(() => tryUpdate(), 50);
        return;
      }
      
      // Map not ready yet, wait for load event
      if (!mapRef.current.isStyleLoaded()) {
        mapRef.current.once('load', () => {
          setTimeout(() => tryUpdate(), 50);
        });
      } else {
        // Style loaded but sources might not be ready yet
        setTimeout(() => {
          if (!tryUpdate()) {
            // Wait for load event as fallback
            mapRef.current?.once('load', () => {
              setTimeout(() => tryUpdate(), 50);
            });
          }
        }, 100);
      }
    },
    clearRoutes: () => {
      if (!mapRef.current) return;
      const source = mapRef.current.getSource('routes') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(EMPTY_ROUTES);
      }
    }
  }), []);

  return <div ref={containerRef} style={{ width, height }} />;
});

export default Map;
