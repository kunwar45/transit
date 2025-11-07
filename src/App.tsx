import { useRef, useEffect } from 'react';
import Map, { type MapRef } from './Map';
import { useRoutes } from './hooks/useRoutes';
import type { Route } from './types/route';
import { loadOttawaDABoundaries } from './utils/geoTransform';

export default function App() {
  const mapRef = useRef<MapRef>(null);
  
  // Use the routes hook for easy route management
  const {
    addRoutes,
    getRouteCount
  } = useRoutes(mapRef);


  useEffect(() => {
    const sampleRoutes: Route[] = [
      {
        id: 'route-1',
        name: 'Route 1 - Downtown Express',
        coordinates: [
          [-75.7100, 45.4100], // Starting point (West)
          [-75.7050, 45.4150],
          [-75.7000, 45.4200], // Center of Ottawa
          [-75.6950, 45.4250],
          [-75.6900, 45.4300], // Ending point (East)
        ],
        color: '#FF0000', // Red
        lineWidth: 5
      },
      {
        id: 'route-2',
        name: 'Route 2 - North-South Connector',
        coordinates: [
          [-75.6950, 45.4000], // Starting point (South)
          [-75.6972, 45.4100],
          [-75.6972, 45.4215], // Center of Ottawa
          [-75.6972, 45.4330],
          [-75.6972, 45.4430], // Ending point (North)
        ],
        color: '#0066FF', // Blue
        lineWidth: 5
      }
    ];

    // Add routes and load DA boundaries after ensuring map is loaded
    // Use a longer delay to ensure map is fully initialized
    const timer = setTimeout(async () => {
      if (mapRef.current) {
        addRoutes(sampleRoutes);
        // eslint-disable-next-line no-console
        console.log(`Loaded ${getRouteCount()} routes`);
        
        // Load and display DA boundaries
        try {
          // eslint-disable-next-line no-console
          console.log('Loading DA boundaries...');
          const boundaries = await loadOttawaDABoundaries();
          // eslint-disable-next-line no-console
          console.log(`Transformed ${boundaries.features.length} DA boundaries`);
          // eslint-disable-next-line no-console
          console.log('Sample feature:', boundaries.features[0]);
          
          if (boundaries.features.length > 0) {
            // Check if coordinates look correct (should be longitude/latitude)
            const firstFeature = boundaries.features[0];
            if (firstFeature.geometry.type === 'Polygon' && firstFeature.geometry.coordinates[0]) {
              const firstCoord = firstFeature.geometry.coordinates[0][0];
              // eslint-disable-next-line no-console
              console.log('First coordinate:', firstCoord, '(should be [lng, lat] around -75, 45)');
            }
          }
          
          mapRef.current.loadDABoundaries(boundaries);
          // eslint-disable-next-line no-console
          console.log('DA boundaries loaded into map');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to load DA boundaries:', error);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [addRoutes, getRouteCount]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100%',
        padding: '20px',
        gap: '20px'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '55%',
          height: '800px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Map ref={mapRef} width="100%" height="100%" />
      </div>
      <div
        style={{
          width: '40%',
          padding: '20px',
          overflowY: 'auto'
        }}
      >
        <h2 style={{ marginTop: 0 }}>Lorem Ipsum</h2>
        <p>
          Hello World
        </p>
        <p>
          This is a test of the app.
        </p>
      </div>
    </div>
  );
}
