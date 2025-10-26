// app/_layout.jsx
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../context/SessionContext";
import { usePermissions } from "../hooks/usePermissions";

SplashScreen.preventAutoHideAsync();

// -------------------------
// Inicializador de la App
// -------------------------
function AppInitializer({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const { token, refreshToken, tokenEsValido } = useSession();
  const { checkPermissionsAsked } = usePermissions();
  const [isReady, setIsReady] = useState(false);
  const hasNavigated = useRef(false);

  // Cargar fuentes personalizadas e iconos
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

  // Ignorar warnings específicos de terceros
  useEffect(() => {
    LogBox.ignoreLogs([
      "Support for defaultProps will be removed",
      "Expected newLocale to be a string",
      "Possible unhandled promise rejection",
    ]);
  }, []);

  // Ocultar splash screen cuando las fuentes estén cargadas
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
        .then(() => setIsReady(true))
        .catch(console.error);
    }
  }, [fontsLoaded]);

  // Navegación inicial basada en estado de autenticación
  useEffect(() => {
    if (!isReady || hasNavigated.current) return;

    const handleInitialNavigation = async () => {
      // Determinar si el usuario está autenticado
      // Se considera autenticado si:
      // 1. Tiene un token válido (no expirado), O
      // 2. Tiene ambos tokens (access y refresh) - el interceptor renovará automáticamente si expira
      const isAuthenticated =
        (token && tokenEsValido()) || (token && refreshToken);

      // Detectar en qué grupo de rutas está el usuario
      const inAuthGroup = segments[0] === "(auth)";
      const inTabsGroup = segments[0] === "(tabs)";
      const isWelcome = segments[0] === "welcome" || segments.length === 0;
      const isPermissionsScreen = segments.includes("permissions");

      // Verificar si ya se solicitaron los permisos anteriormente
      const permissionsAsked = await checkPermissionsAsked();

      // Evitar redirecciones innecesarias si ya está en la ruta correcta
      if (isAuthenticated && inTabsGroup && permissionsAsked) {
        hasNavigated.current = true;
        return;
      }

      // Permitir que usuarios autenticados permanezcan en pantalla de permisos
      if (isAuthenticated && isPermissionsScreen) {
        hasNavigated.current = true;
        return;
      }

      // Permitir que usuarios no autenticados permanezcan en welcome o auth
      if (!isAuthenticated && (isWelcome || inAuthGroup)) {
        hasNavigated.current = true;
        return;
      }

      // Realizar navegación según estado de autenticación y permisos
      if (isAuthenticated) {
        if (!permissionsAsked) {
          // Usuario autenticado pero sin permisos solicitados
          router.replace("/permissions");
        } else {
          // Usuario autenticado con permisos ya solicitados
          router.replace("/(tabs)/welcome");
        }
      } else {
        // Usuario no autenticado
        router.replace("/welcome");
      }

      hasNavigated.current = true;
    };

    // Delay breve para evitar conflictos con el sistema de rutas de expo-router
    const timer = setTimeout(handleInitialNavigation, 100);
    return () => clearTimeout(timer);
  }, [isReady, token, refreshToken, checkPermissionsAsked]);

  // Mostrar pantalla vacía mientras se inicializa
  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {children}
    </GestureHandlerRootView>
  );
}

// -------------------------
// Layout principal de la aplicación
// -------------------------
export default function Layout() {
  return (
    <SessionProvider>
      <SafeAreaProvider>
        <AppInitializer>
          <Slot />
          <StatusBar style="dark" translucent={true} />
        </AppInitializer>
      </SafeAreaProvider>
    </SessionProvider>
  );
}
