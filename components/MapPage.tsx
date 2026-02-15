import React, { useEffect, useMemo, useRef } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPageProps {
  geoJson: unknown;
  onBack: () => void;
}

type LatLng = [number, number];

type JsonObject = Record<string, unknown>;

const DEFAULT_CENTER: LatLng = [40, -100];
const DEFAULT_ZOOM = 4;
const UnsafeMapContainer = MapContainer as unknown as React.ComponentType<any>;
const UnsafeGeoJSON = GeoJSON as unknown as React.ComponentType<any>;

const isObject = (value: unknown): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCoordinates(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return normalizeCoordinates(JSON.parse(trimmed));
      } catch {
        return value;
      }
    }
  }

  if (Array.isArray(value)) {
    if (value.length >= 2 && !Array.isArray(value[0]) && !Array.isArray(value[1])) {
      let first = toNumber(value[0]);
      let second = toNumber(value[1]);

      if (first !== null && second !== null) {
        // Cope with accidental [lat, lon] pairs.
        if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
          [first, second] = [second, first];
        }
        return [first, second];
      }
    }

    return value.map((item) => normalizeCoordinates(item));
  }

  if (isObject(value)) {
    const lat = toNumber(value.lat ?? value.latitude);
    const lon = toNumber(value.lon ?? value.lng ?? value.longitude);

    if (lat !== null && lon !== null) {
      return [lon, lat];
    }
  }

  return value;
}

function isCoordinatePair(value: unknown): value is [unknown, unknown] {
  return Array.isArray(value) && value.length >= 2 && !Array.isArray(value[0]) && !Array.isArray(value[1]);
}

function inferGeometryTypeFromCoordinates(coords: unknown): string | null {
  if (!Array.isArray(coords) || coords.length === 0) {
    return null;
  }

  if (isCoordinatePair(coords)) {
    return 'Point';
  }

  const first = coords[0];
  if (!Array.isArray(first)) {
    return null;
  }
  if (isCoordinatePair(first)) {
    return 'LineString';
  }

  const second = first[0];
  if (!Array.isArray(second)) {
    return null;
  }
  if (isCoordinatePair(second)) {
    return 'Polygon';
  }

  const third = second[0];
  if (Array.isArray(third) && isCoordinatePair(third)) {
    return 'MultiPolygon';
  }

  return null;
}

function findCoordinateArrayCandidate(root: unknown, seen = new WeakSet<object>()): unknown | null {
  if (Array.isArray(root)) {
    const inferred = inferGeometryTypeFromCoordinates(root);
    if (inferred) {
      return root;
    }
    for (const item of root) {
      const found = findCoordinateArrayCandidate(item, seen);
      if (found) return found;
    }
    return null;
  }

  if (!isObject(root)) {
    return null;
  }

  if (seen.has(root)) {
    return null;
  }
  seen.add(root);

  for (const value of Object.values(root)) {
    const found = findCoordinateArrayCandidate(value, seen);
    if (found) {
      return found;
    }
  }

  return null;
}

function normalizeGeometry(geometry: unknown): JsonObject | null {
  if (!isObject(geometry)) {
    return null;
  }

  const type = geometry.type;
  if (typeof type !== 'string') {
    return null;
  }

  if (type === 'GeometryCollection' && Array.isArray(geometry.geometries)) {
    return {
      ...geometry,
      geometries: geometry.geometries
        .map((g) => normalizeGeometry(g))
        .filter((g): g is JsonObject => Boolean(g))
    };
  }

  return {
    ...geometry,
    coordinates: normalizeCoordinates(geometry.coordinates)
  };
}

function coerceToFeature(value: unknown): JsonObject | null {
  if (!isObject(value)) {
    return null;
  }

  if (value.type === 'Feature' && value.geometry) {
    const geometry = normalizeGeometry(value.geometry);
    if (!geometry) return null;

    return {
      ...value,
      type: 'Feature',
      geometry,
      properties: isObject(value.properties) ? value.properties : {}
    };
  }

  if (value.geometry) {
    const geometry = normalizeGeometry(value.geometry);
    if (!geometry) return null;

    return {
      type: 'Feature',
      geometry,
      properties: isObject(value.properties) ? value.properties : {}
    };
  }

  if (typeof value.type === 'string' && value.coordinates !== undefined) {
    const geometry = normalizeGeometry({
      type: value.type,
      coordinates: value.coordinates
    });
    if (!geometry) return null;

    return {
      type: 'Feature',
      geometry,
      properties: isObject(value.properties) ? value.properties : {}
    };
  }

  const lat = toNumber(value.lat ?? value.latitude);
  const lon = toNumber(value.lon ?? value.lng ?? value.longitude);
  if (lat !== null && lon !== null) {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      properties: isObject(value.properties) ? value.properties : {}
    };
  }

  return null;
}

