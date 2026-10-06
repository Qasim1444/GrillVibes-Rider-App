import * as Location from "expo-location";

export async function ensureForegroundLocation() {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return { granted: false, reason: "services_disabled", message: "Turn on GPS/location services to track this delivery." };
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    return { granted: false, reason: "permission_denied", message: "Allow location permission so the rider map can show your live position." };
  }

  return { granted: true };
}

export function toLocationPoint(coords) {
  if (!coords) return null;

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy
  };
}

export async function getCurrentRiderLocation() {
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return toLocationPoint(position.coords);
}

export function watchRiderLocation(onUpdate) {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10,
      timeInterval: 5000
    },
    (position) => onUpdate(toLocationPoint(position.coords))
  );
}
