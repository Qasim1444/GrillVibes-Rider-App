import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ACTIVE_DELIVERY_STATUSES, ROUTE_REFRESH_MS, STOPPED_DELIVERY_STATUSES } from "../config/map";
import { AppButton, EmptyState, Timeline } from "../components/ui";
import { DeliveryMap } from "../components/DeliveryMap";
import { styles } from "../styles";
import { ensureForegroundLocation, getCurrentRiderLocation, watchRiderLocation } from "../services/locationService";
import { getOrderRoute, getOrderTracking, updateDeliveryStatus, updateRiderLocation } from "../services/riderService";

export function TrackingScreen({ token, orderId, onBack }) {
  const [tracking, setTracking] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [routeLoading, setRouteLoading] = useState(false);
  const [sendingLocation, setSendingLocation] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const status = tracking?.order?.delivery_status || "assigned";
  const isActiveDelivery = ACTIVE_DELIVERY_STATUSES.includes(status);
  const isStoppedDelivery = STOPPED_DELIVERY_STATUSES.includes(status);
  const contact = tracking?.order?.customer?.contact || tracking?.customer?.contact;
  const customerName = tracking?.order?.customer?.name || tracking?.customer?.name || "Customer";
  const address = getDropoffAddress(tracking);
  const routeCoordinates = route?.route?.coordinates || [];
  const distanceText = route?.route?.distance_km ? `${route.route.distance_km} km` : tracking?.order?.distance_text || "--";
  const etaText = route?.route?.duration_minutes ? `${route.route.duration_minutes} min` : tracking?.order?.eta_text || "--";
  const primaryAction = useMemo(() => getPrimaryAction(status), [status]);

  const loadTracking = useCallback(async () => {
    if (!orderId) {
      setTracking(null);
      setLoading(false);
      return;
    }

    const data = await getOrderTracking(token, orderId);
    setTracking(data);
    setLoading(false);
  }, [orderId, token]);

  const refreshRoute = useCallback(async () => {
    if (!orderId || !isActiveDelivery) return;

    setRouteLoading(true);
    try {
      const payload = await getOrderRoute(token, orderId);
      setRoute(payload);
      setStatusMessage("");
    } catch (error) {
      setStatusMessage(error.message || "Route is temporarily unavailable.");
    } finally {
      setRouteLoading(false);
    }
  }, [isActiveDelivery, orderId, token]);

  const sendLocation = useCallback(async (location, showAlert = false) => {
    const latest = location || currentLocation || getPoint(tracking?.rider);
    if (!latest) {
      if (showAlert) Alert.alert("Location unavailable", "Turn on GPS and allow location permission, then try again.");
      return;
    }

    setSendingLocation(true);
    try {
      await updateRiderLocation(token, latest);
      if (showAlert) Alert.alert("Location updated", "Rider location sent to backend.");
    } catch (error) {
      if (showAlert) Alert.alert("Location failed", error.message);
    } finally {
      setSendingLocation(false);
    }
  }, [currentLocation, token, tracking?.rider]);

  useEffect(() => {
    loadTracking()
      .catch((error) => Alert.alert("Could not load tracking", error.message))
      .finally(() => setLoading(false));

    const timer = setInterval(() => {
      loadTracking().catch(() => {});
    }, 30000);

    return () => clearInterval(timer);
  }, [loadTracking]);

  useEffect(() => {
    let alive = true;
    let subscription;

    async function startTracking() {
      if (!orderId || !isActiveDelivery) return;

      const permission = await ensureForegroundLocation();
      if (!alive) return;

      if (!permission.granted) {
        setStatusMessage(permission.message);
        return;
      }

      try {
        const firstLocation = await getCurrentRiderLocation();
        if (!alive || !firstLocation) return;
        setCurrentLocation(firstLocation);
        await sendLocation(firstLocation);
      } catch {
        if (alive) setStatusMessage("GPS is temporarily unavailable. Move outdoors or try again.");
      }

      subscription = await watchRiderLocation(async (location) => {
        if (!location) return;
        setCurrentLocation(location);
        await sendLocation(location);
      });
    }

    if (isStoppedDelivery) {
      setStatusMessage("Delivery tracking stopped.");
      setRoute(null);
      return undefined;
    }

    startTracking().catch(() => {
      if (alive) setStatusMessage("Could not start GPS tracking.");
    });

    return () => {
      alive = false;
      subscription?.remove();
    };
  }, [isActiveDelivery, isStoppedDelivery, orderId, sendLocation]);

  useEffect(() => {
    if (!isActiveDelivery || !currentLocation) return undefined;

    refreshRoute();
    const timer = setInterval(refreshRoute, ROUTE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [currentLocation, isActiveDelivery, refreshRoute]);

  async function runStatusAction(action) {
    if (!orderId || !action) return;

    setActionBusy(true);
    try {
      const body = action === "delivered" ? { cash_collected: tracking?.order?.grand_total || 0 } : undefined;
      await updateDeliveryStatus(token, orderId, action, body);
      await loadTracking();
      if (action === "delivered") setRoute(null);
    } catch (error) {
      Alert.alert("Action failed", error.message);
    } finally {
      setActionBusy(false);
    }
  }

  function openExternalNavigation() {
    const dropoff = getDropoffPoint(tracking);
    if (!dropoff) {
      Alert.alert("Customer coordinates missing", "Add delivery latitude and longitude to this order before external navigation.");
      return;
    }

    const destination = `${dropoff.latitude},${dropoff.longitude}`;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
  }

  if (loading) return <SafeAreaView style={styles.screen}><View style={styles.center}><ActivityIndicator color="#ff311f" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      {!tracking ? (
        <View style={styles.center}><EmptyState title="No active delivery" copy="Open an order to see live tracking." icon="location-outline" /></View>
      ) : (
        <>
          <DeliveryMap tracking={tracking} currentLocation={currentLocation} routeCoordinates={routeCoordinates} />
          <View style={{ position: "absolute", top: 48, left: 14, right: 14, minHeight: 62, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#0f172a", shadowOpacity: 0.12, shadowRadius: 12, elevation: 3 }}>
            {onBack ? <Pressable onPress={onBack} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}><Ionicons name="chevron-back" size={22} color="#111827" /></Pressable> : null}
            <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#f2f4f7" }}>
              <Ionicons name="receipt" size={18} color="#111827" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.infoName}>{status === "delivered" ? "Delivery Completed" : status === "picked_up" ? "Picked Up" : "En Route to Customer"}</Text>
              <Text style={styles.smallMuted}>{tracking.order?.order_code}</Text>
            </View>
            <View style={{ paddingHorizontal: 10, height: 32, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: isActiveDelivery ? "#12b76a" : "#667085" }}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>{tracking.order?.delivery_status_label || status}</Text>
            </View>
          </View>

          <View style={{ position: "absolute", right: 16, top: 210, gap: 14 }}>
            <Pressable onPress={() => sendLocation(null, true)} style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", shadowColor: "#0f172a", shadowOpacity: 0.12, shadowRadius: 10, elevation: 3 }}>
              {sendingLocation ? <ActivityIndicator color="#344054" /> : <Ionicons name="locate" size={22} color="#344054" />}
            </Pressable>
            <Pressable onPress={refreshRoute} style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", shadowColor: "#0f172a", shadowOpacity: 0.12, shadowRadius: 10, elevation: 3 }}>
              {routeLoading ? <ActivityIndicator color="#344054" /> : <Ionicons name="git-branch-outline" size={22} color="#344054" />}
            </Pressable>
          </View>

          <View style={{ position: "absolute", left: 14, right: 14, bottom: 22, padding: 14, gap: 12, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5edf7", shadowColor: "#0f172a", shadowOpacity: 0.14, shadowRadius: 18, elevation: 4 }}>
            {statusMessage ? (
              <View style={{ padding: 10, borderRadius: 8, backgroundColor: "#fff7ed" }}>
                <Text style={{ color: "#9a3412", fontSize: 12, fontWeight: "800" }}>{statusMessage}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#fff1f0" }}>
                <Ionicons name="person" size={24} color="#ff311f" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.infoName}>{customerName}</Text>
                <Text style={{ color: "#111827", fontSize: 18, fontWeight: "900" }}>{distanceText} <Text style={{ color: "#98a2b3" }}>•</Text> {etaText}</Text>
                <Text style={styles.smallMuted}>{tracking.order?.payment_label || (tracking.order?.paid ? "Paid" : "Cash")} • {tracking.order?.grand_total_formatted || ""}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <Ionicons name="location" size={21} color="#344054" />
              <Text style={[styles.addressLine, { flex: 1 }]}>{address || "Customer address pending"}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              <RoundAction icon="call" label="Call" color="#ff311f" onPress={() => contact && Linking.openURL(`tel:${contact}`)} />
              <RoundAction icon="logo-whatsapp" label="WhatsApp" color="#12b76a" onPress={() => contact && Linking.openURL(`https://wa.me/${String(contact).replace(/\D/g, "")}`)} />
              <RoundAction icon="navigate" label="Navigate" color="#ff311f" onPress={openExternalNavigation} />
            </View>
            <Timeline status={status} />
            {status === "assigned" ? (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><AppButton outline disabled={actionBusy} onPress={() => runStatusAction("reject")}>Reject</AppButton></View>
                <View style={{ flex: 1 }}><AppButton disabled={actionBusy} onPress={() => runStatusAction("accept")}>Accept</AppButton></View>
              </View>
            ) : primaryAction ? (
              <AppButton disabled={actionBusy} onPress={() => runStatusAction(primaryAction.action)}>{actionBusy ? "Working..." : primaryAction.label}</AppButton>
            ) : (
              <AppButton disabled>Delivery Completed</AppButton>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function getPrimaryAction(status) {
  switch (status) {
    case "accepted":
      return { action: "picked-up", label: "Picked Up" };
    case "picked_up":
      return { action: "on-way", label: "Start Delivery" };
    case "on_way":
      return { action: "delivered", label: "Delivered" };
    default:
      return null;
  }
}

function getDropoffPoint(tracking) {
  return getPoint(tracking?.dropoff) || getPoint(tracking?.order?.dropoff) || getPoint(tracking?.order?.customer) || getPoint(tracking?.customer);
}

function getDropoffAddress(tracking) {
  return tracking?.dropoff?.address || tracking?.order?.dropoff?.address || tracking?.order?.customer?.address || tracking?.customer?.address;
}

function getPoint(value) {
  if (!value) return null;
  const latitude = Number(value.latitude ?? value.lat ?? value.delivery_latitude ?? value.delivery_lat ?? value.location_lat);
  const longitude = Number(value.longitude ?? value.lng ?? value.lon ?? value.delivery_longitude ?? value.delivery_lng ?? value.location_lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude, accuracy: value.accuracy };
}

function RoundAction({ icon, label, color, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 6 }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: color }}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={{ color: "#111827", fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
