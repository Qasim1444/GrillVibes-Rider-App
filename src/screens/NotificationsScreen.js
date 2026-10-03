import React, { useEffect, useState } from "react";
import { Alert, FlatList, SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, unwrap } from "../api/client";
import { asList } from "../utils/orders";
import { EmptyState, PillTabs, TopBar } from "../components/ui";
import { styles } from "../styles";

export function NotificationsScreen({ token, onBack }) {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiRequest("/rider/notifications", { token })
      .then((payload) => setItems(asList(unwrap(payload))))
      .catch((error) => Alert.alert("Could not load notifications", error.message));
  }, [token]);

  const visible = filter === "all" ? items : items.filter((item) => filter === "orders" ? item.order_code || item.delivery_status : !item.order_code);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TopBar title="Notifications" back onBack={onBack} />
      <View style={styles.content}>
        <PillTabs
          tabs={[{ key: "all", label: "All" }, { key: "orders", label: "Orders" }, { key: "system", label: "System" }]}
          active={filter}
          onChange={setFilter}
        />
        <FlatList
          data={visible}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={visible.length ? styles.list : styles.emptyList}
          ListEmptyComponent={<EmptyState title="No notifications" icon="notifications-outline" />}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={{ width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: item.delivery_status === "assigned" ? "#ff4c1f" : "#10a85b" }}>
                <Ionicons name={item.delivery_status === "earning" ? "cash" : "checkmark"} size={24} color="#fff" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.infoName}>{item.title}</Text>
                <Text style={styles.smallMuted}>{item.message || item.order_code}</Text>
                <Text style={styles.smallMuted}>{item.created_at}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
