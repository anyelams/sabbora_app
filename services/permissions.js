// services/permissions.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

const PERMISSIONS_ASKED_KEY = "@permissions_asked";
const USER_LOCATION_KEY = "@user_location";

export async function savePermissionsAsked() {
  try {
    await AsyncStorage.setItem(PERMISSIONS_ASKED_KEY, "true");
    console.log("Estado de permisos guardado");
  } catch (error) {
    console.error("Error guardando estado de permisos:", error);
  }
}

export async function getPermissionsAsked() {
  try {
    const value = await AsyncStorage.getItem(PERMISSIONS_ASKED_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error verificando estado de permisos:", error);
    return false;
  }
}

export async function resetPermissionsAsked() {
  try {
    await AsyncStorage.removeItem(PERMISSIONS_ASKED_KEY);
    console.log("Estado de permisos reseteado");
  } catch (error) {
    console.error("Error reseteando estado de permisos:", error);
  }
}

/**
 * Guarda la ubicación del usuario (GPS o manual)
 */
export async function saveUserLocation(locationData) {
  try {
    await AsyncStorage.setItem(USER_LOCATION_KEY, JSON.stringify(locationData));
    console.log("Ubicación del usuario guardada:", locationData);
  } catch (error) {
    console.error("Error guardando ubicación del usuario:", error);
  }
}

/**
 * Obtiene la ubicación guardada del usuario
 */
export async function getUserLocation() {
  try {
    const value = await AsyncStorage.getItem(USER_LOCATION_KEY);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo ubicación del usuario:", error);
    return null;
  }
}

/**
 * Elimina la ubicación guardada del usuario
 */
export async function clearUserLocation() {
  try {
    await AsyncStorage.removeItem(USER_LOCATION_KEY);
    console.log("Ubicación del usuario eliminada");
  } catch (error) {
    console.error("Error eliminando ubicación del usuario:", error);
  }
}

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
 * Obtiene códigos ISO2 del país y departamento usando Nominatim (OpenStreetMap)
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 * @returns {Promise<Object|null>} Objeto con códigos ISO2 o null
 */
async function getISO2Codes(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Sabbora-App/1.0",
        },
      }
    );

    if (!response.ok) {
      console.warn("Error en respuesta de Nominatim:", response.status);
      return null;
    }

    const data = await response.json();

    if (data && data.address) {
      // Extraer código de departamento del formato ISO3166-2-lvl4 (ej: "CO-VAC" -> "VAC")
      const fullRegionCode = data.address["ISO3166-2-lvl4"];
      const departmentCode = fullRegionCode
        ? fullRegionCode.split("-")[1]
        : null;

      return {
        countryCode: data.address.country_code?.toUpperCase() || null, // ISO2 país (ej: CO)
        departmentCode: departmentCode || null, // ISO2 departamento (ej: VAC)
        country: data.address.country || null,
        state: data.address.state || null,
        city:
          data.address.city ||
          data.address.town ||
          data.address.village ||
          null,
      };
    }

    return null;
  } catch (error) {
    console.error("Error obteniendo códigos ISO de Nominatim:", error);
    return null;
  }
}

/**
 * Obtiene la ubicación actual y hace reverse geocoding para obtener ciudad, país y códigos ISO
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

    console.log("Ubicación obtenida:");
    console.log("Latitud:", coords.latitude);
    console.log("Longitud:", coords.longitude);
    console.log("Precisión:", coords.accuracy, "metros");

    // Hacer reverse geocoding con Expo Location
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];

        // Obtener códigos ISO2 de Nominatim
        console.log("Obteniendo códigos ISO...");
        const isoData = await getISO2Codes(coords.latitude, coords.longitude);

        const locationInfo = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          // Información de ciudad y dirección
          city:
            isoData?.city ||
            address.city ||
            address.district ||
            "Ubicación desconocida",
          address: address.street || "",
          // Información de país
          country: isoData?.country || address.country || "Colombia",
          countryCode: isoData?.countryCode || address.isoCountryCode || "CO", // ISO2 (ej: CO)
          // Información de departamento/región
          department: isoData?.state || address.region || "",
          departmentCode: isoData?.departmentCode || "", // ISO2 del departamento (ej: VAC)
          // Metadatos
          timestamp: new Date().toISOString(),
        };

        console.log("Información de ubicación completa:", locationInfo);

        // Guardar la ubicación obtenida por GPS
        await saveUserLocation(locationInfo);

        return locationInfo;
      }
    } catch (geocodeError) {
      console.warn("Error en reverse geocoding:", geocodeError);
      // Devolver solo coordenadas si el geocoding falla
      const basicLocation = {
        ...coords,
        timestamp: new Date().toISOString(),
      };
      await saveUserLocation(basicLocation);
      return basicLocation;
    }

    return coords;
  } catch (error) {
    console.error("Error obteniendo ubicación:", error);
    return null;
  }
}

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
