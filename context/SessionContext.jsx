// contexts/SessionContext.jsx
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
  getUserEmail,
  getUserId,
  getUsername,
  saveTokens,
  saveUserEmail,
  saveUserId,
  saveUsername,
} from "../services/auth";

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [token, setTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);
  const [username, setUsernameState] = useState(null);
  const [userId, setUserIdState] = useState(null);
  const [userEmail, setUserEmailState] = useState(null);
  const [tokenType, setTokenTypeState] = useState("bearer");

  // -------------------------
  // OBTENER DATOS DEL USUARIO DESDE EL SERVIDOR
  // -------------------------
  const fetchUserData = useCallback(
    async (userId, tokenParam = null) => {
      const tokenToUse = tokenParam || token;
      if (!userId || !tokenToUse) return null;

      try {
        const response = await fetch(
          `https://api.inmero.co/restpaid/users/users/${userId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${tokenToUse}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener datos del usuario");
        }

        const data = await response.json();

        // Guardar nombre completo
        const fullName = `${data.first_name} ${data.first_last_name}`.trim();
        await saveUsername(fullName);
        setUsernameState(fullName);

        // Guardar email
        if (data.email) {
          await saveUserEmail(data.email);
          setUserEmailState(data.email);
        }

        return data;
      } catch (error) {
        console.error("Error en fetchUserData:", error);
        return null;
      }
    },
    [token]
  );

  // -------------------------
  // GUARDAR SESIÓN COMPLETA
  // -------------------------
  const guardarSesionCompleta = async ({
    token,
    refreshToken = null,
    tokenType = "bearer",
    userId = null,
    username = null,
    email = null,
  }) => {
    if (!token) {
      throw new Error("Token es requerido");
    }

    // Guardar tokens
    await saveTokens(token, refreshToken, tokenType);
    setTokenState(token);
    setRefreshTokenState(refreshToken);
    setTokenTypeState(tokenType);

    // Si se proporciona userId, hacer fetch de datos completos
    if (userId) {
      await saveUserId(userId);
      setUserIdState(userId);
      await fetchUserData(userId, token);
    } else if (username) {
      // Si no hay userId pero sí username, guardarlo directamente
      await saveUsername(username);
      setUsernameState(username);
    }

    // Guardar email si se proporciona
    if (email) {
      await saveUserEmail(email);
      setUserEmailState(email);
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
        const savedEmail = await getUserEmail();

        if (savedToken) {
          setTokenState(savedToken);

          // Decodificar token para extraer userId como backup
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
        if (savedEmail) setUserEmailState(savedEmail);
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

      // Limpiar datos locales siempre
      await clearSessionData();
      setTokenState(null);
      setRefreshTokenState(null);
      setUsernameState(null);
      setUserIdState(null);
      setUserEmailState(null);
      setTokenTypeState("bearer");
      console.log("Sesión cerrada exitosamente");
    } catch (error) {
      console.error("Error en logout:", error);
      // Intentar limpiar de todos modos
      try {
        await clearSessionData();
        setTokenState(null);
        setRefreshTokenState(null);
        setUsernameState(null);
        setUserIdState(null);
        setUserEmailState(null);
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
    userEmail,
    setUsername: setUsernameState,

    // Funciones principales
    fetchUserData,
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
