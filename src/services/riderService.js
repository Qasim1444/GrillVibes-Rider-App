import { apiRequest, unwrap } from "../api/client";

export async function getOrderTracking(token, orderId) {
  const payload = await apiRequest(`/rider/orders/${orderId}/tracking`, { token });
  return unwrap(payload);
}

export async function getOrderRoute(token, orderId) {
  return apiRequest(`/rider/orders/${orderId}/route`, { token });
}

export async function updateRiderLocation(token, location) {
  return apiRequest("/rider/location", {
    token,
    method: "POST",
    body: {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy
    }
  });
}

export async function updateDeliveryStatus(token, orderId, action, body) {
  return apiRequest(`/rider/orders/${orderId}/${action}`, {
    token,
    method: "POST",
    body
  });
}
