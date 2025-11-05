// services/notificationService.js
import axiosPrivate from "./axiosPrivate";

const BASE_URL = "/notifications/user_notifications";

/**
 * Obtiene las notificaciones de un usuario con paginación
 * @param {number} userId - ID del usuario
 * @param {number} limit - Cantidad de elementos (default: 10)
 * @param {number} offset - Desplazamiento (default: 0)
 * @returns {Promise<Object>} Objeto con data y meta (paginación)
 */
export const getUserNotifications = async (userId, limit = 10, offset = 0) => {
  try {
    const url = `${BASE_URL}/user/${userId}`;
    console.log("Obteniendo notificaciones - URL:", url);
    console.log("Params:", { limit, offset });

    const response = await axiosPrivate.get(url, {
      params: { limit, offset },
    });

    console.log("Notificaciones obtenidas:", response.data.data?.length);
    console.log("Meta:", response.data.meta);

    return response.data;
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    throw error;
  }
};

/**
 * Marca una notificación como leída
 * @param {number} userId - ID del usuario
 * @param {number} notificationId - ID de la notificación (notification.id, NO user_notification.id)
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const url = `${BASE_URL}/user/${userId}/notification/${notificationId}/read`;
    console.log("Marcando como leída - URL:", url);
    console.log("Método: PUT");

    const response = await axiosPrivate.put(url, {});

    console.log("Marcada como leída exitosamente");
    return response.data;
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
};

/**
 * Marca todas las notificaciones de un usuario como leídas
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const url = `${BASE_URL}/user/${userId}/read_all`;
    console.log("Marcando todas como leídas - URL:", url);
    console.log("Método: PUT");

    const response = await axiosPrivate.put(url, {});

    console.log("Todas marcadas como leídas");
    return response.data;
  } catch (error) {
    console.error("Error marcando todas como leídas:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
};

/**
 * Elimina una notificación
 * @param {number} userId - ID del usuario
 * @param {number} userNotificationId - ID de la notificación del usuario (user_notification.id)
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const deleteNotification = async (userId, userNotificationId) => {
  try {
    const url = `${BASE_URL}/user/${userId}/notification/${userNotificationId}`;
    console.log("Eliminando notificación - URL:", url);
    console.log("Método: DELETE");

    const response = await axiosPrivate.delete(url);

    console.log("Notificación eliminada");
    return response.data;
  } catch (error) {
    console.error("Error eliminando notificación:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
};

/**
 * Obtiene el conteo de notificaciones no leídas
 * @param {Array} notifications - Array de notificaciones
 * @returns {number} Cantidad de notificaciones no leídas
 */
export const getUnreadCount = (notifications) => {
  return notifications.filter((n) => !n.is_read).length;
};
