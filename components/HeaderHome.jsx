import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LogoInmero from "./LogoInmero";

export default function HeaderHome() {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <LogoInmero width={140} height={150} />
      </View>
      <View style={styles.headerRight}>
        <Ionicons
          name="share-outline"
          size={20}
          color="#666"
          style={styles.shareIcon}
        />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ffffffff",
  },
  logoContainer: {
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  shareIcon: {
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "600",
    color: "#666",
    fontSize: 12,
  },
});
