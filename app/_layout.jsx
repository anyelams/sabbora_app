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
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SessionProvider, useSession } from "../context/SessionContext";

SplashScreen.preventAutoHideAsync();

function AppInitializer({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const { token, tokenEsValido } = useSession();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

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

  useEffect(() => {
    LogBox.ignoreLogs([
      "Support for defaultProps will be removed from function components in a future major release",
      "Expected newLocale to be a string",
      "Possible unhandled promise rejection",
    ]);
  }, []);

  // Ocultar splash screen cuando las fuentes estén listas
  useEffect(() => {
    const prepareApp = async () => {
      if (fontsLoaded) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.error("Error ocultando splash screen:", error);
        }
      }
    };
    prepareApp();
  }, [fontsLoaded]);

  // Manejar autenticación y navegación
  useEffect(() => {
    if (!fontsLoaded) return;

    const handleNavigation = async () => {
      try {
        // Verificar estado de autenticación
        // Si el token existe Y es válido, el usuario está autenticado
        // Si el token expiró, el interceptor de axiosPrivate lo refrescará automáticamente en el primer request
        const isAuthenticated = token && tokenEsValido();

        // Determinar la ruta actual
        const inAuthGroup = segments[0] === "(auth)";
        const inTabsGroup = segments[0] === "(tabs)";
        const currentPath = segments.join("/") || "index";

        // Lógica de navegación
        if (isAuthenticated) {
          // Usuario autenticado - redirigir a tabs si está en rutas públicas
          if (
            !inTabsGroup &&
            (currentPath === "index" ||
              currentPath === "welcome" ||
              inAuthGroup)
          ) {
            router.replace("/(tabs)/home");
          }
        } else {
          // Usuario NO autenticado
          // Solo redirigir a welcome si está en rutas protegidas (tabs) o en index
          if (inTabsGroup) {
            router.replace("/welcome");
          } else if (currentPath === "index") {
            router.replace("/welcome");
          }
          // Si está en welcome, login, register, etc., no hacer nada
          // Esto permite navegar libremente entre las pantallas de auth
        }

        setIsNavigationReady(true);
      } catch (error) {
        console.error("Error en navegación:", error);
        router.replace("/welcome");
        setIsNavigationReady(true);
      }
    };

    handleNavigation();
  }, [fontsLoaded, token, segments, router, tokenEsValido]);

  // Mostrar nada hasta que todo esté listo
  if (!fontsLoaded || !isNavigationReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {children}
    </GestureHandlerRootView>
  );
}

export default function Layout() {
  return (
    <SessionProvider>
      <AppInitializer>
        <Slot />
        <StatusBar style="dark" translucent={true} />
      </AppInitializer>
    </SessionProvider>
  );
}
