import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { apiRequest, unwrap } from "./src/api/client";
import { ONBOARDED_KEY, TOKEN_KEY } from "./src/config";
import { registerForPushNotificationsAsync } from "./src/utils/notifications";
import { secureDelete, secureGet, secureSet } from "./src/utils/storage";
import { BottomTabs } from "./src/components/BottomTabs";
import { SplashScreen, OnboardingScreen, LoginScreen } from "./src/screens/AuthScreens";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { OrderDetailsScreen } from "./src/screens/OrderDetailsScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { EarningsScreen } from "./src/screens/EarningsScreen";
import { TrackingScreen } from "./src/screens/TrackingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { CompleteScreen } from "./src/screens/CompleteScreen";
import { styles } from "./src/styles";

export default function App() {
  const [booting, setBooting] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("orders");
  const [route, setRoute] = useState({ name: "tabs" });

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function restore() {
      const seen = await secureGet(ONBOARDED_KEY);
      const token = await secureGet(TOKEN_KEY);
      setOnboarded(Boolean(seen));

      if (token) {
        try {
          const profile = await apiRequest("/rider/profile", { token });
          setSession({ token, user: unwrap(profile) });
        } catch {
          await secureDelete(TOKEN_KEY);
        }
      }

      setBooting(false);
    }

    restore();
  }, []);

  useEffect(() => {
    async function registerPushToken() {
      if (!session?.token) return;

      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      try {
        await apiRequest("/rider/push-token", {
          token: session.token,
          method: "POST",
          body: { expo_push_token: token }
        });
      } catch {
        // Push token registration should never block the rider's workflow.
      }
    }

    registerPushToken();
  }, [session?.token]);

  async function finishOnboarding() {
    await secureSet(ONBOARDED_KEY, "1");
    setOnboarded(true);
  }

  async function logout() {
    try {
      if (session?.token) {
        await apiRequest("/logout", { token: session.token, method: "POST" });
      }
    } catch {
      // Keep local logout responsive if the backend token has already expired.
    }

    await secureDelete(TOKEN_KEY);
    setSession(null);
    setTab("orders");
    setRoute({ name: "tabs" });
  }

  async function quickAccept(orderId) {
    try {
      await apiRequest(`/rider/orders/${orderId}/accept`, { token: session.token, method: "POST" });
      setRoute({ name: "detail", orderId });
    } catch (error) {
      Alert.alert("Accept failed", error.message);
    }
  }

  if (showSplash || booting) return <SplashScreen />;
  if (!onboarded) return <OnboardingScreen onDone={finishOnboarding} />;
  if (!session) return <LoginScreen onLogin={setSession} />;

  if (route.name === "detail") {
    return (
      <OrderDetailsScreen
        token={session.token}
        orderId={route.orderId}
        onBack={() => setRoute({ name: "tabs" })}
        onTrack={() => setRoute({ name: "tracking", orderId: route.orderId })}
        onComplete={(action, completedOrder) => {
          if (action === "delivered") setRoute({ name: "complete", order: completedOrder });
        }}
      />
    );
  }

  if (route.name === "tracking") {
    return (
      <TrackingScreen
        token={session.token}
        orderId={route.orderId}
        onBack={() => setRoute({ name: "detail", orderId: route.orderId })}
      />
    );
  }

  if (route.name === "complete") {
    return <CompleteScreen order={route.order} onBack={() => { setTab("orders"); setRoute({ name: "tabs" }); }} />;
  }

  if (route.name === "notifications") {
    return <NotificationsScreen token={session.token} onBack={() => setRoute({ name: "tabs" })} />;
  }

  return (
    <View style={styles.appShell}>
      {tab === "orders" ? (
        <OrdersScreen
          token={session.token}
          user={session.user}
          onOpenOrder={(orderId) => setRoute({ name: "detail", orderId })}
          onQuickAccept={quickAccept}
          onOpenNotifications={() => setRoute({ name: "notifications" })}
          onChangeTab={setTab}
          onLogout={logout}
        />
      ) : tab === "earnings" ? (
        <EarningsScreen token={session.token} />
      ) : tab === "map" ? (
        <TrackingScreen token={session.token} />
      ) : tab === "profile" ? (
        <ProfileScreen token={session.token} onLogout={logout} />
      ) : (
        <HistoryScreen token={session.token} />
      )}
      <BottomTabs active={tab} onChange={setTab} />
    </View>
  );
}
