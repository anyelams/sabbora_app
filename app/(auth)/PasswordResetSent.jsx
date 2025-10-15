// app/(auth)/PasswordResetSent.jsx
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import LogoInmero from "../../components/LogoInmero";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";

/**
 * Pantalla de confirmación de envío de email de recuperación de contraseña
 * Se muestra después de que el usuario solicita restablecer su contraseña,
 * informándole que debe revisar su email para completar el proceso
 */
export default function PasswordResetSent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo posicionado en la parte superior */}
      <View style={[styles.logoContainer, { marginTop: insets.top + 0 }]}>
        <LogoInmero width={150} height={140} />
      </View>

      {/* Imagen ilustrativa de email enviado */}
      <Image
        source={require("../../assets/images/emailsent.png")}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Título principal */}
      <Text style={styles.title}>¡Revisa tu correo!</Text>

      {/* Descripción explicativa */}
      <Text style={styles.description}>
        Te hemos enviado un enlace para restablecer tu contraseña. Por favor,
        revisa tu bandeja de entrada.
      </Text>

      {/* Footer con botón de acción */}
      <View style={styles.footer}>
        <CustomButton
          text="Volver a iniciar sesión"
          onPress={() => router.replace("/login")}
          variant="primary"
          width="95%"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal centrado
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  // Logo posicionado absolutamente en la parte superior
  logoContainer: {
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  // Imagen central ilustrativa
  image: {
    width: 260,
    height: 260,
    marginTop: 80,
    marginBottom: 60,
  },
  // Título principal con énfasis
  title: {
    ...typography.bold.big,
    fontSize: 22,
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  // Descripción explicativa con espaciado
  description: {
    ...typography.regular.regular,
    fontSize: 15,
    color: colors.textSec,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  // Contenedor del botón de acción
  footer: {
    marginTop: 32,
    width: "100%",
    alignItems: "center",
  },
});
