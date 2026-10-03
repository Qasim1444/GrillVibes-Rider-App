import React, { useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, getToken, unwrap } from "../api/client";
import { TOKEN_KEY } from "../config";
import { secureSet } from "../utils/storage";
import { styles } from "../styles";
import { AppButton, Brand, FlameLogo, HeaderWave } from "../components/ui";

export function SplashScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#5d0803", overflow: "hidden" }}>
      <StatusBar style="light" />
      <View style={{ position: "absolute", inset: 0, backgroundColor: "#8f1208" }} />
      <View style={{ position: "absolute", left: -80, right: -80, bottom: -70, height: 230, borderTopLeftRadius: 150, borderTopRightRadius: 150, backgroundColor: "#e43119", opacity: 0.65 }} />
      <View style={{ marginTop: 92, alignItems: "center", gap: 14 }}>
        <Brand light />
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>GOOD FOOD  HAPPY PEOPLE</Text>
      </View>
      <View style={{ position: "absolute", left: 38, right: 38, bottom: 150, height: 265, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 220, height: 132, borderRadius: 18, backgroundColor: "#ff311f", borderWidth: 4, borderColor: "#2b0b09", transform: [{ rotate: "-2deg" }], alignItems: "center", justifyContent: "center" }}>
          <FlameLogo size={64} />
          <Text style={{ marginTop: 8, color: "#fff", fontWeight: "900" }}>GrillVibes</Text>
        </View>
        <Ionicons name="bicycle" size={112} color="#22110b" style={{ marginTop: -14 }} />
      </View>
      <View style={{ position: "absolute", left: 24, right: 24, bottom: 70, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>Delivering Happiness</Text>
        <Text style={{ marginTop: 8, color: "#fff", fontSize: 16, fontWeight: "600" }}>One Order at a Time</Text>
        <View style={{ marginTop: 24, flexDirection: "row", gap: 8 }}>
          <View style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.35)" }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.35)" }} />
        </View>
      </View>
    </SafeAreaView>
  );
}

export function OnboardingScreen({ onDone }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="dark" />
      <Pressable onPress={onDone} style={{ position: "absolute", top: 52, right: 24, zIndex: 1 }}>
        <Text style={{ color: "#8090a8", fontWeight: "700" }}>Skip</Text>
      </Pressable>
      <View style={{ flex: 1, alignItems: "center", paddingTop: 110, paddingHorizontal: 24 }}>
        <Brand />
        <Text style={{ marginTop: 34, textAlign: "center", color: "#111827", fontSize: 25, lineHeight: 34, fontWeight: "900" }}>
          <Text style={{ color: "#ff311f" }}>Deliver</Text> Happiness{"\n"}With Every Order
        </Text>
        <Text style={{ marginTop: 24, color: "#71819a", textAlign: "center", lineHeight: 22, fontWeight: "600" }}>
          Be a part of the GrillVibes family and earn with flexible hours.
        </Text>
        <View style={{ marginTop: 60, width: 210, height: 210, borderRadius: 105, alignItems: "center", justifyContent: "center", backgroundColor: "#fff1e8" }}>
          <Ionicons name="bicycle" size={96} color="#1f2937" />
          <View style={{ position: "absolute", right: 12, top: 20, width: 54, height: 54, borderRadius: 27, backgroundColor: "#ff311f", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="location" size={34} color="#fff" />
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 28, paddingBottom: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#ff311f" }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#d9e0eb" }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#d9e0eb" }} />
        </View>
        <Pressable onPress={onDone} style={{ width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", backgroundColor: "#ff311f" }}>
          <Ionicons name="arrow-forward" size={28} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function LoginScreen({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    if (!login || !password) {
      Alert.alert("Missing details", "Enter your phone/email and password.");
      return;
    }

    submitting.current = true;
    setLoading(true);
    try {
      const payload = await apiRequest("/login", { method: "POST", body: { login, email: login, password } });
      const token = getToken(payload);
      if (!token) throw new Error("Login did not return a token.");
      const profile = await apiRequest("/rider/profile", { token });
      await secureSet(TOKEN_KEY, token);
      onLogin({ token, user: unwrap(profile) });
    } catch (error) {
      Alert.alert("Login failed", error.message);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="light" />
      <HeaderWave><Brand light /></HeaderWave>
      <View style={{ flex: 1, marginTop: -18, padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#fff", gap: 12 }}>
        <View style={[styles.modalInput, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
          <Ionicons name="call" size={18} color="#364152" />
          <Text style={{ color: "#178a49", fontWeight: "900" }}>+92</Text>
          <View style={{ width: 1, alignSelf: "stretch", backgroundColor: "#e5edf7" }} />
          <TextInput autoCapitalize="none" keyboardType="phone-pad" value={login} onChangeText={setLogin} placeholder="Phone Number or Email" style={{ flex: 1, color: "#111827", fontWeight: "600" }} />
        </View>
        <View style={[styles.modalInput, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
          <Ionicons name="lock-closed" size={18} color="#364152" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ flex: 1, color: "#111827", fontWeight: "600" }} />
        </View>
        <Text style={{ alignSelf: "flex-end", color: "#ff311f", fontSize: 12, fontWeight: "900" }}>Forgot Password?</Text>
        <AppButton onPress={submit} disabled={loading}>{loading ? "Logging in..." : "Login"}</AppButton>
        <View style={{ marginVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#e5edf7" }} />
          <Text style={styles.smallMuted}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#e5edf7" }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-around", opacity: 0.14 }}>
          {["restaurant", "pricetag", "cube"].map((icon) => <Ionicons key={icon} name={icon} size={54} color="#ff311f" />)}
        </View>
        <Text style={{ marginTop: "auto", marginBottom: 12, textAlign: "center", color: "#42506a", fontSize: 13, fontWeight: "600" }}>
          Don't have an account? <Text style={{ color: "#ff311f" }}>Contact Admin</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
