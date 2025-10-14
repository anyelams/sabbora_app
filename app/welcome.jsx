// app/welcome.jsx - Logo más grande y botones ajustados
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  const topOpacity = useSharedValue(0);
  const topTranslateY = useSharedValue(-10);
  const bottomOpacity = useSharedValue(0);
  const bottomTranslateY = useSharedValue(20);

  useEffect(() => {
    topOpacity.value = withTiming(1, { duration: 600 });
    topTranslateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    bottomOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    bottomTranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));
  }, []);

  const animatedTopStyle = useAnimatedStyle(() => ({
    opacity: topOpacity.value,
    transform: [{ translateY: topTranslateY.value }],
  }));

  const animatedBottomStyle = useAnimatedStyle(() => ({
    opacity: bottomOpacity.value,
    transform: [{ translateY: bottomTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/images/restaurant-background.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Degradado */}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.6)",
            "rgba(0,0,0,0.4)",
            "rgba(0,0,0,0.4)",
            "rgba(0,0,0,0.9)",
          ]}
          locations={[0, 0.3, 0.6, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.content}>
            {/* Sección superior: Logo + Título */}
            <Animated.View style={[styles.topSection, animatedTopStyle]}>
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.mainTitle}>
                Tu mesa y tu menú,{"\n"} en un
                <Text style={styles.titleHighlight}> solo lugar.</Text>
              </Text>
            </Animated.View>

            {/* Espaciador */}
            <View style={styles.spacer} />

            {/* Sección inferior */}
            <Animated.View style={[styles.bottomSection, animatedBottomStyle]}>
              {/* Subtítulo */}
              <Text style={styles.subtitle}>
                Reserva en segundos y disfruta experiencias gastronómicas únicas
              </Text>

              {/* Botones */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push("/register")}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Crear cuenta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push("/login")}
                  activeOpacity={0.9}
                >
                  <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
                </TouchableOpacity>
              </View>

              {/* Footer legal */}
              <Text style={styles.legalText}>
                Al continuar, aceptas nuestros{" "}
                <Text style={styles.legalLink}>Términos de Servicio</Text>.{" "}
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    paddingTop: 30,
    gap: 12,
  },
  logo: {
    width: 180,
    height: 75,
  },
  mainTitle: {
    ...typography.bold.big,
    fontSize: 30,
    color: colors.white,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  titleHighlight: {
    ...typography.bold.big,
    fontSize: 30,
    color: colors.primary,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingBottom: 20,
    gap: 20,
  },
  subtitle: {
    ...typography.regular.big,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 24,
  },
  buttonsContainer: {
    gap: 18,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: "center",
    elevation: 6,
  },
  primaryButtonText: {
    ...typography.bold.regular,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  secondaryButtonText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
  legalText: {
    ...typography.regular.regular,
    color: "rgba(255,255,255,0.5)",
    textAlign: "left",
  },
  legalLink: {
    color: "rgba(255,255,255,0.65)",
    textDecorationLine: "underline",
  },
});
