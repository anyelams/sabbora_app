// services/geocodingService.js

/**
 * Obtiene coordenadas (lat, lon) a partir de una dirección o ciudad
 * usando Nominatim (OpenStreetMap)
 * @param {Object} params - Parámetros de búsqueda
 * @param {string} params.city - Nombre de la ciudad
 * @param {string} params.state - Nombre del departamento/estado
 * @param {string} params.country - Nombre del país
 * @param {string} params.address - Dirección específica (opcional)
 * @returns {Promise<Object|null>} Objeto con coordenadas o null
 */
export async function getCoordinatesFromLocation({
  city,
  state,
  country = "Colombia",
  address = "",
}) {
  try {
    // Construir query de búsqueda
    let query = "";

    if (address) {
      // Si hay dirección específica, incluirla
      query = `${address}, ${city}, ${state}, ${country}`;
    } else {
      // Solo ciudad, departamento y país
      query = `${city}, ${state}, ${country}`;
    }

    console.log("Geocoding query:", query);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&limit=1` +
        `&addressdetails=1`,
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

    if (data && data.length > 0) {
      const result = data[0];

      const coordinates = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
        accuracy: "city", // Indicador de que es aproximado
        source: "geocoding",
      };

      console.log("Coordenadas obtenidas:", coordinates);
      return coordinates;
    }

    console.warn("No se encontraron coordenadas para:", query);
    return null;
  } catch (error) {
    console.error("Error en geocoding:", error);
    return null;
  }
}

/**
 * Geocoding alternativo usando la API de CountryStateCity
 * (útil si ya tienes los IDs de ciudad de esa API)
 * @param {string} cityName - Nombre de la ciudad
 * @param {string} stateName - Nombre del departamento
 * @param {string} countryName - Nombre del país
 * @returns {Promise<Object|null>}
 */
export async function getCoordinatesFromCityName(
  cityName,
  stateName,
  countryName = "Colombia"
) {
  return getCoordinatesFromLocation({
    city: cityName,
    state: stateName,
    country: countryName,
  });
}

/**
 * Valida que las coordenadas estén dentro de un rango razonable
 * @param {number} latitude
 * @param {number} longitude
 * @returns {boolean}
 */
export function validateCoordinates(latitude, longitude) {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Obtiene información detallada de una ubicación (reverse + forward geocoding)
 * Útil para obtener tanto coordenadas como información completa de la dirección
 * @param {Object} locationData - Datos de ubicación del modal
 * @returns {Promise<Object>} Ubicación completa con coordenadas
 */
export async function enrichLocationWithCoordinates(locationData) {
  try {
    const coordinates = await getCoordinatesFromLocation({
      city: locationData.cityName,
      state: locationData.stateName,
      country: locationData.countryName,
      address: locationData.address || "",
    });

    if (!coordinates) {
      // Si no se pueden obtener coordenadas, devolver sin ellas
      console.warn("No se pudieron obtener coordenadas para la ubicación");
      return {
        city: locationData.cityName,
        department: locationData.stateName,
        country: locationData.countryName,
        countryCode: locationData.countryCode,
        departmentCode: locationData.stateCode,
        cityId: locationData.cityId,
        address: locationData.address || "",
        timestamp: new Date().toISOString(),
        source: "manual",
        hasCoordinates: false,
      };
    }

    // Validar coordenadas
    if (!validateCoordinates(coordinates.latitude, coordinates.longitude)) {
      console.error("Coordenadas inválidas:", coordinates);
      return {
        city: locationData.cityName,
        department: locationData.stateName,
        country: locationData.countryName,
        countryCode: locationData.countryCode,
        departmentCode: locationData.stateCode,
        cityId: locationData.cityId,
        address: locationData.address || "",
        timestamp: new Date().toISOString(),
        source: "manual",
        hasCoordinates: false,
      };
    }

    // Devolver ubicación enriquecida con coordenadas
    return {
      city: locationData.cityName,
      department: locationData.stateName,
      country: locationData.countryName,
      countryCode: locationData.countryCode,
      departmentCode: locationData.stateCode,
      cityId: locationData.cityId,
      address: locationData.address || "",
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      accuracy: coordinates.accuracy,
      displayName: coordinates.displayName,
      timestamp: new Date().toISOString(),
      source: "manual_geocoded", // Indica que es manual pero con coordenadas
      hasCoordinates: true,
    };
  } catch (error) {
    console.error("Error enriqueciendo ubicación:", error);
    // En caso de error, devolver sin coordenadas
    return {
      city: locationData.cityName,
      department: locationData.stateName,
      country: locationData.countryName,
      countryCode: locationData.countryCode,
      departmentCode: locationData.stateCode,
      cityId: locationData.cityId,
      address: locationData.address || "",
      timestamp: new Date().toISOString(),
      source: "manual",
      hasCoordinates: false,
    };
  }
}
