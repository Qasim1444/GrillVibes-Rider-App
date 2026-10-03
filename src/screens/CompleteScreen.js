import React from "react";
import { SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../components/ui";

export function CompleteScreen({ order, onBack }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#7a0d05" }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, marginTop: 48, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: "#fff", padding: 22, alignItems: "center" }}>
        <View style={{ marginTop: 28, width: 118, height: 92, borderRadius: 18, backgroundColor: "#ff311f", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 30, fontWeight: "900" }}>GV</Text>
          <View style={{ position: "absolute", top: -24, width: 60, height: 60, borderRadius: 30, backgroundColor: "#12b76a", alignItems: "center", justifyContent: "center", borderWidth: 5, borderColor: "#fff" }}>
            <Ionicons name="checkmark" size={34} color="#fff" />
          </View>
        </View>
        <Text style={{ marginTop: 20, color: "#111827", fontSize: 24, fontWeight: "900" }}>Delivery Completed!</Text>
        <Text style={{ marginTop: 4, color: "#536176", fontWeight: "800" }}>{order?.order_code || "#GRV"}</Text>
        <View style={{ alignSelf: "stretch", marginTop: 26, padding: 16, gap: 14, borderRadius: 8, borderWidth: 1, borderColor: "#e5edf7", backgroundColor: "#fff" }}>
          <ReceiptRow label="Customer" value={order?.customer?.name || "Customer"} />
          <ReceiptRow label="Total Amount" value={order?.grand_total_formatted || "Rs. 0"} />
          <ReceiptRow label="Payment" value={order?.paid ? "Online Paid" : "Cash"} />
          <ReceiptRow label="Delivered At" value={order?.delivered_at || "Just now"} />
        </View>
        <View style={{ alignSelf: "stretch", marginTop: "auto", marginBottom: 24 }}>
          <AppButton onPress={onBack}>Back to Orders</AppButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
      <Text style={{ color: "#667085", fontWeight: "700" }}>{label}</Text>
      <Text style={{ flex: 1, color: "#111827", fontWeight: "900", textAlign: "right" }}>{value}</Text>
    </View>
  );
}
