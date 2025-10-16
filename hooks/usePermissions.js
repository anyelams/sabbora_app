// hooks/usePermissions.js
import { useEffect, useState } from "react";
import {
  checkAllPermissions,
  getCurrentLocation,
  requestLocationPermission,
  requestNotificationPermission,
} from "../services/permissions";

/**
 * Hook personalizado para gestionar permisos de la app
 *
 * @returns {Object} Estado y funciones para gestionar permisos
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState({
    location: false,
    notifications: false,
    locationStatus: "undetermined",
    notificationStatus: "undetermined",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Cargar permisos al montar el componente
  useEffect(() => {
    loadPermissions();
  }, []);

  /**
   * Carga el estado actual de todos los permisos
   */
  const loadPermissions = async () => {
    setIsLoading(true);
    try {
      const currentPermissions = await checkAllPermissions();
      setPermissions(currentPermissions);
    } catch (error) {
      console.error("Error cargando permisos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Solicita permiso de ubicación
   * @returns {Promise<boolean>} true si se concedió el permiso
   */
  const requestLocation = async () => {
    try {
      const result = await requestLocationPermission();
      await loadPermissions(); // Recargar estado
      return result.granted;
    } catch (error) {
      console.error("Error solicitando ubicación:", error);
      return false;
    }
  };

  /**
   * Solicita permiso de notificaciones
   * @returns {Promise<boolean>} true si se concedió el permiso
   */
  const requestNotifications = async () => {
    try {
      const result = await requestNotificationPermission();
      await loadPermissions(); // Recargar estado
      return result.granted;
    } catch (error) {
      console.error("Error solicitando notificaciones:", error);
      return false;
    }
  };

  /**
   * Obtiene la ubicación actual del usuario
   * @returns {Promise<Object|null>} Objeto con latitud, longitud y precisión
   */
  const getLocation = async () => {
    try {
      console.log("Iniciando obtención de ubicación desde hook...");
      const location = await getCurrentLocation();

      if (location) {
        console.log("Ubicación recibida en hook:", location);
        setCurrentLocation(location);
      } else {
        console.log("No se pudo obtener ubicación");
      }

      return location;
    } catch (error) {
      console.error("Error en getLocation hook:", error);
      return null;
    }
  };

  /**
   * Verifica si tiene permiso de ubicación y lo solicita si no
   * @returns {Promise<boolean>} true si tiene permiso
   */
  const ensureLocationPermission = async () => {
    if (permissions.location) {
      return true;
    }
    return await requestLocation();
  };

  /**
   * Verifica si tiene permiso de notificaciones y lo solicita si no
   * @returns {Promise<boolean>} true si tiene permiso
   */
  const ensureNotificationPermission = async () => {
    if (permissions.notifications) {
      return true;
    }
    return await requestNotifications();
  };

  return {
    // Estado
    permissions,
    isLoading,
    currentLocation,

    // Funciones
    loadPermissions,
    requestLocation,
    requestNotifications,
    getLocation,
    ensureLocationPermission,
    ensureNotificationPermission,

    // Helpers
    hasLocationPermission: permissions.location,
    hasNotificationPermission: permissions.notifications,
  };
}

/**
 * Hook para obtener la ubicación actual con manejo de permisos
 *
 * @returns {Object} Estado de la ubicación
 */
export function useLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
      } else {
        setError("No se pudo obtener la ubicación");
      }
    } catch (err) {
      console.error("Error obteniendo ubicación:", err);
      setError(err.message || "Error al obtener ubicación");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    location,
    error,
    isLoading,
    fetchLocation,
    clearError: () => setError(null),
  };
}
