import { useEffect, useRef } from 'react';
import maplibregl, { Map as MlMap, type LngLatLike } from 'maplibre-gl';
import type { FeatureCollection, LineString, Point } from 'geojson';
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

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);

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

      // Styled line layer for routes
      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#0074D9', 'line-width': 4 }
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
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Full-viewport container; parent must not constrain height to 0
  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}
