import React from "react";
import { MapContainer, TileLayer, Marker, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapPageProps {
  geoJson: any;
  onBack: () => void;
}

const getCoordinates = (geoJson: any) => {
  if (!geoJson || !geoJson.features) return [];
  return geoJson.features.map((feature: any) => {
    const { geometry } = feature;
    if (geometry.type === "Point") {
      return { type: "Point", coords: geometry.coordinates };
    } else if (geometry.type === "Polygon") {
      return { type: "Polygon", coords: geometry.coordinates[0] };
    }
    return null;
  }).filter(Boolean);
};

const MapPage: React.FC<MapPageProps> = ({ geoJson, onBack }) => {
  const coordinates = getCoordinates(geoJson);
  const center = coordinates.length && coordinates[0].type === "Point"
    ? [coordinates[0].coords[1], coordinates[0].coords[0]]
    : [40, -100];

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <button style={{ position: "absolute", top: 16, left: 16, zIndex: 1000 }} onClick={onBack}>
        ← Back
      </button>
      <MapContainer center={center as [number, number]} zoom={13} style={{ height: "100vh", width: "100vw" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {coordinates.map((item: any, idx: number) =>
          item.type === "Point" ? (
            <Marker key={idx} position={[item.coords[1], item.coords[0]] as [number, number]} />
          ) : (
            <Polygon key={idx} positions={item.coords.map((c: any) => [c[1], c[0]] as [number, number])} />
          )
        )}
      </MapContainer>
    </div>
  );
};

export default MapPage;
