import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  clearSessionData,
  getRefreshToken,
  getToken,
  getUserId,
  getUsername,
  saveTokens,
  saveUserId,
  saveUsername,
} from "../services/auth";

// -------------------------
// Contexto de sesión
// -------------------------
const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [token, setTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);
  const [username, setUsernameState] = useState(null);
  const [userId, setUserIdState] = useState(null);
  const [tokenType, setTokenTypeState] = useState("bearer");

  // -------------------------
  // GUARDAR SESIÓN COMPLETA
  // -------------------------
  const guardarSesionCompleta = async ({
    token,
    refreshToken = null,
    tokenType = "bearer",
    userId = null,
    username = null,
  }) => {
    if (!token) {
      throw new Error("Token es requerido");
    }

    // Guardar tokens
    await saveTokens(token, refreshToken, tokenType);
    setTokenState(token);
    setRefreshTokenState(refreshToken);
    setTokenTypeState(tokenType);

    // Guardar información del usuario
    if (username) {
      await saveUsername(username);
      setUsernameState(username);
    }

    if (userId) {
      await saveUserId(userId);
      setUserIdState(userId);
    }
  };

  // -------------------------
  // CARGAR SESIÓN INICIAL
  // -------------------------
  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const savedToken = await getToken();
        const savedRefreshToken = await getRefreshToken();
        const savedUsername = await getUsername();
        const savedUserId = await getUserId();

        if (savedToken) {
          setTokenState(savedToken);

          // Decodificar token para obtener userId si no está guardado
          const tokenPayload = decodificarToken(savedToken);
          if (tokenPayload?.user_id && !savedUserId) {
            setUserIdState(tokenPayload.user_id);
            await saveUserId(tokenPayload.user_id);
          } else if (savedUserId) {
            setUserIdState(savedUserId);
          }
        }

        if (savedRefreshToken) setRefreshTokenState(savedRefreshToken);
        if (savedUsername) setUsernameState(savedUsername);
      } catch (error) {
        console.error("Error cargando la sesión:", error);
      }
    };
    cargarSesion();
  }, []);

  // -------------------------
  // CERRAR SESIÓN
  // -------------------------
  const cerrarSesion = async () => {
    try {
      // Intentar hacer logout en el servidor si hay refresh token
      if (refreshToken) {
        try {
          const axiosPrivate = (await import("../services/axiosPrivate"))
            .default;
          await axiosPrivate.post("/users/logout", {
            refresh_token: refreshToken,
          });
          console.log("Logout exitoso en el servidor");
        } catch (logoutError) {
          console.error("Error en logout del servidor:", logoutError);
        }
      }

      // Limpiar datos locales siempre (incluso si falla el logout en el servidor)
      await clearSessionData();
      setTokenState(null);
      setRefreshTokenState(null);
      setUsernameState(null);
      setUserIdState(null);
      setTokenTypeState("bearer");
      console.log("Sesión cerrada exitosamente");
    } catch (error) {
      console.error("Error en logout:", error);
      try {
        await clearSessionData();
        setTokenState(null);
        setRefreshTokenState(null);
        setUsernameState(null);
        setUserIdState(null);
        setTokenTypeState("bearer");
      } catch (cleanupError) {
        console.error("Error en limpieza de datos:", cleanupError);
      }
    }
  };

  // -------------------------
  // HELPERS
  // -------------------------
  const decodificarToken = useCallback(
    (tokenParam = null) => {
      const tokenADecodificar = tokenParam || token;
      if (!tokenADecodificar) return null;
      try {
        const payload = tokenADecodificar.split(".")[1];
        return JSON.parse(atob(payload));
      } catch (error) {
        console.error("Error decodificando token:", error);
        return null;
      }
    },
    [token]
  );

  const tokenEsValido = useCallback(() => {
    const claims = decodificarToken();
    if (!claims) return false;
    const ahora = Math.floor(Date.now() / 1000);
    return claims.exp > ahora;
  }, [decodificarToken]);

  // -------------------------
  // VALOR DEL CONTEXTO
  // -------------------------
  const contextValue = {
    // Estados
    token,
    refreshToken,
    tokenType,
    username,
    userId,
    setUsername: setUsernameState,

    // Funciones principales
    guardarSesionCompleta,
    cerrarSesion,

    // Helpers
    decodificarToken,
    tokenEsValido,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession debe ser usado dentro de un SessionProvider");
  }
  return context;
};
