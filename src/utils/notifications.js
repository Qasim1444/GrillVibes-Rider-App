import { Platform } from "react-native";
import Constants from "expo-constants";

function isExpoGo() {
  return Constants.appOwnership === "expo" || Constants.executionEnvironment === "storeClient";
}

export async function registerForPushNotificationsAsync() {
  // Expo Go no longer includes Android remote-push support from SDK 53 onward.
  // Keep the package out of the Expo Go runtime entirely; importing it itself
  // installs a push-token listener and causes a fatal runtime error there.
  if (Platform.OS === "web" || isExpoGo()) return null;

  const Notifications = await import("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  });

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  const response = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return response.data;
}
