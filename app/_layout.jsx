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
import { getPermissionsAsked } from "../services/permissions";

SplashScreen.preventAutoHideAsync();

// -------------------------
// Inicializador de la App
// -------------------------
function AppInitializer({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const { token, tokenEsValido } = useSession();
  const [isReady, setIsReady] = useState(false);
  const hasNavigated = useRef(false);

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

  // Ignorar logs molestos
  useEffect(() => {
    LogBox.ignoreLogs([
      "Support for defaultProps will be removed",
      "Expected newLocale to be a string",
      "Possible unhandled promise rejection",
    ]);
  }, []);

  // Ocultar splash cuando se carguen las fuentes
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
        .then(() => setIsReady(true))
        .catch(console.error);
    }
  }, [fontsLoaded]);

  // Navegación inicial solo UNA VEZ
  useEffect(() => {
    if (!isReady || hasNavigated.current) return;

    const handleInitialNavigation = async () => {
      const isAuthenticated = token && tokenEsValido();
      const inAuthGroup = segments[0] === "(auth)";
      const inTabsGroup = segments[0] === "(tabs)";
      const isWelcome = segments[0] === "welcome" || segments.length === 0;
      const isPermissionsScreen = segments.includes("permissions");

      // ⭐ Verificar si ya se pidieron los permisos
      const permissionsAsked = await getPermissionsAsked();

      // Evitar redirecciones innecesarias
      if (isAuthenticated && inTabsGroup && permissionsAsked) {
        hasNavigated.current = true;
        return; // Ya está en la ruta correcta
      }

      // Si está autenticado pero en pantalla de permisos, dejarlo ahí
      if (isAuthenticated && isPermissionsScreen) {
        hasNavigated.current = true;
        return;
      }

      if (!isAuthenticated && (isWelcome || inAuthGroup)) {
        hasNavigated.current = true;
        return; // Ya está en la ruta correcta
      }

      // Realizar navegación necesaria
      if (isAuthenticated) {
        // Si está autenticado pero no se han pedido permisos, ir a permisos
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

    // Pequeño delay para evitar conflictos con expo-router
    const timer = setTimeout(handleInitialNavigation, 100);
    return () => clearTimeout(timer);
  }, [isReady, token]);

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
// Layout principal
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
