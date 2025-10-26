// hooks/usePermissions.js
// Hook consolidado que maneja TODOS los permisos y ubicación
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";

// ==================== CONSTANTES ====================
const STORAGE_KEYS = {
  PERMISSIONS_ASKED: "@permissions_asked",
  USER_LOCATION: "@user_location",
};

// ==================== CONFIGURACIÓN ====================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ==================== HELPER: GEOCODING ====================
/**
 * Obtiene códigos ISO2 y nombres de ubicación usando Nominatim
 */
async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: { "User-Agent": "Sabbora-App/1.0" },
      }
    );

    if (!response.ok) {
      console.warn("Error en Nominatim:", response.status);
      return null;
    }

    const data = await response.json();
    if (!data?.address) return null;

    const fullRegionCode = data.address["ISO3166-2-lvl4"];
    const departmentCode = fullRegionCode?.split("-")[1] || null;

    // Priorizar 'county' para municipios en Colombia
    const cityName =
      data.address.county ||
      data.address.city ||
      data.address.town ||
      data.address.village ||
      null;

    return {
      countryCode: data.address.country_code?.toUpperCase() || null,
      departmentCode,
      country: data.address.country || null,
      state: data.address.state || null,
      city: cityName,
    };
  } catch (error) {
    console.error("Error en reverse geocoding:", error);
    return null;
  }
}

