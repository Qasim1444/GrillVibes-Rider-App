import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "../styles";

export function BottomTabs({ active, onChange }) {
  const tabs = [
    { key: "orders", label: "Orders", icon: "receipt-outline" },
    { key: "earnings", label: "Earnings", icon: "cash-outline" },
    { key: "map", label: "Map", icon: "location-outline" },
    { key: "profile", label: "Profile", icon: "person-outline" }
  ];

  return (
    <View style={styles.bottomTabs}>
      {tabs.map((tab) => {
        const selected = active === tab.key;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.bottomTab}>
            <Ionicons name={tab.icon} size={22} color={selected ? colors.red : "#1f3157"} />
            <Text style={[styles.bottomLabel, selected && styles.bottomLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
