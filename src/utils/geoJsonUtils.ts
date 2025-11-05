import type { FeatureCollection, LineString, Feature } from 'geojson';

/**
 * Normalize GeoJSON features to ensure they have color and lineWidth properties
 * This is useful when loading GeoJSON from external services that might not
 * have these styling properties.
 */
export function normalizeGeoJSON(
  geoJSON: FeatureCollection<LineString>,
  defaultColor: string = '#FF0000',
  defaultLineWidth: number = 4
): FeatureCollection<LineString> {
  const normalizedFeatures: Feature<LineString>[] = geoJSON.features.map((feature) => {
    // Ensure properties exist
    const properties = feature.properties || {};
    
    // Add default color if not present
    if (!properties.color) {
      properties.color = defaultColor;
    }
    
    // Add default lineWidth if not present
    if (!properties.lineWidth) {
      properties.lineWidth = defaultLineWidth;
    }
    
    return {
      ...feature,
      properties
    };
  });
  
  return {
    type: 'FeatureCollection',
    features: normalizedFeatures
  };
}

/**
 * Fetch GeoJSON from a URL and normalize it
 */
export async function fetchGeoJSON(
  url: string,
  defaultColor: string = '#FF0000',
  defaultLineWidth: number = 4
): Promise<FeatureCollection<LineString>> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
  }
  
  const geoJSON = await response.json() as FeatureCollection<LineString>;
  
  // Validate it's a FeatureCollection
  if (geoJSON.type !== 'FeatureCollection') {
    throw new Error('Invalid GeoJSON: Expected FeatureCollection');
  }
  
  // Normalize and return
  return normalizeGeoJSON(geoJSON, defaultColor, defaultLineWidth);
}

