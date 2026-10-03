import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, unwrap } from "../api/client";
import { asList, money } from "../utils/orders";
import { EmptyState, PillTabs, TopBar } from "../components/ui";
import { styles } from "../styles";

export function EarningsScreen({ token }) {
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/rider/earnings?period=${period}`, { token })
      .then((payload) => setData(unwrap(payload)))
      .catch((error) => Alert.alert("Could not load earnings", error.message))
      .finally(() => setLoading(false));
  }, [period, token]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TopBar title="My Earnings" />
      <ScrollView contentContainerStyle={{ paddingBottom: 104 }}>
        <View style={styles.content}>
          <PillTabs
            tabs={[{ key: "daily", label: "Daily" }, { key: "weekly", label: "Weekly" }, { key: "monthly", label: "Monthly" }]}
            active={period}
            onChange={setPeriod}
          />
          {loading ? <View style={styles.center}><ActivityIndicator color="#ff311f" /></View> : !data ? (
            <View style={styles.center}><EmptyState title="No earnings data" icon="cash-outline" /></View>
          ) : (
            <View style={{ margin: 14, gap: 12 }}>
              <View style={{ minHeight: 112, borderRadius: 8, padding: 16, overflow: "hidden", backgroundColor: "#ff311f" }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>Total Earnings</Text>
                <Text style={{ color: "#fff", fontSize: 30, fontWeight: "900" }}>{money(data.total_earnings || 0)}</Text>
                <View style={{ position: "absolute", right: 14, bottom: 16, flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
                  {[24, 40, 54, 72].map((height, index) => <View key={index} style={{ width: 12, height, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.55)" }} />)}
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Metric label="Completed Orders" value={String(data.completed_orders || 0)} />
                <Metric label="Avg. per Delivery" value={money(data.average_per_delivery || 0)} />
              </View>
              <View style={{ padding: 14, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5edf7" }}>
                <Text style={styles.sectionHeading}>Weekly Earnings</Text>
                <View style={{ marginTop: 14, height: 126, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
                  {asList(data.chart).map((item, index) => {
                    const max = Math.max(...asList(data.chart).map((row) => Number(row.earnings || 0)), 1);
                    return (
                      <View key={item.date || index} style={{ alignItems: "center", gap: 6 }}>
                        <View style={{ width: 18, height: Math.max(18, (Number(item.earnings || 0) / max) * 92), borderRadius: 4, backgroundColor: "#ff311f" }} />
                        <Text style={{ color: "#667085", fontSize: 10, fontWeight: "800" }}>{item.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View style={{ padding: 14, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5edf7", gap: 8 }}>
              <Text style={styles.sectionHeading}>Recent Earnings</Text>
              {asList(data.recent).length ? asList(data.recent).map((item, index) => (
                <View key={index} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
                  <Ionicons name="checkmark-circle" size={38} color="#13aa5c" />
                  <View style={styles.flex1}>
                    <Text style={styles.orderCode}>{item.order_code}</Text>
                    <Text style={styles.smallMuted}>{item.created_at}</Text>
                  </View>
                  <Text style={styles.greenStrong}>{item.earned_formatted || item.earning || item.amount || money(0)}</Text>
                </View>
              )) : <EmptyState title="No recent earnings" icon="cash-outline" />}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }) {
  return (
    <View style={{ flex: 1, minHeight: 62, justifyContent: "center", borderRightWidth: 1, borderRightColor: "#e5edf7" }}>
      <Text style={styles.smallMuted}>{label}</Text>
      <Text style={styles.orderAmount}>{value}</Text>
    </View>
  );
}
