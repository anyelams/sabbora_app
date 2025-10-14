// services/axiosPublic.js
import axios from "axios";

// URL base para tu API RestPaid
const API_BASE_URL = "https://api.inmero.co/restpaid";

const axiosPublic = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos timeout
});

// Interceptor para request (opcional - para logs)
axiosPublic.interceptors.request.use(
  (config) => {
    console.log(`[axiosPublic] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[axiosPublic] Request error:", error);
    return Promise.reject(error);
  }
);

// Interceptor para response (manejo de errores)
axiosPublic.interceptors.response.use(
  (response) => {
    console.log(
      `[axiosPublic] Response ${response.status} from ${response.config.url}`
    );
    return response;
  },
  (error) => {
    console.error(
      "[axiosPublic] Response error:",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default axiosPublic;
