import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { apiRequest, unwrap } from "../api/client";
import { asList, normalizeOrder } from "../utils/orders";
import { EmptyState, FoodThumb, PillTabs, TopBar } from "../components/ui";
import { styles } from "../styles";

export function HistoryScreen({ token }) {
  const [filter, setFilter] = useState("completed");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/rider/history", { token })
      .then((payload) => setHistory(asList(unwrap(payload))))
      .catch((error) => Alert.alert("Could not load history", error.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filters = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Canceled" }
  ];

  const list = history.filter((item) => {
    const status = normalizeOrder(item).delivery_status;
    if (filter === "all") return true;
    if (filter === "completed") return status === "delivered";
    return status === "cancelled" || status === "rejected";
  });

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TopBar title="Delivery History" />
      <View style={styles.content}>
        <PillTabs tabs={filters} active={filter} onChange={setFilter} />
        {loading ? <View style={styles.center}><ActivityIndicator color="#ff311f" /></View> : (
          <FlatList
            data={list}
            keyExtractor={(item, index) => String(item.id || index)}
            contentContainerStyle={list.length ? styles.list : styles.emptyList}
            ListEmptyComponent={<EmptyState title="No history found" />}
            renderItem={({ item }) => {
              const order = normalizeOrder(item);
              return (
                <View style={styles.orderCard}>
                  <FoodThumb source={order.image} />
                  <View style={styles.flex1}>
                    <Text style={styles.orderCode}>{order.order_code}</Text>
                    <Text style={order.delivery_status === "cancelled" ? styles.redSmall : styles.greenText}>{order.delivery_status_label}</Text>
                    <Text style={styles.smallMuted}>{order.delivered_at || order.updated_at || order.created_at || ""}</Text>
                  </View>
                  <Text style={styles.orderAmount}>{order.grand_total_formatted}</Text>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
