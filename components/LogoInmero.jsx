// components/LogoInmero.jsx
import React from "react";
import { View, Image, StyleSheet } from "react-native";

export default function LogoInmero({ width = 150, height = 140 }) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={[styles.image, { width, height }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 4, // puedes ajustar esto desde el padre si necesitas
  },
  image: {
    // El tamaño se recibe por props
  },
});
