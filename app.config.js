import "dotenv/config";

export default ({ config }) => ({
  ...config,
  expo: {
    name: "sabbora",
    slug: "sabbora",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "sabbora",
    userInterfaceStyle: "automatic",
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff",
        foregroundImage: "./assets/images/android-icon.png",
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "POST_NOTIFICATIONS",
      ],
      package: "com.luami180.sabbora",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Sabbora necesita acceso a tu ubicación para encontrar restaurantes cercanos y ofrecerte mejores recomendaciones.",
          locationWhenInUsePermission:
            "Sabbora necesita acceso a tu ubicación para encontrar restaurantes cercanos y ofrecerte mejores recomendaciones.",
          isAndroidBackgroundLocationEnabled: false, // Solo ubicación en primer plano
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#B32231", // Cambia esto por tu color primario
          sounds: [], // Opcional: agrega sonidos personalizados
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      API_URL: process.env.API_URL,
      API_KEY: process.env.API_KEY,
      API_URL_LOGIN: process.env.API_URL_LOGIN,
      eas: {
        projectId: "d2663eea-6cd3-4f23-a6c8-962a0990eef1",
      },
    },
  },
});
