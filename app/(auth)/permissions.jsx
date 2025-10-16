// app/(auth)/permissions.jsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import {
  getCurrentLocation,
  savePermissionsAsked,
} from "../../services/permissions";

/**
 * Pantalla de solicitud de permisos
 * Se muestra después del login para pedir permisos de ubicación y notificaciones
 */
export default function PermissionsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    location: null,
    notifications: null,
  });

  // Animaciones
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    // Animar entrada
    opacity.value = withDelay(100, withSpring(1));
    translateY.value = withDelay(100, withSpring(0));

    // Verificar permisos actuales
    checkCurrentPermissions();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const checkCurrentPermissions = async () => {
    try {
      // Verificar ubicación
      const locationStatus = await Location.getForegroundPermissionsAsync();
      setPermissions((prev) => ({
        ...prev,
        location: locationStatus.status === "granted",
      }));

      // Verificar notificaciones
      const notificationStatus = await Notifications.getPermissionsAsync();
      setPermissions((prev) => ({
        ...prev,
        notifications: notificationStatus.status === "granted",
      }));
    } catch (error) {
      console.error("Error verificando permisos:", error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissions((prev) => ({ ...prev, location: status === "granted" }));
      return status === "granted";
    } catch (error) {
      console.error("Error solicitando permiso de ubicación:", error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissions((prev) => ({
        ...prev,
        notifications: status === "granted",
      }));
      return status === "granted";
    } catch (error) {
      console.error("Error solicitando permiso de notificaciones:", error);
      return false;
    }
  };

  const handleRequestPermissions = async () => {
    setIsLoading(true);

    try {
      // Solicitar ubicación
      if (!permissions.location) {
        console.log("Solicitando permiso de ubicación...");
        const locationGranted = await requestLocationPermission();

        if (locationGranted) {
          console.log("Permiso de ubicación concedido");

          // Obtener y mostrar ubicación inmediatamente
          const currentLoc = await getCurrentLocation();
          if (currentLoc) {
            console.log("Primera ubicación obtenida:", currentLoc);
          }
        } else {
          console.log("Permiso de ubicación denegado");
          Alert.alert(
            "Permiso de ubicación",
            "La ubicación nos ayuda a encontrar restaurantes cerca de ti. Puedes habilitarlo más tarde en Configuración."
          );
        }
      }

      // Solicitar notificaciones
      if (!permissions.notifications) {
        console.log("Solicitando permiso de notificaciones...");
        const notificationGranted = await requestNotificationPermission();

        if (notificationGranted) {
          console.log("Permiso de notificaciones concedido");
        } else {
          console.log("Permiso de notificaciones denegado");
          Alert.alert(
            "Permiso de notificaciones",
            "Las notificaciones te mantienen informado sobre tus reservas. Puedes habilitarlas más tarde en Configuración."
          );
        }
      }

      // Marcar que ya se pidieron los permisos
      await savePermissionsAsked();
      console.log("Estado de permisos guardado");

      // Navegar a la pantalla principal
      router.replace("/(tabs)/welcome");
    } catch (error) {
      console.error("Error solicitando permisos:", error);
      Alert.alert(
        "Error",
        "Hubo un problema al solicitar los permisos. Continuando..."
      );
      router.replace("/(tabs)/welcome");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Marcar que ya se mostraron los permisos (aunque el usuario los saltó)
      await savePermissionsAsked();
      router.replace("/(tabs)/welcome");
    } catch (error) {
      console.error("Error guardando estado de permisos:", error);
      router.replace("/(tabs)/welcome");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Icono principal */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="checkmark-circle"
                size={80}
                color={colors.primary}
              />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>¡Bienvenido a Inmero!</Text>
          <Text style={styles.subtitle}>
            Para brindarte la mejor experiencia, necesitamos tu permiso para:
          </Text>

          {/* Lista de permisos */}
          <View style={styles.permissionsList}>
            {/* Ubicación */}
            <View style={styles.permissionItem}>
              <View style={styles.permissionIcon}>
                <Ionicons
                  name="location"
                  size={28}
                  color={
                    permissions.location === true
                      ? colors.success
                      : colors.primary
                  }
                />
              </View>
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>Ubicación</Text>
                <Text style={styles.permissionDescription}>
                  Encuentra restaurantes cerca de ti y obtén mejores
                  recomendaciones
                </Text>
              </View>
              {permissions.location === true && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              )}
            </View>

            {/* Notificaciones */}
            <View style={styles.permissionItem}>
              <View style={styles.permissionIcon}>
                <Ionicons
                  name="notifications"
                  size={28}
                  color={
                    permissions.notifications === true
                      ? colors.success
                      : colors.primary
                  }
                />
              </View>
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>Notificaciones</Text>
                <Text style={styles.permissionDescription}>
                  Recibe actualizaciones sobre tus reservas y ofertas especiales
                </Text>
              </View>
              {permissions.notifications === true && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              )}
            </View>
          </View>

          {/* Nota informativa */}
          <View style={styles.infoBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              Tus datos están protegidos. Puedes cambiar estos permisos en
              cualquier momento desde la configuración de tu dispositivo.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.footer}>
        <CustomButton
          text={isLoading ? "Procesando..." : "Permitir acceso"}
          onPress={handleRequestPermissions}
          variant="primary"
          disabled={isLoading}
          style={styles.button}
        />
        <CustomButton
          text="Más tarde"
          onPress={handleSkip}
          variant="outline"
          disabled={isLoading}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.primary,
  },
  title: {
    ...typography.bold.big,
    fontSize: 28,
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  permissionsList: {
    gap: 20,
    marginBottom: 24,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 4,
  },
  permissionDescription: {
    ...typography.regular.regular,
    color: colors.textSec,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: "flex-start",
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoText: {
    ...typography.regular.small,
    color: colors.textSec,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    width: "100%",
  },
});
