// app/_layout.jsx
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../context/SessionContext";
import { usePermissions } from "../hooks/usePermissions";

SplashScreen.preventAutoHideAsync();

// -------------------------
// CONFIGURAR CANAL ANDROID (IMPORTANTE)
async function setupAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Notificaciones",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
    });
  }
}

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Ejecutar configuración al cargar
setupAndroidChannel();

// -------------------------
// SERVICIO DE NOTIFICACIONES (WebSocket con reconexión)
const NTFY_BASE_URL = "wss://ntfy.inmero.co";
const NTFY_BASE_URL_HTTP = "https://ntfy.inmero.co";
const NTFY_USERNAME = "inmero";
const NTFY_PASSWORD = "Serveria.2025";

// Función para recuperar mensajes recientes
const fetchRecentMessages = async (topic, onMessage) => {
  try {
    console.log("Recuperando mensajes recientes de:", topic);
    const auth = btoa(`${NTFY_USERNAME}:${NTFY_PASSWORD}`);
    const response = await fetch(
      `${NTFY_BASE_URL_HTTP}/${topic}/json?poll=1&since=10s`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    if (!response.ok) {
      console.error("Error recuperando mensajes:", response.status);
      return;
    }

    const text = await response.text();
    if (!text.trim()) {
      console.log("No hay mensajes recientes");
      return;
    }

    // ntfy devuelve múltiples JSONs separados por newlines
    const messages = text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter((msg) => msg !== null && msg.event === "message");

    console.log(`Encontrados ${messages.length} mensajes recientes`);

    for (const message of messages) {
      console.log("Procesando mensaje reciente:", message);
      onMessage(message);
    }
  } catch (error) {
    console.error("Error recuperando mensajes recientes:", error);
  }
};

const subscribeToTopic = (topic, onMessage) => {
  let ws = null;
  let reconnectTimeout = null;
  let isClosed = false;
  let hasCheckedRecent = false;

  const connect = () => {
    try {
      console.log("Conectando a:", topic);

      ws = new WebSocket(`${NTFY_BASE_URL}/${topic}/ws`, [], {
        headers: {
          Authorization: "Basic " + btoa(`${NTFY_USERNAME}:${NTFY_PASSWORD}`),
        },
      });

      ws.onopen = () => {
        console.log("Conectado al topic:", topic);

        // Recuperar mensajes recientes solo la primera vez
        if (!hasCheckedRecent) {
          hasCheckedRecent = true;
          // Esperar 1 segundo antes de recuperar mensajes
          setTimeout(() => {
            fetchRecentMessages(topic, onMessage);
          }, 500);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Notificación recibida:", data);

          // Solo procesar mensajes reales (event === "message")
          if (data.event === "message") {
            console.log("Es un mensaje real, procesando...");
            onMessage?.(data);
          } else {
            console.log("Evento de control ignorado:", data.event);
          }
        } catch (err) {
          console.error("Error parseando mensaje:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("Error en WebSocket:", {
          message: error.message,
          type: error.type,
        });
      };

      ws.onclose = (event) => {
        console.log("WebSocket cerrado:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        // Reconectar solo si no se cerró intencionalmente
        if (!isClosed && event.code !== 1000) {
          console.log("Reconectando en 5 segundos...");
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };
    } catch (error) {
      console.error("Error creando WebSocket:", error);
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }
  };

  // Iniciar conexión
  connect();

  return {
    close: () => {
      isClosed = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close(1000, "Cierre intencional");
      }
      console.log("Desconectado del topic", topic);
    },
  };
};

// -------------------------
// INICIALIZADOR DE LA APP
function AppInitializer({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const { token, userId, tokenEsValido, refreshToken } = useSession();
  const { checkPermissionsAsked } = usePermissions();
  const [isReady, setIsReady] = useState(false);
  const hasNavigated = useRef(false);

  // Cargar fuentes
  const [fontsLoaded] = useFonts({
    RobotoBold: require("../assets/fonts/Roboto-Bold.ttf"),
    RobotoSemiBold: require("../assets/fonts/Roboto-SemiBold.ttf"),
    RobotoMedium: require("../assets/fonts/Roboto-Medium.ttf"),
    RobotoRegular: require("../assets/fonts/Roboto-Regular.ttf"),
    RobotoLight: require("../assets/fonts/Roboto-Light.ttf"),
    ...AntDesign.font,
    ...Ionicons.font,
    ...Feather.font,
    ...MaterialIcons.font,
  });

  // Ignorar warnings
  useEffect(() => {
    LogBox.ignoreLogs([
      "Support for defaultProps will be removed",
      "Expected newLocale to be a string",
      "Possible unhandled promise rejection",
    ]);
  }, []);

  // Ocultar splash
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
        .then(() => setIsReady(true))
        .catch(console.error);
    }
  }, [fontsLoaded]);

  // Navegación inicial
  useEffect(() => {
    if (!isReady || hasNavigated.current) return;

    const handleInitialNavigation = async () => {
      const isAuthenticated =
        (token && tokenEsValido()) || (token && refreshToken);

      const inAuthGroup = segments[0] === "(auth)";
      const inTabsGroup = segments[0] === "(tabs)";
      const isWelcome = segments[0] === "welcome" || segments.length === 0;
      const isPermissionsScreen = segments.includes("permissions");

      const permissionsAsked = await checkPermissionsAsked();

      if (isAuthenticated && inTabsGroup && permissionsAsked) {
        hasNavigated.current = true;
        return;
      }
      if (isAuthenticated && isPermissionsScreen) {
        hasNavigated.current = true;
        return;
      }
      if (!isAuthenticated && (isWelcome || inAuthGroup)) {
        hasNavigated.current = true;
        return;
      }

      if (isAuthenticated) {
        if (!permissionsAsked) {
          router.replace("/permissions");
        } else {
          router.replace("/(tabs)/welcome");
        }
      } else {
        router.replace("/welcome");
      }

      hasNavigated.current = true;
    };

    const timer = setTimeout(handleInitialNavigation, 100);
    return () => clearTimeout(timer);
  }, [isReady, token, refreshToken, checkPermissionsAsked]);

  // -------------------------
  // SUSCRIPCIÓN WEBSOCKET NTFY
  useEffect(() => {
    // Esperar a tener token y userId
    if (!token || !userId) {
      if (token && !userId) {
        console.log("⏳ Esperando userId para conectar WebSocket...");
      }
      return;
    }

    const topic = `user_${userId}`;
    console.log("🚀 Iniciando suscripción a:", topic);

    const subscription = subscribeToTopic(topic, async (message) => {
      // Extraer título y cuerpo del mensaje
      const title = message.title || "Nueva notificación";
      const body = message.message || "Sin descripción";

      console.log("📬 Preparando notificación:", { title, body });

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { topic, ...message },
            sound: true,
          },
          trigger: null,
        });
        console.log("✅ Notificación mostrada exitosamente");
      } catch (error) {
        console.error("❌ Error mostrando notificación:", error);
      }
    });

    return () => {
      console.log("🧹 Limpiando suscripción...");
      subscription.close();
    };
  }, [token, userId]);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {children}
    </GestureHandlerRootView>
  );
}

// -------------------------
// LAYOUT PRINCIPAL
export default function Layout() {
  return (
    <SessionProvider>
      <SafeAreaProvider>
        <AppInitializer>
          <Slot />
          <StatusBar style="dark" translucent />
        </AppInitializer>
      </SafeAreaProvider>
    </SessionProvider>
  );
}
