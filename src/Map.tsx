import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import maplibregl, { Map as MlMap, type LngLatLike } from 'maplibre-gl';
import type { FeatureCollection, LineString, Point, Polygon } from 'geojson';
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

const EMPTY_BOUNDARIES: FeatureCollection<Polygon> = {
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
  loadDABoundaries: (geoJSON: FeatureCollection<Polygon>) => void;
  clearDABoundaries: () => void;
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
      map.addSource('da-boundaries', {
        type: 'geojson',
        data: EMPTY_BOUNDARIES
      });

      // Fill layer for DA boundaries (add first so it appears below routes)
      map.addLayer({
        id: 'da-boundaries-fill',
        type: 'fill',
        source: 'da-boundaries',
        paint: {
          'fill-color': '#00FF00',  // Bright green for maximum visibility
          'fill-opacity': 0.3
        }
      });

      // Stroke layer for DA boundaries (highlighted borders)
      map.addLayer({
        id: 'da-boundaries-stroke',
        type: 'line',
        source: 'da-boundaries',
        paint: {
          'line-color': '#008000',  // Dark green for contrast
          'line-width': 3,  // Thicker lines
          'line-opacity': 1.0
        }
      });

      // Styled line layer for routes with data-driven styling for colors (on top of boundaries)
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

      // Styled circle layer for stops (on top of everything)
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
    },
    // Load DA boundaries GeoJSON
    loadDABoundaries: (geoJSON: FeatureCollection<Polygon>) => {
      if (!mapRef.current) {
        // eslint-disable-next-line no-console
        console.error('Map ref is not available');
        return;
      }
      
      // eslint-disable-next-line no-console
      console.log('loadDABoundaries called with', geoJSON.features.length, 'features');
      // eslint-disable-next-line no-console
      console.log('Map ready?', isMapReadyRef.current);
      
      const tryUpdate = () => {
        if (!mapRef.current) {
          // eslint-disable-next-line no-console
          console.error('Map ref lost during update');
          return false;
        }
        const source = mapRef.current.getSource('da-boundaries') as maplibregl.GeoJSONSource | undefined;
        if (source) {
          // eslint-disable-next-line no-console
          console.log('Setting DA boundaries data on map source');
          source.setData(geoJSON);
          
          // Get the bounds of all features to see if they're visible
          if (geoJSON.features.length > 0) {
            const coords = geoJSON.features.flatMap(f => {
              if (f.geometry.type === 'Polygon') {
                return f.geometry.coordinates[0];
              }
              return [];
            });
            if (coords.length > 0) {
              const lngs = coords.map(c => c[0]);
              const lats = coords.map(c => c[1]);
              // eslint-disable-next-line no-console
              console.log('Boundaries extent:', {
                minLng: Math.min(...lngs),
                maxLng: Math.max(...lngs),
                minLat: Math.min(...lats),
                maxLat: Math.max(...lats)
              });
            }
          }
          
          return true;
        }
        // eslint-disable-next-line no-console
        console.warn('DA boundaries source not found');
        return false;
      };
      
      // If map is ready, try immediately
      if (isMapReadyRef.current && mapRef.current.isStyleLoaded()) {
        // eslint-disable-next-line no-console
        console.log('Map is ready, updating immediately');
        if (tryUpdate()) return;
        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.log('Retrying update after 50ms');
          tryUpdate();
        }, 50);
        return;
      }
      
      // Map not ready yet, wait for load event
      // eslint-disable-next-line no-console
      console.log('Map not ready, waiting for load event');
      const waitForLoad = () => {
        if (!mapRef.current) return;
        mapRef.current.once('load', () => {
          // eslint-disable-next-line no-console
          console.log('Map load event fired, updating DA boundaries');
          setTimeout(() => tryUpdate(), 100);
        });
      };
      
      if (!mapRef.current.isStyleLoaded()) {
        waitForLoad();
      } else {
        setTimeout(() => {
          if (!tryUpdate()) {
            waitForLoad();
          }
        }, 100);
      }
    },
    // Clear DA boundaries
    clearDABoundaries: () => {
      if (!mapRef.current) return;
      const source = mapRef.current.getSource('da-boundaries') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(EMPTY_BOUNDARIES);
      }
    }
  }), []);

  return <div ref={containerRef} style={{ width, height }} />;
});

export default Map;
