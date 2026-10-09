import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, SafeAreaView, ScrollView, Text, View } from "react-native";
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const payload = await apiRequest(`/rider/earnings?period=${period}`, { token });
      setData(unwrap(payload));
      setLastUpdated(new Date());
    } catch (error) {
      Alert.alert("Could not load earnings", error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [period, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => load({ silent: true }), 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }

  const chartRows = useMemo(() => normalizeChartRows(data?.chart), [data?.chart]);
  const periodTitle = period === "daily" ? "Today" : period === "weekly" ? "This Week" : "This Month";

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TopBar title="My Earnings" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 104 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
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
              <View style={{ minHeight: 126, borderRadius: 8, padding: 16, overflow: "hidden", backgroundColor: "#141824" }}>
                <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 58, backgroundColor: "#ff311f" }} />
                <View style={{ position: "absolute", right: -34, top: -38, width: 128, height: 128, borderRadius: 64, backgroundColor: "rgba(255,107,33,0.45)" }} />
                <View style={{ position: "absolute", right: 52, bottom: -48, width: 118, height: 118, borderRadius: 59, backgroundColor: "rgba(255,255,255,0.12)" }} />
                <Text style={{ color: "#fff", fontWeight: "800" }}>Total Earnings</Text>
                <Text style={{ marginTop: 4, color: "#fff", fontSize: 32, fontWeight: "900" }}>{money(data.total_earnings || 0)}</Text>
                <View style={{ marginTop: 14, alignSelf: "flex-start", height: 28, borderRadius: 8, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.16)" }}>
                  <Ionicons name="radio-button-on" size={12} color="#2ef28f" />
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>Live earnings</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Metric label="Completed Orders" value={String(data.completed_orders || 0)} />
                <Metric label="Avg. per Delivery" value={money(data.average_per_delivery || 0)} />
              </View>
              <EarningsChart
                rows={chartRows}
                title={`${periodTitle} Earnings`}
                lastUpdated={lastUpdated}
              />
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
    <View style={{ flex: 1, minHeight: 68, justifyContent: "center", borderRadius: 8, padding: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5edf7" }}>
      <Text style={styles.smallMuted}>{label}</Text>
      <Text style={styles.orderAmount}>{value}</Text>
    </View>
  );
}

function EarningsChart({ rows, title, lastUpdated }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const best = rows.reduce((winner, row) => (row.value > winner.value ? row : winner), rows[0] || { label: "-", value: 0 });
  const updatedText = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--";

  return (
    <View style={{ padding: 14, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5edf7", gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={styles.flex1}>
          <Text style={styles.sectionHeading}>{title}</Text>
          <Text style={styles.smallMuted}>Updated {updatedText}</Text>
        </View>
        <View style={{ minHeight: 34, borderRadius: 8, paddingHorizontal: 10, justifyContent: "center", backgroundColor: "#ecfff4" }}>
          <Text style={{ color: "#0d8a4b", fontSize: 12, fontWeight: "900" }}>{money(total)}</Text>
        </View>
      </View>

      {rows.length ? (
        <>
          <View style={{ height: 170, paddingTop: 8, paddingBottom: 6 }}>
            <View style={{ position: "absolute", left: 0, right: 0, top: 30, height: 1, backgroundColor: "#edf2f9" }} />
            <View style={{ position: "absolute", left: 0, right: 0, top: 82, height: 1, backgroundColor: "#edf2f9" }} />
            <View style={{ position: "absolute", left: 0, right: 0, top: 134, height: 1, backgroundColor: "#edf2f9" }} />
            <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
              {rows.map((row, index) => {
                const height = Math.max(18, (row.value / max) * 126);
                const isBest = row.label === best.label && row.value === best.value && row.value > 0;
                return (
                  <View key={`${row.label}-${index}`} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                    <Text style={{ color: isBest ? "#ff311f" : "#667085", fontSize: 10, fontWeight: "900" }}>{shortMoney(row.value)}</Text>
                    <View style={{ width: "72%", maxWidth: 28, height, borderRadius: 8, overflow: "hidden", backgroundColor: isBest ? "#ff311f" : "#ff8a63" }}>
                      <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: Math.max(10, height * 0.42), backgroundColor: "rgba(255,255,255,0.22)" }} />
                    </View>
                    <Text numberOfLines={1} style={{ color: "#667085", fontSize: 10, fontWeight: "800", textAlign: "center" }}>{row.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={{ minHeight: 42, borderRadius: 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff5f2" }}>
            <Ionicons name="trending-up" size={18} color="#ff311f" />
            <Text style={{ flex: 1, color: "#7a0d05", fontSize: 12, fontWeight: "800" }}>Best point: {best.label}</Text>
            <Text style={{ color: "#7a0d05", fontSize: 12, fontWeight: "900" }}>{money(best.value)}</Text>
          </View>
        </>
      ) : (
        <EmptyState title="No chart data yet" icon="stats-chart-outline" />
      )}
    </View>
  );
}

function normalizeChartRows(chart) {
  return asList(chart)
    .map((item, index) => {
      const value = Number(item.earnings ?? item.earning ?? item.amount ?? item.total ?? item.value ?? 0);
      return {
        label: String(item.label || item.day || item.date || item.month || index + 1),
        value: Number.isFinite(value) ? value : 0
      };
    })
    .filter((item) => item.label);
}

function shortMoney(value) {
  const number = Number(value || 0);
  if (number >= 100000) return `Rs ${(number / 100000).toFixed(1)}L`;
  if (number >= 1000) return `Rs ${(number / 1000).toFixed(1)}k`;
  return `Rs ${number}`;
}
