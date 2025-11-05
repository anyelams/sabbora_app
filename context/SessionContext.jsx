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

        const fullName = `${data.first_name} ${data.first_last_name}`.trim();
        await saveUsername(fullName);
        setUsernameState(fullName);

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

    await saveTokens(token, refreshToken, tokenType);
    setTokenState(token);
    setRefreshTokenState(refreshToken);
    setTokenTypeState(tokenType);

    // Guardar userId una sola vez
    if (userId) {
      await saveUserId(userId);
      setUserIdState(userId);
      // Fetch de datos del usuario
      await fetchUserData(userId, token);
    } else if (username) {
      await saveUsername(username);
      setUsernameState(username);
    }

    if (email) {
      await saveUserEmail(email);
      setUserEmailState(email);
    }
  };

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
  }, [decodificarToken]);

  const cerrarSesion = async () => {
    try {
      if (refreshToken) {
        try {
          const axiosPrivate = (await import("../services/axiosPrivate"))
            .default;
          await axiosPrivate.post("/users/logout", {
            refresh_token: refreshToken,
          });
        } catch (logoutError) {
          console.error("Error en logout del servidor:", logoutError);
        }
      }

      await clearSessionData();
      setTokenState(null);
      setRefreshTokenState(null);
      setUsernameState(null);
      setUserIdState(null);
      setUserEmailState(null);
      setTokenTypeState("bearer");
    } catch (error) {
      console.error("Error en logout:", error);
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

  const tokenEsValido = useCallback(() => {
    const claims = decodificarToken();
    if (!claims) return false;
    const ahora = Math.floor(Date.now() / 1000);
    return claims.exp > ahora;
  }, [decodificarToken]);

  const contextValue = {
    token,
    refreshToken,
    tokenType,
    username,
    userId,
    userEmail,
    setUsername: setUsernameState,
    fetchUserData,
    guardarSesionCompleta,
    cerrarSesion,
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