function collectFeaturesFromArray(items: unknown[]): JsonObject[] {
  return items
    .map((item) => coerceToFeature(item))
    .filter((feature): feature is JsonObject => Boolean(feature));
}

function findFirstGeoCandidate(root: unknown, seen = new WeakSet<object>()): JsonObject | null {
  if (!isObject(root)) {
    return null;
  }

  if (seen.has(root)) {
    return null;
  }
  seen.add(root);

  const directFeature = coerceToFeature(root);
  if (directFeature) {
    return directFeature;
  }

  if (Array.isArray(root.features)) {
    const features = collectFeaturesFromArray(root.features);
    if (features.length > 0) {
      return {
        type: 'FeatureCollection',
        features
      };
    }
  }

  for (const value of Object.values(root)) {
    if (Array.isArray(value)) {
      const features = collectFeaturesFromArray(value);
      if (features.length > 0) {
        return {
          type: 'FeatureCollection',
          features
        };
      }

      for (const item of value) {
        const found = findFirstGeoCandidate(item, seen);
        if (found) {
          return found;
        }
      }
    } else if (isObject(value)) {
      const found = findFirstGeoCandidate(value, seen);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function toGeoJsonObject(input: unknown): JsonObject | null {
  let parsedInput: unknown = input;

  if (typeof parsedInput === 'string') {
    try {
      parsedInput = JSON.parse(parsedInput);
    } catch {
      return null;
    }
  }

  if (Array.isArray(parsedInput)) {
    const inferredType = inferGeometryTypeFromCoordinates(parsedInput);
    if (inferredType) {
      return {
        type: 'Feature',
        geometry: {
          type: inferredType,
          coordinates: normalizeCoordinates(parsedInput)
        },
        properties: {}
      };
    }

    const features = collectFeaturesFromArray(parsedInput);
    if (features.length > 0) {
      return {
        type: 'FeatureCollection',
        features
      };
    }
    return null;
  }

  if (!isObject(parsedInput)) {
    return null;
  }

  // Prefer explicit GeoJSON roots first.
  if (parsedInput.type === 'FeatureCollection' && Array.isArray(parsedInput.features)) {
    const features = collectFeaturesFromArray(parsedInput.features);
    if (features.length > 0) {
      return {
        ...parsedInput,
        type: 'FeatureCollection',
        features
      };
    }
  }

  const directFeature = coerceToFeature(parsedInput);
  if (directFeature) {
    return directFeature;
  }

  const coordinateCandidate = findCoordinateArrayCandidate(parsedInput);
  if (coordinateCandidate) {
    const inferredType = inferGeometryTypeFromCoordinates(coordinateCandidate);
    if (inferredType) {
      return {
        type: 'Feature',
        geometry: {
          type: inferredType,
          coordinates: normalizeCoordinates(coordinateCandidate)
        },
        properties: {}
      };
    }
  }

  return findFirstGeoCandidate(parsedInput);
}

const FitToGeoJsonBounds: React.FC<{ layerRef: React.RefObject<any>; dataKey: string }> = ({ layerRef, dataKey }) => {
  const map = useMap();

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || typeof layer.getBounds !== 'function') {
      return;
    }

    const bounds = layer.getBounds();
    if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15));
    }
  }, [map, layerRef, dataKey]);

  return null;
};

const MapPage: React.FC<MapPageProps> = ({ geoJson, onBack }) => {
  const overlayData = useMemo(() => toGeoJsonObject(geoJson), [geoJson]);
  const overlayLayerRef = useRef<any>(null);
  const dataKey = useMemo(() => JSON.stringify(overlayData ?? {}), [overlayData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark text-gray-900 dark:text-gray-100 px-4 py-6 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            className="inline-flex items-center px-3 py-2 rounded-md bg-white dark:bg-darkSurface border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onBack}
          >
            ← Back
          </button>
          <h2 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-200">Library Map</h2>
          <div className="w-[72px]" aria-hidden="true"></div>
        </div>

        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-darkSurface">
          <UnsafeMapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '70vh', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {overlayData && (
              <>
                <UnsafeGeoJSON
                  key={dataKey}
                  ref={overlayLayerRef}
                  data={overlayData}
                  style={() => ({
                    color: '#2563eb',
                    weight: 2,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.25
                  })}
                />
                <FitToGeoJsonBounds layerRef={overlayLayerRef} dataKey={dataKey} />
              </>
            )}
          </UnsafeMapContainer>
        </div>

        {!overlayData && (
          <div
            className="mt-4 rounded-xl border-2 border-amber-500 bg-amber-100 px-5 py-4 text-amber-900 shadow-md dark:border-amber-400 dark:bg-amber-900/35 dark:text-amber-100"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-triangle-exclamation text-xl leading-none mt-0.5" aria-hidden="true"></i>
              <p className="text-base md:text-lg font-semibold tracking-tight">
                This library has no mapped service area yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