// ==================== HOOK PRINCIPAL ====================
export function usePermissions() {
  // Estados
  const [permissions, setPermissions] = useState({
    location: false,
    notifications: false,
    locationStatus: "undetermined",
    notificationStatus: "undetermined",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);

  // ==================== STORAGE ====================
  const saveToStorage = useCallback(async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error guardando ${key}:`, error);
      setError(`No se pudo guardar ${key}`);
      return false;
    }
  }, []);

  const getFromStorage = useCallback(async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error obteniendo ${key}:`, error);
      return null;
    }
  }, []);

  const removeFromStorage = useCallback(async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error eliminando ${key}:`, error);
      return false;
    }
  }, []);

  // ==================== PERMISOS: VERIFICAR ====================
  const checkPermissions = useCallback(async () => {
    try {
      const [locationStatus, notificationStatus] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Notifications.getPermissionsAsync(),
      ]);

      const newPermissions = {
        location: locationStatus.status === "granted",
        notifications: notificationStatus.status === "granted",
        locationStatus: locationStatus.status,
        notificationStatus: notificationStatus.status,
      };

      setPermissions(newPermissions);
      return newPermissions;
    } catch (error) {
      console.error("Error verificando permisos:", error);
      setError("No se pudieron verificar los permisos");
      return permissions; // Retornar estado anterior
    }
  }, [permissions]);

  // ==================== PERMISOS: SOLICITAR ====================
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";

      setPermissions((prev) => ({
        ...prev,
        location: granted,
        locationStatus: status,
      }));

      return { granted, status };
    } catch (error) {
      console.error("Error solicitando ubicación:", error);
      setError("No se pudo solicitar permiso de ubicación");
      return { granted: false, status: "error" };
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";

      setPermissions((prev) => ({
        ...prev,
        notifications: granted,
        notificationStatus: status,
      }));

      return { granted, status };
    } catch (error) {
      console.error("Error solicitando notificaciones:", error);
      setError("No se pudo solicitar permiso de notificaciones");
      return { granted: false, status: "error" };
    }
  }, []);

  // ==================== UBICACIÓN: GPS ====================
  const getCurrentLocation = useCallback(async () => {
    try {
      // Verificar permiso primero
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permiso de ubicación no concedido");
        return null;
      }

      setIsLoading(true);

      // Obtener coordenadas GPS
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      console.log("📍 GPS obtenido:", coords);

      // Hacer reverse geocoding con Expo
      let locationInfo = { ...coords };

      try {
        const [expoGeocode, nominatimData] = await Promise.all([
          Location.reverseGeocodeAsync(coords),
          reverseGeocode(coords.latitude, coords.longitude),
        ]);

        if (expoGeocode?.[0]) {
          const address = expoGeocode[0];

          locationInfo = {
            ...coords,
            // Información de ciudad (prioriza Nominatim)
            city:
              nominatimData?.city ||
              address.city ||
              address.district ||
              "Ubicación desconocida",
            address: address.street || "",
            // Información de país
            country: nominatimData?.country || address.country || "Colombia",
            countryCode:
              nominatimData?.countryCode || address.isoCountryCode || "CO",
            // Información de departamento
            department: nominatimData?.state || address.region || "",
            departmentCode: nominatimData?.departmentCode || "",
            // Metadata
            timestamp: new Date().toISOString(),
            source: "gps",
            hasCoordinates: true,
          };

          console.log("📍 Ubicación completa:", locationInfo);
        }
      } catch (geocodeError) {
        console.warn("⚠️ Error en geocoding:", geocodeError);
        // Continuar con coordenadas básicas
        locationInfo = {
          ...coords,
          timestamp: new Date().toISOString(),
          source: "gps",
          hasCoordinates: true,
        };
      }

      // Guardar ubicación
      await saveToStorage(STORAGE_KEYS.USER_LOCATION, locationInfo);
      setUserLocation(locationInfo);

      return locationInfo;
    } catch (error) {
      console.error("❌ Error obteniendo ubicación GPS:", error);
      setError("No se pudo obtener tu ubicación");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  // ==================== UBICACIÓN: MANUAL ====================
  const saveManualLocation = useCallback(
    async (locationData) => {
      try {
        setIsLoading(true);

        // Importar dinámicamente el servicio de geocoding
        const { enrichLocationWithCoordinates } = await import(
          "../services/geocodingService"
        );

        // Enriquecer con coordenadas
        const enrichedLocation = await enrichLocationWithCoordinates(
          locationData
        );

        console.log("📍 Ubicación manual guardada:", enrichedLocation);

        // Guardar
        await saveToStorage(STORAGE_KEYS.USER_LOCATION, enrichedLocation);
        setUserLocation(enrichedLocation);

        return enrichedLocation;
      } catch (error) {
        console.error("❌ Error guardando ubicación manual:", error);
        setError("No se pudo guardar tu ubicación");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [saveToStorage]
  );

  // ==================== UBICACIÓN: CARGAR ====================
  const loadSavedLocation = useCallback(async () => {
    const saved = await getFromStorage(STORAGE_KEYS.USER_LOCATION);
    if (saved) {
      setUserLocation(saved);
      console.log("📍 Ubicación cargada desde storage:", saved);
    }
    return saved;
  }, [getFromStorage]);

  // ==================== UBICACIÓN: LIMPIAR ====================
  const clearLocation = useCallback(async () => {
    const success = await removeFromStorage(STORAGE_KEYS.USER_LOCATION);
    if (success) {
      setUserLocation(null);
      console.log("📍 Ubicación eliminada");
    }
    return success;
  }, [removeFromStorage]);

  // ==================== ESTADO DE PERMISOS SOLICITADOS ====================
  const markPermissionsAsked = useCallback(async () => {
    return await saveToStorage(STORAGE_KEYS.PERMISSIONS_ASKED, true);
  }, [saveToStorage]);

  const checkPermissionsAsked = useCallback(async () => {
    const asked = await getFromStorage(STORAGE_KEYS.PERMISSIONS_ASKED);
    return asked === true;
  }, [getFromStorage]);

  const resetPermissionsAsked = useCallback(async () => {
    return await removeFromStorage(STORAGE_KEYS.PERMISSIONS_ASKED);
  }, [removeFromStorage]);

  // ==================== HELPERS DE CONVENIENCIA ====================
  const ensureLocationPermission = useCallback(async () => {
    if (permissions.location) return true;
    const result = await requestLocationPermission();
    return result.granted;
  }, [permissions.location, requestLocationPermission]);

  const ensureNotificationPermission = useCallback(async () => {
    if (permissions.notifications) return true;
    const result = await requestNotificationPermission();
    return result.granted;
  }, [permissions.notifications, requestNotificationPermission]);

  // ==================== INICIALIZACIÓN ====================
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // Cargar permisos y ubicación en paralelo
        const [currentPermissions, savedLocation] = await Promise.all([
          checkPermissions(),
          loadSavedLocation(),
        ]);

        console.log("✅ Hook inicializado:", {
          permissions: currentPermissions,
          location: savedLocation,
        });
      } catch (error) {
        console.error("❌ Error inicializando hook:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []); // Solo al montar

  // ==================== RETURN ====================
  return {
    // Estado
    permissions,
    isLoading,
    userLocation,
    error,

    // Permisos
    checkPermissions,
    requestLocationPermission,
    requestNotificationPermission,
    ensureLocationPermission,
    ensureNotificationPermission,

    // Ubicación
    getCurrentLocation,
    saveManualLocation,
    loadSavedLocation,
    clearLocation,

    // Estado de permisos preguntados
    markPermissionsAsked,
    checkPermissionsAsked,
    resetPermissionsAsked,

    // Helpers booleanos
    hasLocationPermission: permissions.location,
    hasNotificationPermission: permissions.notifications,
    hasLocation: !!userLocation,
    locationSource: userLocation?.source,
  };
}
