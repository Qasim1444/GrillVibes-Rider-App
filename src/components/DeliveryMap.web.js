import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function DeliveryMap() {
  return (
    <View style={{ flex: 1, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" }}>
      <View style={{ alignItems: "center", padding: 24, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.92)" }}>
        <Ionicons name="map-outline" size={48} color="#1463df" />
        <Text style={{ marginTop: 10, color: "#344054", fontSize: 15, fontWeight: "700" }}>Live map is available in the rider app</Text>
        <Text style={{ marginTop: 4, color: "#667085", fontSize: 12 }}>Use Android or iOS for GPS navigation.</Text>
      </View>
    </View>
  );
}
