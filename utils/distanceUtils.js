// utils/distanceUtils.js

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} Distancia en kilómetros
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convierte grados a radianes
 * @param {number} degrees - Ángulo en grados
 * @returns {number} Ángulo en radianes
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Formatea la distancia para mostrarla de forma legible
 * @param {number} distanceKm - Distancia en kilómetros
 * @returns {string} Distancia formateada (ej: "2.3 km" o "850 m")
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Ordena un array de restaurantes por distancia a la ubicación del usuario
 * @param {Array} restaurants - Array de restaurantes con latitude y longitude
 * @param {number} userLat - Latitud del usuario
 * @param {number} userLon - Longitud del usuario
 * @returns {Array} Array ordenado por distancia (más cercano primero)
 */
export function sortByDistance(restaurants, userLat, userLon) {
  if (!userLat || !userLon) return restaurants;

  return restaurants
    .map((restaurant) => ({
      ...restaurant,
      distance: calculateDistance(
        userLat,
        userLon,
        restaurant.latitude,
        restaurant.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filtra restaurantes dentro de un radio específico
 * @param {Array} restaurants - Array de restaurantes
 * @param {number} userLat - Latitud del usuario
 * @param {number} userLon - Longitud del usuario
 * @param {number} radiusKm - Radio en kilómetros
 * @returns {Array} Restaurantes dentro del radio
 */
export function filterByRadius(restaurants, userLat, userLon, radiusKm = 10) {
  if (!userLat || !userLon) return restaurants;

  return restaurants.filter((restaurant) => {
    const distance = calculateDistance(
      userLat,
      userLon,
      restaurant.latitude,
      restaurant.longitude
    );
    return distance <= radiusKm;
  });
}
