// services/auth.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "restpaid_access_token";
const REFRESH_KEY = "restpaid_refresh_token";
const TOKEN_TYPE_KEY = "restpaid_token_type";
const USERNAME_KEY = "restpaid_username";
const USER_ID_KEY = "restpaid_user_id";

// ---------------------
// TOKENS
// ---------------------
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

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}

export async function getTokenType() {
  const tokenType = await AsyncStorage.getItem(TOKEN_TYPE_KEY);
  return tokenType || "bearer";
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, TOKEN_TYPE_KEY]);
}

// ---------------------
// USER INFO
// ---------------------
export async function saveUsername(username) {
  await AsyncStorage.setItem(USERNAME_KEY, username);
}

export async function getUsername() {
  return AsyncStorage.getItem(USERNAME_KEY);
}

export async function saveUserId(userId) {
  await AsyncStorage.setItem(USER_ID_KEY, userId.toString());
}

export async function getUserId() {
  const id = await AsyncStorage.getItem(USER_ID_KEY);
  return id ? parseInt(id) : null;
}

// ---------------------
// CLEAR ALL SESSION DATA
// ---------------------
export async function clearSessionData() {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    REFRESH_KEY,
    TOKEN_TYPE_KEY,
    USERNAME_KEY,
    USER_ID_KEY,
  ]);
}

// ---------------------
// UTILITY FUNCTIONS
// ---------------------
export async function getFullSession() {
  try {
    const [token, refreshToken, tokenType, username, userId] =
      await AsyncStorage.multiGet([
        TOKEN_KEY,
        REFRESH_KEY,
        TOKEN_TYPE_KEY,
        USERNAME_KEY,
        USER_ID_KEY,
      ]);

    return {
      token: token[1],
      refreshToken: refreshToken[1],
      tokenType: tokenType[1] || "bearer",
      username: username[1],
      userId: userId[1] ? parseInt(userId[1]) : null,
    };
  } catch (error) {
    console.error("Error obteniendo sesión completa:", error);
    return null;
  }
}
