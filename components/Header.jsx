// components/Header.jsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Componente Header reutilizable para pantallas internas
 * Proporciona navegación hacia atrás, título principal, descripción opcional
 * y espacio para componentes adicionales en el lado derecho
 * @param {Object} props
 * @param {string} props.title - Título principal del header
 * @param {string} [props.description] - Descripción opcional debajo del título
 * @param {boolean} [props.showBackButton=true] - Si mostrar el botón de retroceso
 * @param {Function} [props.onBackPress] - Función personalizada para el botón back (por defecto usa router.back())
 * @param {React.ReactNode} [props.rightComponent] - Componente opcional para mostrar en el lado derecho
 */
const Header = ({
  title,
  description,
  showBackButton = true,
  onBackPress,
  rightComponent,
}) => {
  const router = useRouter();

  /**
   * Maneja el evento de presionar el botón de retroceso
   * Usa función personalizada si se proporciona, de lo contrario usa router.back()
   */
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Primera fila: botón back y componente derecho */}
      <View style={styles.topRow}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={21}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : (
          // Placeholder para mantener alineación cuando no hay botón back
          <View style={styles.placeholder} />
        )}

        {/* Contenedor para componentes adicionales del lado derecho */}
        <View style={styles.rightContainer}>{rightComponent}</View>
      </View>

      {/* Segunda fila: título y descripción opcional */}
      <View style={styles.contentRow}>
        <Text style={styles.headerTitle}>{title}</Text>
        {description && (
          <Text style={styles.headerDescription}>{description}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal del header
  container: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    padding: 7,
    borderRadius: 19,
    backgroundColor: colors.base,
  },
  // Contenedor para componentes del lado derecho
  rightContainer: {
    alignItems: "flex-end",
  },
  placeholder: {
    width: 40,
  },
  contentRow: {
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  headerTitle: {
    ...typography.semibold.big,
    color: colors.text,
    marginBottom: 4,
  },
  // Descripción opcional debajo del título
  headerDescription: {
    ...typography.regular.large,
    color: colors.textSec,
    letterSpacing: 0.1,
  },
});

export default Header;
