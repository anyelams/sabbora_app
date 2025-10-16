// services/permissions.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

const PERMISSIONS_ASKED_KEY = "@permissions_asked";

/**
 * Guarda que ya se solicitaron los permisos al usuario
 */
export async function savePermissionsAsked() {
  try {
    await AsyncStorage.setItem(PERMISSIONS_ASKED_KEY, "true");
    console.log("Estado de permisos guardado");
  } catch (error) {
    console.error("Error guardando estado de permisos:", error);
  }
}

/**
 * Verifica si ya se solicitaron los permisos anteriormente
 */
export async function getPermissionsAsked() {
  try {
    const value = await AsyncStorage.getItem(PERMISSIONS_ASKED_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error verificando estado de permisos:", error);
    return false;
  }
}

/**
 * Resetea el estado de permisos (útil para testing o configuración)
 */
export async function resetPermissionsAsked() {
  try {
    await AsyncStorage.removeItem(PERMISSIONS_ASKED_KEY);
    console.log("Estado de permisos reseteado");
  } catch (error) {
    console.error("Error reseteando estado de permisos:", error);
  }
}

/**
 * Verifica el estado actual de todos los permisos
 */
export async function checkAllPermissions() {
  try {
    const locationStatus = await Location.getForegroundPermissionsAsync();
    const notificationStatus = await Notifications.getPermissionsAsync();

    return {
      location: locationStatus.status === "granted",
      notifications: notificationStatus.status === "granted",
      locationStatus: locationStatus.status,
      notificationStatus: notificationStatus.status,
    };
  } catch (error) {
    console.error("Error verificando permisos:", error);
    return {
      location: false,
      notifications: false,
      locationStatus: "undetermined",
      notificationStatus: "undetermined",
    };
  }
}

/**
 * Solicita permiso de ubicación
 */
export async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return {
      granted: status === "granted",
      status,
    };
  } catch (error) {
    console.error("Error solicitando permiso de ubicación:", error);
    return {
      granted: false,
      status: "error",
    };
  }
}

/**
 * Solicita permiso de notificaciones
 */
export async function requestNotificationPermission() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return {
      granted: status === "granted",
      status,
    };
  } catch (error) {
    console.error("Error solicitando permiso de notificaciones:", error);
    return {
      granted: false,
      status: "error",
    };
  }
}

/**
 * Obtiene la ubicación actual del usuario
 */
export async function getCurrentLocation() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== "granted") {
      console.log("Permiso de ubicación no concedido");
      return null;
    }

    console.log("Obteniendo ubicación...");
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };

    // LOGS AGREGADOS
    console.log("Ubicación obtenida:");
    console.log("Latitud:", coords.latitude);
    console.log("Longitud:", coords.longitude);
    console.log("Precisión:", coords.accuracy, "metros");
    console.log("Objeto completo:", coords);

    return coords;
  } catch (error) {
    console.error("Error obteniendo ubicación:", error);
    return null;
  }
}

/**
 * Configura el handler de notificaciones
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
