import React, { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, unwrap } from "../api/client";
import { AppButton, TopBar } from "../components/ui";
import { styles } from "../styles";

export function ProfileScreen({ token, onLogout, onChangeTab, onOpenNotifications }) {
  const [profile, setProfile] = useState({});
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    apiRequest("/rider/profile", { token })
      .then((payload) => {
        const next = unwrap(payload);
        setProfile(next);
        setAvailable(Boolean(next.is_available));
      })
      .catch((error) => Alert.alert("Could not load profile", error.message));
  }, [token]);

  async function toggleAvailable() {
    const next = !available;
    setAvailable(next);
    try {
      await apiRequest("/rider/profile", { token, method: "POST", body: { ...profile, is_available: next } });
    } catch (error) {
      Alert.alert("Profile update failed", error.message);
      setAvailable(!next);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TopBar title="Profile" />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 104, gap: 10 }}>
        <View style={{ alignItems: "center", padding: 18, gap: 6 }}>
          <View style={{ width: 86, height: 86, borderRadius: 43, alignItems: "center", justifyContent: "center", backgroundColor: "#153728", borderWidth: 4, borderColor: "#fff" }}>
            <Ionicons name="person" size={48} color="#fff" />
          </View>
          <Text style={{ color: "#111827", fontSize: 22, fontWeight: "900" }}>{profile.name || "Rider"}</Text>
          <Text style={styles.smallMuted}>{profile.phone || profile.email || "No phone"}</Text>
          <Text style={styles.smallMuted}>{profile.vehicle_type || "Vehicle"} {profile.vehicle_number || ""}</Text>
          <Pressable onPress={toggleAvailable} style={{ marginTop: 8, minWidth: 128, height: 42, borderRadius: 21, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: available ? "#12b76a" : "#d1d5db" }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>{available ? "Online" : "Offline"}</Text>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff" }} />
          </Pressable>
        </View>
        <SettingsRow icon="person-outline" label="My Profile" valueText={profile.email || ""} />
        <SettingsRow icon="cash-outline" label="Earnings" onPress={() => onChangeTab?.("earnings")} />
        <SettingsRow icon="receipt-outline" label="Delivery History" onPress={() => onChangeTab?.("history")} />
        <SettingsRow icon="notifications-outline" label="Notifications" onPress={onOpenNotifications} />
        <AppButton outline icon="log-out-outline" onPress={onLogout}>Logout</AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, toggle, value, valueText, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 58, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5edf7", flexDirection: "row", alignItems: "center", gap: 14 }}>
      <Ionicons name={icon} size={24} color="#1f3157" />
      <Text style={{ flex: 1, color: "#1f3157", fontSize: 15, fontWeight: "800" }}>{label}</Text>
      {toggle ? (
        <View style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: value ? "#11a35b" : "#d1d5db", padding: 3 }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", transform: [{ translateX: value ? 22 : 0 }] }} />
        </View>
      ) : (
        <>
          {valueText ? <Text style={styles.smallMuted}>{valueText}</Text> : null}
          <Ionicons name="chevron-forward" size={20} color="#1f3157" />
        </>
      )}
    </Pressable>
  );
}
