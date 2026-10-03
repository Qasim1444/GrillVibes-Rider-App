import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "../styles";
import { statusLabels, statusSteps } from "../config";

export function Brand({ light = false, compact = false }) {
  return (
    <View style={styles.brandBlock}>
      <Ionicons name="flame" size={compact ? 20 : 30} color={colors.red} />
      <Text style={[compact ? styles.brandCompact : styles.brandText, light && styles.brandLight]}>
        Grill<Text style={styles.brandAccent}>Vibes</Text>
      </Text>
      <Text style={[styles.brandRider, light && styles.brandRiderLight]}>Rider</Text>
    </View>
  );
}

export function FlameLogo({ size = 76 }) {
  return (
    <View style={[styles.logoMark, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="flame" size={Math.round(size * 0.48)} color="#fff" />
      <Text style={styles.logoGV}>GV</Text>
    </View>
  );
}

export function HeaderWave({ children }) {
  return (
    <View style={styles.waveHeader}>
      <View style={styles.headerGlowA} />
      <View style={styles.headerGlowB} />
      {children}
    </View>
  );
}

export function TopBar({ title, back, onBack, right }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        {back ? (
          <Pressable onPress={onBack} style={styles.topIcon}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        ) : null}
        <Text style={styles.topTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function AppButton({ children, onPress, icon, disabled, outline = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        outline ? styles.outlineButton : styles.hotButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={outline ? colors.red : "#fff"} /> : null}
      <Text style={[styles.buttonText, outline && styles.outlineText]}>{children}</Text>
    </Pressable>
  );
}

export function PillTabs({ tabs, active, onChange }) {
  return (
    <View style={styles.pillTabs}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={[styles.pillTab, active === tab.key && styles.pillTabActive]}
        >
          <Text style={[styles.pillText, active === tab.key && styles.pillTextActive]}>
            {tab.label}
            {tab.count ? `  ${tab.count}` : ""}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function EmptyState({ title, copy, icon = "receipt-outline" }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={44} color={colors.orange} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {copy ? <Text style={styles.emptyCopy}>{copy}</Text> : null}
    </View>
  );
}

export function FoodThumb({ source }) {
  return (
    <View style={styles.foodThumb}>
      {source ? <Image source={{ uri: source }} style={styles.foodImage} /> : <Ionicons name="fast-food" size={30} color="#fff" />}
    </View>
  );
}

export function Timeline({ status }) {
  const index = Math.max(statusSteps.indexOf(status), status === "assigned" ? -1 : 0);

  return (
    <View style={styles.timeline}>
      {statusSteps.map((step, stepIndex) => {
        const done = stepIndex <= index;
        return (
          <View key={step} style={styles.timelineItem}>
            <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
              <Ionicons name={done ? "checkmark" : "ellipse"} size={done ? 14 : 8} color="#fff" />
            </View>
            <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>{statusLabels[step]}</Text>
          </View>
        );
      })}
    </View>
  );
}
