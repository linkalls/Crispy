import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ColorScheme } from "../utils/types";

export function Toast({
  visible,
  title,
  message,
  isError = false,
  colors,
  onHide,
}: {
  visible: boolean;
  title: string;
  message?: string;
  isError?: boolean;
  colors: ColorScheme;
  onHide: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, translateY, onHide]);

  if (!visible && (opacity as any)._value === 0) return null;

  return (
    <SafeAreaView style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: isError ? "#ff4444" : colors.cardBg,
            borderColor: isError ? "#ff4444" : colors.border,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Ionicons
          name={isError ? "alert-circle" : "checkmark-circle"}
          size={24}
          color={isError ? "#fff" : colors.primary}
        />
        <Text style={[styles.title, { color: isError ? "#fff" : colors.text }]}>
          {title}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
});
