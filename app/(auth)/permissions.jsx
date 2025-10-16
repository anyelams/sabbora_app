// app/(auth)/permissions.jsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInUp,
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

export default function PermissionsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    location: null,
    notifications: null,
  });
  const [showMessage, setShowMessage] = useState(null);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const messageOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(100, withSpring(1));
    translateY.value = withDelay(100, withSpring(0));
    checkCurrentPermissions();
  }, []);

  useEffect(() => {
    if (showMessage) {
      messageOpacity.value = withSpring(1);
      const timer = setTimeout(() => {
        messageOpacity.value = withSpring(0);
        setTimeout(() => setShowMessage(null), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [
      { translateY: withSpring(messageOpacity.value === 1 ? 0 : -10) },
    ],
  }));

  const checkCurrentPermissions = async () => {
    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      setPermissions((prev) => ({
        ...prev,
        location: locationStatus.status === "granted",
      }));

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
      if (!permissions.location) {
        console.log("Solicitando permiso de ubicación...");
        const locationGranted = await requestLocationPermission();

        if (locationGranted) {
          console.log("Permiso de ubicación concedido");
          setShowMessage({
            type: "success",
            text: "Ubicación habilitada",
          });

          const currentLoc = await getCurrentLocation();
          if (currentLoc) {
            console.log("Primera ubicación obtenida:", currentLoc);
          }
        } else {
          console.log("Permiso de ubicación denegado");
        }
      }

      if (!permissions.notifications) {
        console.log("Solicitando permiso de notificaciones...");
        const notificationGranted = await requestNotificationPermission();

        if (notificationGranted) {
          console.log("Permiso de notificaciones concedido");
        } else {
          console.log("Permiso de notificaciones denegado");
        }
      }

      await savePermissionsAsked();
      console.log("Estado de permisos guardado");

      setTimeout(() => {
        router.replace("/(tabs)/welcome");
      }, 1000);
    } catch (error) {
      console.error("Error solicitando permisos:", error);
      router.replace("/(tabs)/welcome");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await savePermissionsAsked();
      router.replace("/(tabs)/welcome");
    } catch (error) {
      console.error("Error guardando estado de permisos:", error);
      router.replace("/(tabs)/welcome");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {showMessage && (
        <Animated.View style={[styles.toast, messageAnimatedStyle]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.toastText}>{showMessage.text}</Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Antes de empezar</Text>
            <Text style={styles.subtitle}>
              Configura estos permisos para aprovechar al máximo Sabbora.
            </Text>
          </View>

          <View style={styles.illustrationContainer}>
            <Image
              source={require("../../assets/images/location.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          <View style={styles.permissionsList}>
            <Animated.View
              entering={FadeInUp.delay(150)}
              style={styles.permissionCard}
            >
              <View style={styles.permissionIconWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="navigate" size={18} color={colors.primary} />
                </View>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Ubicación</Text>
                <Text style={styles.permissionDesc}>
                  Para sugerirte lugares cerca de ti.
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(300)}
              style={styles.permissionCard}
            >
              <View style={styles.permissionIconWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="notifications"
                    size={16}
                    color={colors.primary}
                  />
                </View>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Notificaciones</Text>
                <Text style={styles.permissionDesc}>
                  Te avisaremos cuando se acerque una reserva.
                </Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <Ionicons
                name="lock-closed-outline"
                size={14}
                color={colors.textSec}
              />
              <Text style={styles.infoText}>
                Puedes cambiar estos permisos más adelante
              </Text>
            </View>
            <CustomButton
              text={isLoading ? "Configurando..." : "Continuar"}
              onPress={handleRequestPermissions}
              variant="primary"
              disabled={isLoading}
              style={styles.button}
            />
            <TouchableOpacity
              onPress={handleSkip}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Omitir por ahora</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  toast: {
    position: "absolute",
    top: 60,
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    gap: 10,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  toastText: {
    ...typography.medium.medium,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    ...typography.bold.big,
    fontSize: 28,
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    ...typography.regular.large,
    color: colors.textSec,
    lineHeight: 24,
    textAlign: "center",
    fontSize: 15,
  },
  illustrationContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  illustration: {
    width: 200,
    height: 200,
  },
  permissionsList: {
    gap: 16,
  },
  permissionCard: {
    flexDirection: "row",
    backgroundColor: "#fafafa5c",
    padding: 18,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "#f0f0f07f",
  },
  permissionIconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  permissionContent: {
    flex: 1,
    justifyContent: "center",
  },
  permissionTitle: {
    ...typography.semibold.large,
    color: colors.text,
    fontSize: 16,
    marginBottom: 6,
  },
  permissionDesc: {
    ...typography.regular.medium,
    color: colors.textSec,
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    paddingTop: 40,
    gap: 16,
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  infoText: {
    ...typography.regular.small,
    color: colors.textSec,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    width: "100%",
  },
  skipText: {
    ...typography.semibold.medium,
    color: colors.textSec,
    textAlign: "center",
    paddingVertical: 12,
    fontSize: 14,
  },
});
