// services/axiosPrivate.js
import axios from "axios";
import {
  clearSessionData,
  getRefreshToken,
  getToken,
  saveTokens,
} from "./auth";

// URL base para tu API RestPaid
const API_BASE_URL = "https://api.inmero.co/restpaid";

const axiosPrivate = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

let refreshPromise = null;

// -------------------------
// INTERCEPTOR DE REQUEST
// -------------------------
axiosPrivate.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      console.log(
        `[axiosPrivate] ${config.method?.toUpperCase()} ${config.url}`
      );
      return config;
    } catch (error) {
      console.error("[axiosPrivate] Error en request interceptor:", error);
      return config;
    }
  },
  (error) => {
    console.error("[axiosPrivate] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// -------------------------
// INTERCEPTOR DE RESPONSE
// -------------------------
axiosPrivate.interceptors.response.use(
  (response) => {
    console.log(
      `[axiosPrivate] Response ${response.status} from ${response.config.url}`
    );
    return response;
  },
  async (error) => {
    console.log("Entró al interceptor de error");
    const originalRequest = error.config;

    // Evitar interceptar el propio request de refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/refresh-token")
    ) {
      console.log("Token expirado, intentando refresh...");
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        const currentToken = await getToken();

        if (!refreshToken || !currentToken) {
          console.error("No hay tokens válidos para refresh");
          await clearSessionData();
          throw new Error("No hay tokens para refresh");
        }

        // Evitar múltiples requests de refresh simultáneos
        if (!refreshPromise) {
          refreshPromise = axios.post(
            `${API_BASE_URL}/users/refresh-token?refresh_token=${refreshToken}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${currentToken}`,
                "Content-Type": "application/json",
              },
            }
          );
        }

        console.log("Enviando request de refresh...");
        const response = await refreshPromise;
        refreshPromise = null;

        const {
          access_token,
          refresh_token: newRefreshToken,
          token_type,
        } = response.data;

        if (!access_token) {
          throw new Error("No se recibió nuevo token");
        }

        // Guardar nuevos tokens
        await saveTokens(
          access_token,
          newRefreshToken || refreshToken,
          token_type
        );
        console.log("Tokens actualizados exitosamente");

        // Actualizar el header del request original
        originalRequest.headers["Authorization"] = `Bearer ${access_token}`;

        // Reintentar el request original
        return axiosPrivate(originalRequest);
      } catch (refreshError) {
        console.error("Error refrescando token:", refreshError.message);

        if (refreshError.response) {
          console.error("Response status:", refreshError.response.status);
          console.error("Response data:", refreshError.response.data);
        }

        refreshPromise = null;

        // Limpiar sesión si falla el refresh
        await clearSessionData();

        throw refreshError;
      }
    }

    console.error(
      "[axiosPrivate] Response error:",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default axiosPrivate;
