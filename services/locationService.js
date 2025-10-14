/**
 * Servicio de geolocalización
 * Ubicación: services/locationService.js
 *
 * Módulo de servicios para obtener información geográfica (países, estados y ciudades)
 * utilizando la API de CountryStateCity.
 */
import axios from "axios";

// Constantes de configuración para la API
const API_KEY = "SThkSGZBV3Z4amdiSVduRlp0SkE4MEpwMnU4UWhpM2xOdDJERE5uWA==";
const BASE_URL = "https://api.countrystatecity.in/v1";
const headers = { "X-CSCAPI-KEY": API_KEY };

/**
 * Obtiene la lista de todos los países disponibles.
 * @returns {Promise<Array>} Array con la información de países.
 */
export const getCountries = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/countries`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo países:", error);
    return [];
  }
};

/**
 * Obtiene la lista de estados/provincias de un país específico.
 * @param {string} countryCode - Código ISO del país.
 * @returns {Promise<Array>} Array con la información de estados/provincias.
 */
export const getStates = async (countryCode) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/countries/${countryCode}/states`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error obteniendo estados:", error);
    return [];
  }
};

/**
 * Obtiene la lista de ciudades de un estado/provincia específico.
 * @param {string} countryCode - Código ISO del país.
 * @param {string} stateCode - Código del estado/provincia.
 * @returns {Promise<Array>} Array con la información de ciudades.
 */
export const getCities = async (countryCode, stateCode) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/countries/${countryCode}/states/${stateCode}/cities`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error obteniendo ciudades:", error);
    return [];
  }
};

/**
 * Obtiene el código telefónico de un país específico.
 * @param {string} countryCode - Código ISO del país.
 * @returns {Promise<string|null>} Código telefónico del país o null en caso de error.
 */
export const getCountryPhoneCode = async (countryCode) => {
  try {
    const response = await axios.get(`${BASE_URL}/countries/${countryCode}`, {
      headers,
    });
    return response.data.phonecode;
  } catch (error) {
    console.error("Error obteniendo código de país:", error);
    return null;
  }
};

/**
 * Obtiene los nombres completos de país, departamento y ciudad a partir de sus códigos.
 * @param {string} countryCode - Código ISO del país.
 * @param {string} stateCode - Código del estado/provincia.
 * @param {string} cityCode - ID de la ciudad.
 * @returns {Promise<Object>} Objeto con los nombres de país, departamento y ciudad.
 */
export const fetchLocationNames = async (countryCode, stateCode, cityCode) => {
  try {
    // Obtiene información del país
    const countryRes = await axios.get(`${BASE_URL}/countries/${countryCode}`, {
      headers,
    });
    const countryName = countryRes.data?.name || "Desconocido";

    // Obtiene información del estado/departamento
    const stateRes = await axios.get(
      `${BASE_URL}/countries/${countryCode}/states/${stateCode}`,
      { headers }
    );
    const stateName = stateRes.data?.name || "Desconocido";

    // Obtiene la lista de ciudades y busca la ciudad específica
    const citiesRes = await axios.get(
      `${BASE_URL}/countries/${countryCode}/states/${stateCode}/cities`,
      { headers }
    );
    const cityName =
      citiesRes.data?.find((city) => String(city.id) === String(cityCode))
        ?.name || "Desconocido";

    return { country: countryName, department: stateName, city: cityName };
  } catch (error) {
    console.error("Error obteniendo nombres de ubicación:", error);
    return {
      country: "Desconocido",
      department: "Desconocido",
      city: "Desconocido",
    };
  }
};

/**
 * Obtiene solo el nombre de la ciudad (útil para mostrar ubicaciones de forma concisa)
 * @param {string} countryCode - Código ISO del país.
 * @param {string} stateCode - Código del estado/provincia.
 * @param {string} cityCode - ID de la ciudad.
 * @returns {Promise<string>} Nombre de la ciudad o "Ubicación desconocida"
 */
export const getCityName = async (countryCode, stateCode, cityCode) => {
  try {
    const citiesRes = await axios.get(
      `${BASE_URL}/countries/${countryCode}/states/${stateCode}/cities`,
      { headers }
    );
    const cityName =
      citiesRes.data?.find((city) => String(city.id) === String(cityCode))
        ?.name || "Ubicación desconocida";

    return cityName;
  } catch (error) {
    console.error("Error obteniendo nombre de ciudad:", error);
    return "Ubicación desconocida";
  }
};
