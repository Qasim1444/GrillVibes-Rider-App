import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "../styles";
import { FoodThumb } from "./ui";
import { normalizeOrder } from "../utils/orders";

export function OrderCard({ order, onPress, onAccept }) {
  const item = normalizeOrder(order);
  const meta = [item.distance_text, item.eta_text].filter(Boolean);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.orderCard, { flexDirection: "column" }, pressed && styles.pressed]}>
      <View style={styles.rowBetween}>
        <Text style={styles.orderCode}>{item.order_code}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {item.created_ago ? <Text style={styles.smallMuted}>{item.created_ago}</Text> : null}
          <View style={{ paddingHorizontal: 9, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: item.delivery_status === "assigned" ? "#ff7a1a" : "#d8f8e8" }}>
            <Text style={{ color: item.delivery_status === "assigned" ? "#fff" : colors.green, fontSize: 11, fontWeight: "900" }}>{item.delivery_status === "assigned" ? "New" : item.delivery_status_label}</Text>
          </View>
        </View>
      </View>
      <View style={styles.orderInfo}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <Ionicons name="person" size={15} color={colors.red} />
          <Text style={styles.pickupName} numberOfLines={1}>{item.customer?.name || "Customer"}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <Ionicons name="location" size={15} color={colors.red} />
          <Text style={styles.addressLine} numberOfLines={1}>{item.customer?.address || item.dropoff?.address || "Address pending"}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name={item.paid ? "card" : "cash"} size={15} color="#344054" />
          <Text style={styles.metaTiny}>{item.payment_label || (item.paid ? "Online Paid" : "Cash")}</Text>
        </View>
        <View style={styles.rowBetween}>
          <View style={styles.inlineMeta}>
            <Ionicons name="radio-button-on" size={13} color="#344054" />
            <Text style={styles.metaTiny}>{item.grand_total_formatted}</Text>
            {meta.length ? <Text style={styles.metaTiny}>{meta.join("  ")}</Text> : null}
          </View>
          {item.delivery_status === "assigned" ? (
            <Pressable onPress={onAccept} style={[styles.acceptMini, { minWidth: 82, paddingHorizontal: 14 }]}>
              <Text style={styles.acceptMiniText}>Accept</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
