import Constants from "expo-constants";

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl || "http://127.0.0.1:8000/api";

export const TOKEN_KEY = "grillvibes_rider_token";
export const ONBOARDED_KEY = "grillvibes_rider_onboarded";

export const statusLabels = {
  assigned: "Assigned",
  accepted: "Accepted",
  picked_up: "Picked Up",
  on_way: "On the Way",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled"
};

export const statusSteps = ["accepted", "picked_up", "on_way", "delivered"];
