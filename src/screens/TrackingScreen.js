import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, unwrap } from "../api/client";
import { AppButton, EmptyState, Timeline } from "../components/ui";
import { styles } from "../styles";

export function TrackingScreen({ token, orderId, onBack }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    let timer;

    async function load() {
      if (!orderId) {
        setTracking(null);
        setLoading(false);
        return;
      }

      try {
        const payload = await apiRequest(`/rider/orders/${orderId}/tracking`, { token });
        setTracking(unwrap(payload));
      } catch (error) {
        Alert.alert("Could not load tracking", error.message);
      } finally {
        setLoading(false);
      }
    }

    load();
    timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [orderId, token]);

  async function sendLocation() {
    try {
      await apiRequest("/rider/location", {
        token,
        method: "POST",
        body: { lat: tracking?.rider?.lat, lng: tracking?.rider?.lng, accuracy: tracking?.rider?.accuracy || 15 }
      });
      Alert.alert("Location updated", "Rider location sent to backend.");
    } catch (error) {
      Alert.alert("Location failed", error.message);
    }
  }

  async function markDelivered() {
    try {
      await apiRequest(`/rider/orders/${orderId}/delivered`, {
        token,
        method: "POST",
        body: { cash_collected: tracking?.order?.grand_total || 0 }
      });
      Alert.alert("Delivery completed", "Order marked as delivered.");
    } catch (error) {
      Alert.alert("Delivery failed", error.message);
    }
  }

  if (loading) return <SafeAreaView style={styles.screen}><View style={styles.center}><ActivityIndicator color="#ff311f" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      {!tracking ? (
        <View style={styles.center}><EmptyState title="No active delivery" copy="Open an order to see live tracking." icon="location-outline" /></View>
      ) : (
        <>
          <MapSketch tracking={tracking} />
          <View style={{ position: "absolute", top: 48, left: 14, right: 14, minHeight: 62, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#0f172a", shadowOpacity: 0.12, shadowRadius: 12, elevation: 3 }}>
            {onBack ? <Pressable onPress={onBack} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}><Ionicons name="chevron-back" size={22} color="#111827" /></Pressable> : null}
            <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#f2f4f7" }}>
              <Ionicons name="receipt" size={18} color="#111827" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.infoName}>{tracking.order?.delivery_status === "picked_up" ? "Picked Up" : "En Route to Customer"}</Text>
              <Text style={styles.smallMuted}>{tracking.order?.order_code}</Text>
            </View>
            <View style={{ paddingHorizontal: 10, height: 32, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: tracking.order?.delivery_status === "picked_up" ? "#1463df" : "#12b76a" }}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>On Way</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </View>
          </View>
          <View style={{ position: "absolute", right: 16, top: 210, gap: 14 }}>
            {["volume-high", "locate"].map((icon) => (
              <Pressable key={icon} onPress={sendLocation} style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", shadowColor: "#0f172a", shadowOpacity: 0.12, shadowRadius: 10, elevation: 3 }}>
                <Ionicons name={icon} size={22} color="#344054" />
              </Pressable>
            ))}
          </View>
          <View style={{ position: "absolute", left: 14, right: 14, bottom: 22, padding: 14, gap: 12, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5edf7", shadowColor: "#0f172a", shadowOpacity: 0.14, shadowRadius: 18, elevation: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#fff1f0" }}>
                <Ionicons name="person" size={24} color="#ff311f" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.infoName}>{tracking.order?.customer?.name || tracking.customer?.name || "Customer"}</Text>
                <Text style={{ color: "#111827", fontSize: 18, fontWeight: "900" }}>{tracking.order?.distance_text || "4.8 km"} <Text style={{ color: "#98a2b3" }}>•</Text> {tracking.order?.eta_text || "12 min"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <Ionicons name="location" size={21} color="#344054" />
              <Text style={[styles.addressLine, { flex: 1 }]}>{tracking.dropoff?.address || tracking.order?.customer?.address || "Customer address pending"}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              <RoundAction icon="call" label="Call" color="#ff311f" onPress={() => tracking.order?.customer?.contact && Linking.openURL(`tel:${tracking.order.customer.contact}`)} />
              <RoundAction icon="logo-whatsapp" label="WhatsApp" color="#12b76a" onPress={() => tracking.order?.customer?.contact && Linking.openURL(`https://wa.me/${String(tracking.order.customer.contact).replace(/\D/g, "")}`)} />
              <RoundAction icon="navigate" label="Navigate" color="#ff311f" onPress={sendLocation} />
            </View>
            <Timeline status={tracking.order?.delivery_status || "on_way"} />
            {orderId ? <AppButton onPress={markDelivered}>Mark as Delivered</AppButton> : null}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function MapSketch({ tracking }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#dfeee9", overflow: "hidden" }}>
      {Array.from({ length: 18 }).map((_, index) => (
        <View key={index} style={{ position: "absolute", left: (index % 6) * 72 - 20, top: Math.floor(index / 6) * 160 + 50, width: 150, height: 4, borderRadius: 2, backgroundColor: index % 3 === 0 ? "#f7d777" : "#fff", transform: [{ rotate: index % 2 ? "28deg" : "-34deg" }] }} />
      ))}
      <View style={{ position: "absolute", left: 122, top: 132, width: 8, height: 310, borderRadius: 4, backgroundColor: "#0d7ff2", transform: [{ rotate: "-13deg" }] }} />
      <View style={{ position: "absolute", left: 172, top: 318, width: 8, height: 165, borderRadius: 4, backgroundColor: "#0d7ff2", transform: [{ rotate: "49deg" }] }} />
      <View style={{ position: "absolute", right: 84, top: 380, width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "#ff311f", borderWidth: 4, borderColor: "#fff" }}>
        <Ionicons name="location" size={24} color="#fff" />
      </View>
      <View style={{ position: "absolute", left: "43%", top: "26%", width: 54, height: 54, borderRadius: 27, backgroundColor: "#0d7ff2", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#fff" }}>
        <Ionicons name="bicycle" size={24} color="#07122c" />
      </View>
      <Text style={{ position: "absolute", left: 42, top: 210, color: "#111827", fontSize: 20, fontWeight: "700" }}>Vehari</Text>
      <Text style={{ position: "absolute", right: 86, top: 252, color: "#344054", fontSize: 16, fontWeight: "600" }}>Civil Lines</Text>
    </View>
  );
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
