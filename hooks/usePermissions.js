// hooks/usePermissions.js
import { useEffect, useState } from "react";
import {
  checkAllPermissions,
  getCurrentLocation,
  getUserLocation,
  requestLocationPermission,
  requestNotificationPermission,
  saveUserLocation,
} from "../services/permissions";

export function usePermissions() {
  const [permissions, setPermissions] = useState({
    location: false,
    notifications: false,
    locationStatus: "undetermined",
    notificationStatus: "undetermined",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setIsLoading(true);
    try {
      const currentPermissions = await checkAllPermissions();
      setPermissions(currentPermissions);

      // Cargar ubicación guardada del usuario
      const saved = await getUserLocation();
      if (saved) {
        setUserLocation(saved);
        console.log("Ubicación guardada cargada:", saved);
      }
    } catch (error) {
      console.error("Error cargando permisos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocation = async () => {
    try {
      const result = await requestLocationPermission();
      if (result.granted) {
        // Si se concedió el permiso, obtener ubicación por GPS
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location);
          return true;
        }
      }
      await loadPermissions();
      return result.granted;
    } catch (error) {
      console.error("Error solicitando ubicación:", error);
      return false;
    }
  };

  const requestNotifications = async () => {
    try {
      const result = await requestNotificationPermission();
      await loadPermissions();
      return result.granted;
    } catch (error) {
      console.error("Error solicitando notificaciones:", error);
      return false;
    }
  };

  const saveManualLocation = async (address, city) => {
    try {
      const locationData = {
        address,
        city,
        country: "Colombia",
        timestamp: new Date().toISOString(),
      };
      await saveUserLocation(locationData);
      setUserLocation(locationData);
      return true;
    } catch (error) {
      console.error("Error guardando ubicación manual:", error);
      return false;
    }
  };

  const ensureLocationPermission = async () => {
    if (permissions.location) {
      return true;
    }
    return await requestLocation();
  };

  const ensureNotificationPermission = async () => {
    if (permissions.notifications) {
      return true;
    }
    return await requestNotifications();
  };

  return {
    permissions,
    isLoading,
    userLocation,
    loadPermissions,
    requestLocation,
    requestNotifications,
    saveManualLocation,
    ensureLocationPermission,
    ensureNotificationPermission,
    hasLocationPermission: permissions.location,
    hasNotificationPermission: permissions.notifications,
  };
}
