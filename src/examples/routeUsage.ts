/**
 * Example usage of the Routes Management System
 * 
 * This file demonstrates how to use the RoutesManager and useRoutes hook
 * to manage dozens of routes efficiently.
 */

import { RoutesManager } from '../services/RoutesManager';
import type { Route } from '../types/route';

// Example 1: Using RoutesManager directly (for non-React contexts or advanced use cases)
export function exampleDirectUsage() {
  // Create a RoutesManager instance
  const manager = new RoutesManager();

  // Add routes one by one
  manager.addRoute({
    id: 'route-1',
    name: 'Route 1',
    coordinates: [[-75.6972, 45.4215], [-75.6900, 45.4270]],
    color: '#FF0000'
  });

  // Add multiple routes at once (batch operation - efficient!)
  const routes: Route[] = [
    {
      id: 'route-2',
      name: 'Route 2',
      coordinates: [[-75.7200, 45.3900], [-75.7100, 45.4000]],
      color: '#00FF00'
    },
    {
      id: 'route-3',
      name: 'Route 3',
      coordinates: [[-75.6500, 45.4400], [-75.6600, 45.4300]],
      color: '#0000FF'
    }
  ];
  manager.addRoutes(routes);

  // Query routes
  const allRoutes = manager.getAllRoutes();
  const route1 = manager.getRoute('route-1');
  const routesByName = manager.getRoutesByName('Route');

  // Update a route
  manager.updateRoute('route-1', {
    color: '#FFA500', // Change to orange
    lineWidth: 6
  });

  // Remove routes
  manager.removeRoute('route-1');
  manager.removeRoutes(['route-2', 'route-3']);

  // Convert to GeoJSON for map rendering
  const geoJSON = manager.toGeoJSON();
  return geoJSON;
}

// Example 2: Loading routes from an API
export async function exampleLoadFromAPI() {
  // In production, fetch from your API
  const response = await fetch('/api/routes');
  const routeData = await response.json();

  // Convert API response to Route[] format
  const routes: Route[] = routeData.map((item: unknown) => ({
    id: (item as { id: string }).id,
    name: (item as { name: string }).name,
    coordinates: (item as { coordinates: number[][] }).coordinates,
    color: (item as { color?: string }).color || '#FF0000',
    properties: {
      // Add any additional metadata
      frequency: (item as { frequency?: number }).frequency,
      operator: (item as { operator?: string }).operator
    }
  }));

  // Create manager with loaded routes
  const manager = new RoutesManager(routes);
  return manager;
}

// Example 3: Filtering and searching routes
export function exampleFiltering() {
  const manager = new RoutesManager([
    { id: '1', name: 'Downtown Express', coordinates: [[-75.6972, 45.4215], [-75.6900, 45.4270]], color: '#FF0000' },
    { id: '2', name: 'Westboro Loop', coordinates: [[-75.7200, 45.3900], [-75.7100, 45.4000]], color: '#00FF00' },
    { id: '3', name: 'East End Connector', coordinates: [[-75.6500, 45.4400], [-75.6600, 45.4300]], color: '#FF0000' }
  ]);

  // Search by name
  const expressRoutes = manager.getRoutesByName('Express');

  // Filter by color
  const redRoutes = manager.getRoutesByColor('#FF0000');

  // Get all routes
  const allRoutes = manager.getAllRoutes();

  return { expressRoutes, redRoutes, allRoutes };
}

// Example 4: React component usage (see App.tsx for full example)
/*
import { useRef } from 'react';
import Map, { type MapRef } from '../Map';
import { useRoutes } from '../hooks/useRoutes';

function MyComponent() {
  const mapRef = useRef<MapRef>(null);
  const { addRoutes, removeRoute, getAllRoutes } = useRoutes(mapRef);

  // Load routes from API
  useEffect(() => {
    fetch('/api/routes')
      .then(res => res.json())
      .then(data => addRoutes(data));
  }, [addRoutes]);

  return <Map ref={mapRef} />;
}
*/

