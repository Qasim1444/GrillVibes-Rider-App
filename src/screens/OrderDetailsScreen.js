import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { apiRequest, unwrap } from "../api/client";
import { asList, normalizeOrder } from "../utils/orders";
import { AppButton, EmptyState, Timeline, TopBar } from "../components/ui";
import { styles } from "../styles";

export function OrderDetailsScreen({ token, orderId, onBack, onTrack, onComplete }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deliveredOpen, setDeliveredOpen] = useState(false);
  const [cashCollected, setCashCollected] = useState("");
  const [notes, setNotes] = useState("");
  const [proofImage, setProofImage] = useState(null);

  const load = useCallback(async () => {
    const payload = await apiRequest(`/rider/orders/${orderId}`, { token });
    setOrder(normalizeOrder(unwrap(payload)));
  }, [orderId, token]);

  useEffect(() => {
    load()
      .catch((error) => Alert.alert("Could not load order", error.message))
      .finally(() => setLoading(false));
  }, [load]);

  async function mutate(suffix, body) {
    setBusy(true);
    try {
      await apiRequest(`/rider/orders/${orderId}/${suffix}`, { token, method: "POST", body });
      await load();
      onComplete?.(suffix, current);
    } catch (error) {
      Alert.alert("Action failed", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function pickProofImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to attach delivery proof.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });
    if (!result.canceled) setProofImage(result.assets[0]);
  }

  async function submitDelivered() {
    setBusy(true);
    try {
      if (proofImage) {
        const form = new FormData();
        if (cashCollected) form.append("cash_collected", cashCollected);
        if (notes) form.append("notes", notes);
        form.append("proof_image", {
          uri: proofImage.uri,
          name: proofImage.fileName || `proof-${orderId}.jpg`,
          type: proofImage.mimeType || "image/jpeg"
        });
        await apiRequest(`/rider/orders/${orderId}/delivered`, { token, method: "POST", body: form, formData: true });
      } else {
        await apiRequest(`/rider/orders/${orderId}/delivered`, {
          token,
          method: "POST",
          body: { cash_collected: Number(cashCollected || 0), notes }
        });
      }
      setDeliveredOpen(false);
      await load();
      onComplete?.("delivered", current);
    } catch (error) {
      Alert.alert("Delivery failed", error.message);
    } finally {
      setBusy(false);
    }
  }

  const current = order ? normalizeOrder(order) : null;
  const primary = useMemo(() => {
    switch (current?.delivery_status) {
      case "assigned":
        return { label: "I'll Pick Up the Order", run: () => mutate("accept") };
      case "accepted":
        return { label: "I've Picked Up", run: () => mutate("picked-up") };
      case "picked_up":
        return { label: "I'm On My Way", run: () => mutate("on-way") };
      case "on_way":
        return { label: "Mark Delivered", run: () => setDeliveredOpen(true) };
      default:
        return null;
    }
  }, [current?.delivery_status]);

  if (loading) return <SafeAreaView style={styles.screen}><View style={styles.center}><ActivityIndicator color="#ff311f" /></View></SafeAreaView>;
  if (!current) return <SafeAreaView style={styles.screen}><TopBar title="Order Details" back onBack={onBack} /><View style={styles.center}><EmptyState title="Order unavailable" /></View></SafeAreaView>;

  const contact = current.customer?.phone || current.customer?.contact;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TopBar
        title={`Order ${current.order_code}`}
        back
        onBack={onBack}
        right={<View style={{ marginRight: 12, paddingHorizontal: 10, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#ff7a1a" }}><Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>{current.delivery_status === "assigned" ? "New" : current.delivery_status_label}</Text></View>}
      />
      <ScrollView contentContainerStyle={styles.detailScroll}>
        <View style={styles.detailsCard}>
          <View style={styles.summaryRow}>
            <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "#fff1f0" }}>
              <Ionicons name="person" size={28} color="#ff311f" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.infoName}>{current.customer?.name || "Customer"}</Text>
              <Text style={styles.smallMuted}>{contact || "No phone"}</Text>
            </View>
            {contact ? (
              <View style={styles.contactBtns}>
                <Pressable onPress={() => Linking.openURL(`tel:${contact}`)} style={[styles.contactBtn, { backgroundColor: "#12b76a" }]}><Ionicons name="call" size={18} color="#fff" /></Pressable>
                <Pressable onPress={() => Linking.openURL(`https://wa.me/${String(contact).replace(/\D/g, "")}`)} style={[styles.contactBtn, { backgroundColor: "#12b76a" }]}><Ionicons name="logo-whatsapp" size={18} color="#fff" /></Pressable>
              </View>
            ) : null}
          </View>
          <View style={{ height: 1, backgroundColor: "#eef2f7" }} />
          <InfoBlock icon="location" color="#344054" name={current.customer?.address || "Address pending"} action="Open in Maps" onAction={onTrack} />
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionHeading}>Order Items</Text>
          {asList(current.items).length ? asList(current.items).map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.quantity || 1} x {item.name || item.fooditem?.name || item.food_item?.name || "Food item"}</Text>
              <Text style={styles.itemPrice}>{item.sub_total_formatted || item.total_formatted || item.price_formatted || ""}</Text>
            </View>
          )) : <Text style={styles.smallMuted}>No item details returned.</Text>}
        </View>

        {current.notes ? (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionHeading}>Notes</Text>
            <Text style={styles.smallMuted}>{current.notes}</Text>
          </View>
        ) : null}

        <View style={styles.detailsCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>Payment Method</Text>
            <Text style={styles.totalLabel}>{current.paid ? "Online Paid" : "Cash"}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: "#9b1c12", fontSize: 22 }]}>{current.grand_total_formatted}</Text>
          </View>
          <Timeline status={current.delivery_status} />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {current.delivery_status === "assigned" ? <View style={{ flex: 1 }}><AppButton outline disabled={busy} onPress={() => setRejectOpen(true)}>Reject</AppButton></View> : null}
          {primary ? <View style={{ flex: 1 }}><AppButton disabled={busy} onPress={primary.run}>{busy ? "Working..." : primary.label.replace("I've ", "").replace("I'm ", "")}</AppButton></View> : null}
        </View>
      </ScrollView>

      <Modal transparent visible={rejectOpen} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Order</Text>
            <TextInput value={rejectReason} onChangeText={setRejectReason} placeholder="Reason" multiline style={[styles.modalInput, styles.textArea]} />
            <AppButton disabled={busy || !rejectReason.trim()} onPress={() => { setRejectOpen(false); mutate("reject", { reason: rejectReason.trim() }); }}>Reject Order</AppButton>
            <AppButton outline onPress={() => setRejectOpen(false)}>Cancel</AppButton>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={deliveredOpen} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Complete Delivery</Text>
            <TextInput keyboardType="decimal-pad" value={cashCollected} onChangeText={setCashCollected} placeholder="Cash collected" style={styles.modalInput} />
            <TextInput value={notes} onChangeText={setNotes} placeholder="Notes" multiline style={[styles.modalInput, styles.textArea]} />
            {proofImage ? <Image source={{ uri: proofImage.uri }} style={styles.proofPreview} /> : null}
            <AppButton outline icon="image-outline" onPress={pickProofImage}>Add Proof Image</AppButton>
            <AppButton disabled={busy} onPress={submitDelivered}>Delivered Complete</AppButton>
            <AppButton outline onPress={() => setDeliveredOpen(false)}>Cancel</AppButton>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoBlock({ icon, color, title, name, address, contact, action, onAction }) {
  return (
    <View style={styles.infoBlock}>
      <Ionicons name={icon} size={24} color={color} />
      <View style={styles.flex1}>
        {title ? <Text style={styles.infoTitle}>{title}</Text> : null}
        <Text style={styles.infoName}>{name}</Text>
        {address ? <Text style={styles.addressLine}>{address}</Text> : null}
      </View>
      {contact ? (
        <View style={styles.contactBtns}>
          <Pressable onPress={() => Linking.openURL(`tel:${contact}`)} style={styles.contactBtn}><Ionicons name="call" size={18} color="#0ea55b" /></Pressable>
          <Pressable onPress={() => Linking.openURL(`https://wa.me/${String(contact).replace(/\D/g, "")}`)} style={styles.contactBtn}><Ionicons name="logo-whatsapp" size={18} color="#0ea55b" /></Pressable>
        </View>
      ) : null}
      {action ? (
        <Pressable onPress={onAction} style={{ minHeight: 38, borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#ff311f", flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="location" size={16} color="#ff311f" />
          <Text style={{ color: "#ff311f", fontWeight: "900", fontSize: 12 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
