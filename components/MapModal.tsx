import React from "react";
import { MapContainer, TileLayer, Marker, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapModalProps {
  geoJson: any;
  onClose: () => void;
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

const MapModal: React.FC<MapModalProps> = ({ geoJson, onClose }) => {
  const coordinates = getCoordinates(geoJson);
  // Default center: first point or fallback
  const center: [number, number] = coordinates.length && coordinates[0].type === "Point"
    ? [coordinates[0].coords[1], coordinates[0].coords[0]]
    : [40, -100];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>Close</button>
        {/* @ts-ignore: react-leaflet MapContainer expects center as LatLngExpression */}
        <MapContainer center={center as [number, number]} zoom={13} style={{ height: "400px", width: "100%" }}>
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
    </div>
  );
};

export default MapModal;
