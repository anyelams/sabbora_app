// app/(auth)/permissions.jsx
import { Ionicons } from "@expo/vector-icons";
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
import LocationSearchModal from "../../components/LocationDropdownModal";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { usePermissions } from "../../hooks/usePermissions";

export default function PermissionsScreen() {
  const router = useRouter();
  const {
    permissions,
    isLoading,
    requestLocationPermission,
    requestNotificationPermission,
    getCurrentLocation,
    saveManualLocation,
    markPermissionsAsked,
  } = usePermissions();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMessage, setShowMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const messageOpacity = useSharedValue(0);

  // Animaciones de entrada
  useEffect(() => {
    opacity.value = withDelay(100, withSpring(1));
    translateY.value = withDelay(100, withSpring(0));
  }, []);

  // Animación del toast
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

  // ==================== MANEJO DE PERMISOS ====================
  const handleRequestPermissions = async () => {
    setIsProcessing(true);

    try {
      // 1. Solicitar ubicación
      if (!permissions.location) {
        console.log("📍 Solicitando permiso de ubicación...");
        const locationResult = await requestLocationPermission();

        if (locationResult.granted) {
          // Permiso concedido: obtener ubicación GPS
          console.log("✅ Permiso de ubicación concedido");
          setShowMessage({
            type: "success",
            text: "Ubicación habilitada",
          });

          const location = await getCurrentLocation();
          if (location) {
            console.log("✅ Ubicación GPS obtenida");
          }
        } else if (locationResult.status === "denied") {
          // Permiso denegado: ofrecer ubicación manual
          console.log("❌ Permiso de ubicación denegado");
          setShowMessage({
            type: "info",
            text: "Ingresa tu ubicación manualmente",
          });

          // Pequeño delay para que vean el mensaje
          setTimeout(() => {
            setShowLocationModal(true);
          }, 1500);

          // Esperar a que el modal se cierre
          setIsProcessing(false);
          return; // No continuar hasta que seleccionen ubicación
        }
      }

      // 2. Solicitar notificaciones
      if (!permissions.notifications) {
        console.log("🔔 Solicitando permiso de notificaciones...");
        const notifResult = await requestNotificationPermission();

        if (notifResult.granted) {
          console.log("✅ Permiso de notificaciones concedido");
        } else {
          console.log("❌ Permiso de notificaciones denegado");
        }
      }

      // 3. Marcar como completado y navegar
      await markPermissionsAsked();
      console.log("✅ Proceso de permisos completado");

      setTimeout(() => {
        router.replace("/(tabs)/welcome");
      }, 1000);
    } catch (error) {
      console.error("❌ Error en proceso de permisos:", error);
      setShowMessage({
        type: "error",
        text: "Hubo un error. Intenta de nuevo",
      });
      // Aún así navegar después de un error
      setTimeout(() => {
        router.replace("/(tabs)/welcome");
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================== MANEJO DE UBICACIÓN MANUAL ====================
  const handleManualLocationSelect = async (locationData) => {
    setShowLocationModal(false);
    setIsProcessing(true);

    try {
      console.log("📍 Guardando ubicación manual:", locationData);
      const savedLocation = await saveManualLocation(locationData);

      if (savedLocation) {
        console.log("✅ Ubicación manual guardada");
        setShowMessage({
          type: "success",
          text: `Ubicación en ${locationData.cityName}`,
        });

        // Continuar con el flujo
        await markPermissionsAsked();

        setTimeout(() => {
          router.replace("/(tabs)/welcome");
        }, 1500);
      } else {
        throw new Error("No se pudo guardar la ubicación");
      }
    } catch (error) {
      console.error("❌ Error guardando ubicación manual:", error);
      setShowMessage({
        type: "error",
        text: "No se pudo guardar tu ubicación",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================== OMITIR ====================
  const handleSkip = async () => {
    try {
      await markPermissionsAsked();
      router.replace("/(tabs)/welcome");
    } catch (error) {
      console.error("Error marcando permisos:", error);
      router.replace("/(tabs)/welcome");
    }
  };

  // ==================== RENDER ====================
  return (
    <SafeAreaView style={styles.container}>
      {/* Toast de mensajes */}
      {showMessage && (
        <Animated.View
          style={[
            styles.toast,
            messageAnimatedStyle,
            showMessage.type === "error" && styles.toastError,
          ]}
        >
          <Ionicons
            name={
              showMessage.type === "success"
                ? "checkmark-circle"
                : showMessage.type === "error"
                ? "alert-circle"
                : "information-circle"
            }
            size={18}
            color={
              showMessage.type === "success"
                ? colors.success
                : showMessage.type === "error"
                ? colors.error
                : colors.primary
            }
          />
          <Text style={styles.toastText}>{showMessage.text}</Text>
        </Animated.View>
      )}

      {/* Modal de ubicación manual */}
      <LocationSearchModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleManualLocationSelect}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Antes de empezar</Text>
            <Text style={styles.subtitle}>
              Configura estos permisos para aprovechar al máximo Sabbora.
            </Text>
          </View>

          {/* Ilustración */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require("../../assets/images/location.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Lista de permisos */}
          <View style={styles.permissionsList}>
            <Animated.View
              entering={FadeInUp.delay(150)}
              style={[
                styles.permissionCard,
                permissions.location && styles.permissionCardGranted,
              ]}
            >
              <View style={styles.permissionIconWrapper}>
                <View
                  style={[
                    styles.iconCircle,
                    permissions.location && styles.iconCircleGranted,
                  ]}
                >
                  <Ionicons
                    name={
                      permissions.location ? "checkmark-circle" : "navigate"
                    }
                    size={18}
                    color={
                      permissions.location ? colors.success : colors.primary
                    }
                  />
                </View>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Ubicación</Text>
                <Text style={styles.permissionDesc}>
                  {permissions.location
                    ? "Permiso concedido"
                    : "Para sugerirte lugares cerca de ti."}
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(300)}
              style={[
                styles.permissionCard,
                permissions.notifications && styles.permissionCardGranted,
              ]}
            >
              <View style={styles.permissionIconWrapper}>
                <View
                  style={[
                    styles.iconCircle,
                    permissions.notifications && styles.iconCircleGranted,
                  ]}
                >
                  <Ionicons
                    name={
                      permissions.notifications
                        ? "checkmark-circle"
                        : "notifications"
                    }
                    size={16}
                    color={
                      permissions.notifications
                        ? colors.success
                        : colors.primary
                    }
                  />
                </View>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Notificaciones</Text>
                <Text style={styles.permissionDesc}>
                  {permissions.notifications
                    ? "Permiso concedido"
                    : "Te avisaremos cuando se acerque una reserva."}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Footer con botones */}
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
              text={isProcessing || isLoading ? "Configurando..." : "Continuar"}
              onPress={handleRequestPermissions}
              variant="primary"
              disabled={isProcessing || isLoading}
              style={styles.button}
            />

            <TouchableOpacity
              onPress={handleSkip}
              disabled={isProcessing || isLoading}
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
  toastError: {
    borderColor: "#ffe0e0",
    backgroundColor: "#fff5f5",
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
  permissionCardGranted: {
    backgroundColor: "#f0fff4",
    borderColor: "#c6f6d5",
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
  iconCircleGranted: {
    backgroundColor: colors.success + "20",
    borderColor: colors.success,
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
