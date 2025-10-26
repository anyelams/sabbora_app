// app/(tabs)/profile.jsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import { usePermissions } from "../../hooks/usePermissions";

/**
 * Pantalla de perfil del usuario
 * Permite gestionar configuraciones personales como notificaciones,
 * ubicación, cambio de contraseña y cerrar sesión.
 */
const Profile = () => {
  const router = useRouter();
  const { cerrarSesion, username, userId, userEmail, fetchUserData } =
    useSession();
  const { getCurrentLocation } = usePermissions();

  // Estados locales para configuraciones
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  /**
   * Genera las iniciales del usuario desde el nombre completo
   */
  const getUserInitials = () => {
    if (!username) return "US";
    const names = username.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  /**
   * Verifica el estado actual de los permisos
   */
  const checkPermissions = async () => {
    try {
      // Verificar permisos de notificaciones
      const notifSettings = await Notifications.getPermissionsAsync();
      const previousNotifState = notificationsEnabled;
      setNotificationsEnabled(notifSettings.granted);

      // Verificar permisos de ubicación
      const locationSettings = await Location.getForegroundPermissionsAsync();
      const previousLocationState = locationEnabled;
      setLocationEnabled(locationSettings.granted);

      // Si el permiso de ubicación cambió de false a true, obtener ubicación GPS
      if (!previousLocationState && locationSettings.granted) {
        console.log("Permiso de ubicación concedido, obteniendo GPS...");
        const location = await getCurrentLocation();
        if (location) {
          console.log("Ubicación GPS actualizada:", location);
        }
      }
    } catch (e) {
      console.log("Error consultando permisos:", e);
    }
  };

  /**
   * Verifica permisos al cargar la pantalla
   */
  useEffect(() => {
    checkPermissions();
  }, []);

  /**
   * Escucha cuando la app vuelve al primer plano
   * (después de que el usuario vuelve de configuración del sistema)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // La app volvió al primer plano
        console.log("App en primer plano, verificando permisos...");
        checkPermissions();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [locationEnabled, notificationsEnabled]);

  /**
   * Carga los datos del usuario si no están disponibles
   */
  useEffect(() => {
    const loadUserData = async () => {
      // Si no tenemos email pero sí tenemos userId, intentar cargar los datos
      if (!userEmail && userId && !isLoadingUserData) {
        setIsLoadingUserData(true);
        try {
          await fetchUserData(userId);
          console.log("Datos de usuario cargados en Profile");
        } catch (error) {
          console.error("Error cargando datos de usuario:", error);
        } finally {
          setIsLoadingUserData(false);
        }
      }
    };
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail]);

  /**
   * Maneja el cierre de sesión del usuario
   */
  const handleLogout = async () => {
    try {
      await cerrarSesion();
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 100);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Navegar de todos modos para evitar quedarse atrapado
      router.replace("/(auth)/login");
    }
  };

  /**
   * Abre la configuración del sistema para gestionar notificaciones
   */
  const handleOpenNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (e) {
      console.log("Error abriendo configuración de notificaciones:", e);
    }
  };

  /**
   * Abre la configuración del sistema para gestionar ubicación
   */
  const handleOpenLocationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (e) {
      console.log("Error abriendo configuración de ubicación:", e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header de la pantalla */}
      <View style={styles.header}>
        <Text style={[typography.semibold.big, styles.headerTitle]}>
          Mi perfil
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tarjeta de información del usuario */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{username || "Usuario"}</Text>
            <Text style={styles.userEmail}>
              {userEmail || "correo@ejemplo.com"}
            </Text>
          </View>
        </View>

        {/* Sección General */}
        <Text style={styles.sectionLabel}>General</Text>

        {/* Configuración de notificaciones */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={handleOpenNotificationSettings}
        >
          <Text style={styles.optionText}>Notificaciones</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleOpenNotificationSettings}
            trackColor={{ false: colors.lightGray, true: colors.primary }}
            thumbColor={notificationsEnabled ? colors.white : "#f4f3f4"}
          />
        </TouchableOpacity>

        {/* Configuración de ubicación */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={handleOpenLocationSettings}
        >
          <Text style={styles.optionText}>Ubicación</Text>
          <Switch
            value={locationEnabled}
            onValueChange={handleOpenLocationSettings}
            trackColor={{ false: colors.lightGray, true: colors.primary }}
            thumbColor={locationEnabled ? colors.white : "#f4f3f4"}
          />
        </TouchableOpacity>

        {/* Opción para cambiar contraseña */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/profile/changePassword")}
        >
          <Text style={styles.optionText}>Cambiar contraseña</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textSec || colors.gray}
          />
        </TouchableOpacity>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={colors.red || "#e53935"}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal con safe area
  safeArea: {
    flex: 1,
    backgroundColor: colors.white || "#fff",
  },

  // Configuración del scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  headerTitle: {
    marginLeft: 10,
    color: colors.text,
  },
  // Tarjeta de información del usuario
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: colors.secondary || colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    ...typography.medium?.large,
    color: colors.white || "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.semibold?.medium,
    color: colors.text || colors.darkGray,
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    ...typography.regular?.large,
    color: colors.textSec || colors.gray,
    marginTop: 2,
    fontSize: 14,
  },

  // Etiquetas de sección
  sectionLabel: {
    ...typography.regular?.large,
    color: colors.textSec || colors.gray,
    marginTop: 16,
    marginBottom: 4,
    fontSize: 14,
  },

  // Filas de opciones de configuración
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  optionText: {
    ...typography.medium?.large,
    color: colors.text || colors.darkGray,
    fontSize: 16,
  },

  // Fila de cerrar sesión con estilo distintivo
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 16,
  },
  logoutText: {
    ...typography.medium?.large,
    color: colors.red || "#e53935",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Profile;
