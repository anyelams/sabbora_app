// services/auth.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// Claves para almacenar datos en AsyncStorage
const TOKEN_KEY = "restpaid_access_token";
const REFRESH_KEY = "restpaid_refresh_token";
const TOKEN_TYPE_KEY = "restpaid_token_type";
const USERNAME_KEY = "restpaid_username";
const USER_ID_KEY = "restpaid_user_id";
const USER_EMAIL_KEY = "restpaid_user_email";

// ---------------------
// GESTIÓN DE TOKENS
// ---------------------

/**
 * Guarda los tokens de autenticación en AsyncStorage
 * @param {string} accessToken - Token de acceso JWT
 * @param {string} refreshToken - Token para refrescar la sesión (opcional)
 * @param {string} tokenType - Tipo de token (por defecto "bearer")
 */
export async function saveTokens(
  accessToken,
  refreshToken = null,
  tokenType = "bearer"
) {
  const entries = [
    [TOKEN_KEY, accessToken],
    [TOKEN_TYPE_KEY, tokenType],
  ];
  if (refreshToken) {
    entries.push([REFRESH_KEY, refreshToken]);
  }
  await AsyncStorage.multiSet(entries);
}

/**
 * Obtiene el token de acceso almacenado
 * @returns {Promise<string|null>} Token de acceso o null si no existe
 */
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/**
 * Obtiene el refresh token almacenado
 * @returns {Promise<string|null>} Refresh token o null si no existe
 */
export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}

/**
 * Obtiene el tipo de token almacenado
 * @returns {Promise<string>} Tipo de token (por defecto "bearer")
 */
export async function getTokenType() {
  const tokenType = await AsyncStorage.getItem(TOKEN_TYPE_KEY);
  return tokenType || "bearer";
}

/**
 * Elimina únicamente los tokens de autenticación
 */
export async function clearTokens() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, TOKEN_TYPE_KEY]);
}

// ---------------------
// INFORMACIÓN DEL USUARIO
// ---------------------

/**
 * Guarda el nombre de usuario para mostrar en la UI
 * @param {string} username - Nombre completo del usuario
 */
export async function saveUsername(username) {
  await AsyncStorage.setItem(USERNAME_KEY, username);
}

/**
 * Obtiene el nombre de usuario almacenado
 * @returns {Promise<string|null>} Nombre de usuario o null
 */
export async function getUsername() {
  return AsyncStorage.getItem(USERNAME_KEY);
}

/**
 * Guarda el ID del usuario
 * @param {number} userId - ID del usuario
 */
export async function saveUserId(userId) {
  await AsyncStorage.setItem(USER_ID_KEY, userId.toString());
}

/**
 * Obtiene el ID del usuario almacenado
 * @returns {Promise<number|null>} ID del usuario o null
 */
export async function getUserId() {
  const id = await AsyncStorage.getItem(USER_ID_KEY);
  return id ? parseInt(id) : null;
}

/**
 * Guarda el email del usuario
 * @param {string} email - Email del usuario
 */
export async function saveUserEmail(email) {
  await AsyncStorage.setItem(USER_EMAIL_KEY, email);
}

/**
 * Obtiene el email del usuario almacenado
 * @returns {Promise<string|null>} Email del usuario o null
 */
export async function getUserEmail() {
  const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
  return email || null;
}

// ---------------------
// LIMPIEZA DE SESIÓN
// ---------------------

/**
 * Elimina todos los datos de sesión del usuario
 * Útil para logout o cuando el refresh token falla
 */
export async function clearSessionData() {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    REFRESH_KEY,
    TOKEN_TYPE_KEY,
    USERNAME_KEY,
    USER_ID_KEY,
    USER_EMAIL_KEY,
  ]);
}

// ---------------------
// FUNCIONES AUXILIARES
// ---------------------

/**
 * Obtiene toda la información de sesión almacenada
 * @returns {Promise<Object|null>} Objeto con toda la sesión o null si hay error
 */
export async function getFullSession() {
  try {
    const [token, refreshToken, tokenType, username, userId, userEmail] =
      await AsyncStorage.multiGet([
        TOKEN_KEY,
        REFRESH_KEY,
        TOKEN_TYPE_KEY,
        USERNAME_KEY,
        USER_ID_KEY,
        USER_EMAIL_KEY,
      ]);
    return {
      token: token[1],
      refreshToken: refreshToken[1],
      tokenType: tokenType[1] || "bearer",
      username: username[1],
      userId: userId[1] ? parseInt(userId[1]) : null,
      userEmail: userEmail[1],
    };
  } catch (error) {
    console.error("Error obteniendo sesión completa:", error);
    return null;
  }
}

/**
 * Extrae el primer nombre y primer apellido de un nombre completo
 * @param {string} fullName - Nombre completo del usuario
 * @returns {Object} Objeto con firstName y firstLastName
 */
export function getFirstNameAndLastName(fullName) {
  if (!fullName) return { firstName: "Anna", firstLastName: "" };
  const parts = fullName.trim().split(" ");
  return {
    firstName: parts[0] || "",
    firstLastName: parts[1] || "",
  };
}
