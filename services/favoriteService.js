// services/favoriteService.js
import axiosPrivate from "./axiosPrivate";

/**
 * Obtiene todos los favoritos del usuario con sus IDs de favorito
 * @param {number} userId - ID del usuario
 * @param {number} limit - Límite de resultados (default: 100)
 * @param {number} offset - Offset para paginación (default: 0)
 * @returns {Promise} - Lista de favoritos con metadata
 */
export const getAllUserFavoritesWithIds = async (
  userId,
  limit = 100,
  offset = 0
) => {
  try {
    const response = await axiosPrivate.get(
      `/restaurants/location_favorites/?user_id=${userId}&limit=${limit}&offset=${offset}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching favorites with IDs:", error);
    return { data: [], meta: {} };
  }
};

/**
 * Agrega un restaurante como favorito
 * @param {number} userId - ID del usuario
 * @param {number} locationId - ID del restaurante
 * @returns {Promise} - Respuesta del servidor con el favorito creado
 */
export const addFavorite = async (userId, locationId) => {
  try {
    const response = await axiosPrivate.post(
      "/restaurants/location_favorites/",
      {
        user_id: userId,
        location_id: locationId,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

/**
 * Elimina un restaurante de favoritos
 * @param {number} favoriteId - ID del favorito (no el location_id)
 * @returns {Promise} - Respuesta del servidor
 */
export const removeFavorite = async (favoriteId) => {
  try {
    const response = await axiosPrivate.delete(
      `/restaurants/location_favorites/${favoriteId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};

/**
 * Toggle favorito - agrega si no existe, elimina si existe
 * @param {number} userId - ID del usuario
 * @param {number} locationId - ID del restaurante
 * @param {Map} favoriteIdsMap - Map de location_id -> favorite_id
 * @returns {Promise} - Respuesta del servidor y acción realizada
 */
export const toggleFavorite = async (userId, locationId, favoriteIdsMap) => {
  try {
    const favoriteId = favoriteIdsMap.get(locationId);

    if (favoriteId) {
      // Si existe, eliminarlo
      await removeFavorite(favoriteId);
      return { action: "removed", favoriteId };
    } else {
      // Si no existe, agregarlo
      const response = await addFavorite(userId, locationId);
      return { action: "added", data: response };
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};

/**
 * Obtiene los restaurantes favoritos del usuario
 * @param {number} userId - ID del usuario
 * @param {number} limit - Límite de resultados (default: 10)
 * @param {number} offset - Offset para paginación (default: 0)
 * @returns {Promise} - Lista de favoritos (array vacío si hay error)
 */
export const getUserFavorites = async (userId, limit = 10, offset = 0) => {
  try {
    const response = await axiosPrivate.get(
      `/restaurants/users/${userId}/favorite_locations?limit=${limit}&offset=${offset}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return []; // Retornar array vacío en vez de lanzar error
  }
};

/**
 * Obtiene el resumen de reviews de un restaurante
 * @param {number} locationId - ID del restaurante
 * @returns {Promise} - Resumen de reviews con rating promedio y total de reviews
 */
export const getLocationRatingSummary = async (locationId) => {
  try {
    // Endpoint específico para reviews de un restaurante
    const response = await axiosPrivate.get(
      `/review/reviews/location/${locationId}`
    );

    // Si hay reviews, extraer el location_summary de la primera review
    // (todas las reviews tienen el mismo location_summary)
    if (response.data?.data && response.data.data.length > 0) {
      const locationSummary = response.data.data[0].location_summary;
      return {
        average_rating: locationSummary?.average_rating || 0,
        total_reviews_count: locationSummary?.total_reviews_count || 0,
      };
    }

    // Si el restaurante no tiene reviews aún, retornar 0s
    return {
      average_rating: 0,
      total_reviews_count: 0,
    };
  } catch (error) {
    console.error(
      `Error fetching rating summary for location ${locationId}:`,
      error
    );
    // Retornar datos por defecto en caso de error
    return {
      average_rating: 0,
      total_reviews_count: 0,
    };
  }
};
