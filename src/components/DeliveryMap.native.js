import React, { useEffect, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { DEFAULT_MAP_CENTER, MAP_STYLE } from "../config/map";

let MapLibreModule;

export function DeliveryMap({ tracking, currentLocation, routeCoordinates }) {
  if (isExpoGo()) {
    return <MapUnavailable message="MapLibre maps need a development build. Expo Go cannot load the native map module." />;
  }

  try {
    if (!MapLibreModule) MapLibreModule = require("@maplibre/maplibre-react-native");
  } catch {
    return <MapUnavailable message="Map module is missing from this app build. Rebuild the Android APK after installing MapLibre." />;
  }

  return <MapLibreDeliveryMap tracking={tracking} currentLocation={currentLocation} routeCoordinates={routeCoordinates} maplibre={MapLibreModule} />;
}

function MapLibreDeliveryMap({ tracking, currentLocation, routeCoordinates, maplibre }) {
  const { Camera, GeoJSONSource, Layer, Map, Marker } = maplibre;
  const cameraRef = useRef(null);
  const rider = currentLocation || getPoint(tracking?.rider);
  const pickup = getPickupPoint(tracking);
  const dropoff = getDropoffPoint(tracking);
  const riderLngLat = toLngLat(rider);
  const pickupLngLat = toLngLat(pickup);
  const dropoffLngLat = toLngLat(dropoff);
  const points = useMemo(
    () => [riderLngLat, pickupLngLat, dropoffLngLat, ...(routeCoordinates || [])].filter(Boolean),
    [riderLngLat, pickupLngLat, dropoffLngLat, routeCoordinates]
  );
  const center = riderLngLat || pickupLngLat || dropoffLngLat || DEFAULT_MAP_CENTER;
  const routeShape = useMemo(() => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: routeCoordinates?.length ? routeCoordinates : [riderLngLat, dropoffLngLat].filter(Boolean)
    }
  }), [routeCoordinates, riderLngLat, dropoffLngLat]);

  useEffect(() => {
    if (points.length < 2) return;

    const [west, south, east, north] = boundsFor(points);
    const timer = setTimeout(() => {
      cameraRef.current?.fitBounds(
        [west, south, east, north],
        { top: 120, right: 48, bottom: 290, left: 48 },
        900
      );
    }, 450);

    return () => clearTimeout(timer);
  }, [points]);

  return (
    <Map style={{ flex: 1 }} mapStyle={MAP_STYLE}>
      <Camera ref={cameraRef} initialViewState={{ center, zoom: points.length > 1 ? 12 : 14 }} />
      {routeShape.geometry.coordinates.length > 1 ? (
        <GeoJSONSource id="delivery-route" data={routeShape}>
          <Layer
            id="delivery-route-line"
            type="line"
            paint={{
              "line-color": "#1463df",
              "line-width": 5,
              "line-opacity": 0.9
            }}
          />
        </GeoJSONSource>
      ) : null}
      {pickupLngLat ? <MapPin Marker={Marker} id="pickup" lngLat={pickupLngLat} icon="storefront" label="Pickup" color="#1463df" /> : null}
      {dropoffLngLat ? <MapPin Marker={Marker} id="customer" lngLat={dropoffLngLat} icon="location" label="Customer" color="#ff311f" /> : null}
      {riderLngLat ? <MapPin Marker={Marker} id="rider" lngLat={riderLngLat} icon="bicycle" label="You" color="#12b76a" /> : null}
    </Map>
  );
}

function MapUnavailable({ message }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <View style={{ alignItems: "center", padding: 18, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.94)" }}>
        <Ionicons name="map-outline" size={44} color="#1463df" />
        <Text style={{ marginTop: 10, color: "#111827", fontSize: 15, fontWeight: "900", textAlign: "center" }}>Map build required</Text>
        <Text style={{ marginTop: 6, color: "#667085", fontSize: 12, fontWeight: "700", textAlign: "center" }}>{message}</Text>
      </View>
    </View>
  );
}

function MapPin({ Marker, id, lngLat, icon, label, color }) {
  return (
    <Marker id={id} lngLat={lngLat} anchor="bottom">
      <View style={{ alignItems: "center" }}>
        <View style={{ paddingHorizontal: 8, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" }}>
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "900" }}>{label}</Text>
        </View>
        <View style={{ marginTop: 4, width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: color, borderWidth: 3, borderColor: "#fff" }}>
          <Ionicons name={icon} size={20} color="#fff" />
        </View>
      </View>
    </Marker>
  );
}

function boundsFor(points) {
  const lngs = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);

  return [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats)
  ];
}

function toLngLat(point) {
  if (!point) return null;
  return [point.longitude, point.latitude];
}

function getPickupPoint(tracking) {
  return getPoint(tracking?.pickup) || getPoint(tracking?.order?.pickup) || getPoint(tracking?.order?.restaurant) || getPoint(tracking?.restaurant);
}

function getDropoffPoint(tracking) {
  return getPoint(tracking?.dropoff) || getPoint(tracking?.order?.dropoff) || getPoint(tracking?.order?.customer) || getPoint(tracking?.customer);
}

function getPoint(value) {
  if (!value) return null;
  const latitude = Number(value.latitude ?? value.lat ?? value.delivery_latitude ?? value.delivery_lat ?? value.location_lat);
  const longitude = Number(value.longitude ?? value.lng ?? value.lon ?? value.delivery_longitude ?? value.delivery_lng ?? value.location_lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude, accuracy: value.accuracy } : null;
}

function isExpoGo() {
  return Constants.appOwnership === "expo" || Constants.executionEnvironment === "storeClient";
}
