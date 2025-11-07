import proj4 from 'proj4';
import type { FeatureCollection, Polygon, Feature } from 'geojson';

// Register EPSG definitions
proj4.defs('EPSG:3347', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

/**
 * Transform coordinates from EPSG:3347 to WGS84 (EPSG:4326)
 */
export function transformCoordinates3347To4326(coordinates: number[]): [number, number] {
  try {
    const [x, y] = coordinates;
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
      // eslint-disable-next-line no-console
      console.error('Invalid coordinates:', coordinates);
      throw new Error(`Invalid coordinates: [${x}, ${y}]`);
    }
    const [longitude, latitude] = proj4('EPSG:3347', 'EPSG:4326', [x, y]);
    
    // Validate transformed coordinates
    if (isNaN(longitude) || isNaN(latitude)) {
      // eslint-disable-next-line no-console
      console.error('Transformation resulted in NaN:', { input: [x, y], output: [longitude, latitude] });
      throw new Error(`Transformation failed for coordinates: [${x}, ${y}]`);
    }
    
    return [longitude, latitude];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error transforming coordinates:', coordinates, error);
    throw error;
  }
}

/**
 * Transform a coordinate array from EPSG:3347 to WGS84
 */
export function transformCoordinateArray(coordinates: number[][]): number[][] {
  return coordinates.map(coord => transformCoordinates3347To4326(coord));
}

/**
 * Transform polygon coordinates from EPSG:3347 to WGS84
 */
export function transformPolygonCoordinates(coordinates: number[][][]): number[][][] {
  return coordinates.map(ring => transformCoordinateArray(ring));
}

/**
 * Transform GeoJSON FeatureCollection from EPSG:3347 to WGS84
 */
export function transformGeoJSON3347To4326(geoJSON: FeatureCollection<Polygon>): FeatureCollection<Polygon> {
  // eslint-disable-next-line no-console
  console.log(`Transforming ${geoJSON.features.length} features...`);
  
  let transformedCount = 0;
  let errorCount = 0;
  
  const transformedFeatures = geoJSON.features.map((feature: Feature<Polygon>, index: number) => {
    try {
      if (feature.geometry.type === 'Polygon') {
        const transformed = {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: transformPolygonCoordinates(feature.geometry.coordinates)
          }
        };
        transformedCount++;
        
        // Log first transformed feature for debugging
        if (index === 0 && transformed.geometry.coordinates[0] && transformed.geometry.coordinates[0][0]) {
          // eslint-disable-next-line no-console
          console.log('First transformed coordinate:', transformed.geometry.coordinates[0][0]);
        }
        
        return transformed;
      }
      return feature;
    } catch (error) {
      errorCount++;
      // eslint-disable-next-line no-console
      console.error(`Error transforming feature ${index}:`, error);
      // Skip this feature rather than breaking the whole transformation
      return null;
    }
  }).filter((f): f is Feature<Polygon> => f !== null);
  
  // eslint-disable-next-line no-console
  console.log(`Transformation complete: ${transformedCount} successful, ${errorCount} errors`);
  
  return {
    ...geoJSON,
    features: transformedFeatures
  };
}

/**
 * Load and transform Ottawa DA boundaries GeoJSON
 */
export async function loadOttawaDABoundaries(): Promise<FeatureCollection<Polygon>> {
  // eslint-disable-next-line no-console
  console.log('Fetching DA boundaries from /ottawa_da_boundaries.geojson');
  const response = await fetch('/ottawa_da_boundaries.geojson');
  if (!response.ok) {
    throw new Error(`Failed to load DA boundaries: ${response.statusText}`);
  }
  
  const geoJSON = await response.json() as FeatureCollection<Polygon>;
  // eslint-disable-next-line no-console
  console.log(`Loaded GeoJSON with ${geoJSON.features.length} features`);
  
  // Check first feature before transformation
  if (geoJSON.features.length > 0 && geoJSON.features[0].geometry.type === 'Polygon') {
    const firstCoord = geoJSON.features[0].geometry.coordinates[0][0];
    // eslint-disable-next-line no-console
    console.log('First coordinate before transform:', firstCoord);
  }
  
  // Transform coordinates from EPSG:3347 to WGS84
  const transformed = transformGeoJSON3347To4326(geoJSON);
  
  // Check first feature after transformation
  if (transformed.features.length > 0 && transformed.features[0].geometry.type === 'Polygon') {
    const firstCoord = transformed.features[0].geometry.coordinates[0][0];
    // eslint-disable-next-line no-console
    console.log('First coordinate after transform:', firstCoord);
  }
  
  return transformed;
}

