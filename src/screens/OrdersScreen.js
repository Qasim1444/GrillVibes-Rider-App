import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, unwrap } from "../api/client";
import { asList, normalizeOrder } from "../utils/orders";
import { Brand, EmptyState, HeaderWave, PillTabs } from "../components/ui";
import { OrderCard } from "../components/OrderCard";
import { styles } from "../styles";

const EMPTY_TABS = { new_orders: [], my_orders: [], history_preview: [] };

export function OrdersScreen({ token, user, onOpenOrder, onOpenNotifications, onQuickAccept, onChangeTab, onLogout }) {
  const [active, setActive] = useState("new_orders");
  const [tabs, setTabs] = useState(EMPTY_TABS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    const payload = await apiRequest("/rider/home", { token });
    const data = unwrap(payload);
    setTabs({
      new_orders: asList(data.tabs?.new_orders),
      my_orders: asList(data.tabs?.my_orders),
      history_preview: asList(data.tabs?.history_preview)
    });
  }, [token]);

  useEffect(() => {
    load()
      .catch((error) => Alert.alert("Could not load orders", error.message))
      .finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (error) {
      Alert.alert("Refresh failed", error.message);
    } finally {
      setRefreshing(false);
    }
  }

  const orders = tabs[active] || [];
  const tabItems = [
    { key: "new_orders", label: "New Orders", count: tabs.new_orders.length },
    { key: "my_orders", label: "My Orders" },
    { key: "history_preview", label: "History" }
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <HeaderWave>
        <View style={{ width: "100%", paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={() => setMenuOpen(true)} style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="menu" size={26} color="#fff" />
          </Pressable>
          <Brand light compact />
          <View style={{ position: "absolute", bottom: -22, alignSelf: "center", left: "50%", marginLeft: -42, height: 30, borderRadius: 8, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#eafff1" }}>
            <Ionicons name="radio-button-on" size={12} color="#0ea55b" />
            <Text style={{ color: "#087a41", fontWeight: "900", fontSize: 12 }}>Online</Text>
          </View>
          <Pressable onPress={onOpenNotifications} style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </Pressable>
        </View>
      </HeaderWave>
      <View style={styles.content}>
        <PillTabs tabs={tabItems} active={active} onChange={setActive} />
        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#ff311f" /></View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item, index) => String(item.id || item.order_code || index)}
            contentContainerStyle={orders.length ? styles.list : styles.emptyList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            renderItem={({ item }) => {
              const order = normalizeOrder(item);
              return (
                <OrderCard
                  order={order}
                  onPress={() => onOpenOrder(order.id || order.order_code)}
                  onAccept={() => onQuickAccept(order.id || order.order_code)}
                />
              );
            }}
            ListEmptyComponent={<EmptyState title="No orders here" copy={`Pull down to refresh, ${user?.name || "rider"}.`} />}
          />
        )}
      </View>
      <AppMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        active={active}
        counts={{ my_orders: tabs.my_orders.length }}
        onPick={(target) => {
          setMenuOpen(false);
          if (target === "notifications") onOpenNotifications?.();
          else if (target === "logout") onLogout?.();
          else if (target === "orders") {
            onChangeTab?.("orders");
            setActive("new_orders");
          } else if (target === "my_orders") {
            onChangeTab?.("orders");
            setActive("my_orders");
          } else {
            onChangeTab?.(target);
          }
        }}
      />
    </SafeAreaView>
  );
}

function AppMenu({ visible, onClose, onPick, counts }) {
  const items = [
    { key: "orders", label: "Home", icon: "home" },
    { key: "my_orders", label: "My Orders", icon: "receipt-outline", count: counts.my_orders },
    { key: "earnings", label: "Earnings", icon: "cash-outline" },
    { key: "history", label: "History", icon: "time-outline" },
    { key: "profile", label: "Profile", icon: "person-outline" },
    { key: "notifications", label: "Notifications", icon: "notifications-outline" }
  ];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", flexDirection: "row" }}>
        <Pressable style={{ width: "74%", maxWidth: 310, paddingTop: 56, paddingHorizontal: 22, backgroundColor: "#061014", borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>
          <Brand light />
          <View style={{ marginTop: 34, gap: 8 }}>
            {items.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={() => onPick(item.key)}
                style={{
                  minHeight: 48,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  backgroundColor: index === 0 ? "#ff311f" : "transparent"
                }}
              >
                <Ionicons name={item.icon} size={20} color="#fff" />
                <Text style={{ flex: 1, color: "#fff", fontSize: 15, fontWeight: "800" }}>{item.label}</Text>
                {item.count ? (
                  <View style={{ minWidth: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#ff311f" }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>{item.count}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => onPick("logout")} style={{ marginTop: 24, minHeight: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Ionicons name="log-out-outline" size={21} color="#ff311f" />
            <Text style={{ color: "#ff311f", fontSize: 15, fontWeight: "900" }}>Logout</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
