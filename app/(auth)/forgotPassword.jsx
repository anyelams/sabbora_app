// app/(auth)/forgotPassword.jsx
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import axiosPublic from "../../services/axiosPublic";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    setErrors({});

    // Validaciones
    if (!email.trim()) {
      setErrors({ email: "Email es requerido" });
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrors({ email: "Email inválido" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosPublic.post("/users/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      // Éxito - Navegar a la pantalla de confirmación
      router.replace("/PasswordResetSent");
    } catch (err) {
      console.error("Error en forgot password:", err);

      let errorMessage = "Error inesperado. Intenta nuevamente";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else {
        switch (err.response?.status) {
          case 404:
            errorMessage = "No existe una cuenta con este email";
            break;
          case 400:
            errorMessage = "Email inválido";
            break;
          case 429:
            errorMessage = "Demasiados intentos. Por favor intenta más tarde";
            break;
          case 500:
            errorMessage = "Error del servidor. Intenta más tarde";
            break;
          default:
            if (
              err.message?.includes("Network Error") ||
              err.code === "NETWORK_ERROR"
            ) {
              errorMessage = "Error de conexión. Verifica tu internet";
            } else if (err.message?.includes("timeout")) {
              errorMessage = "Tiempo de espera agotado. Intenta nuevamente";
            }
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo y título */}
          <View style={styles.topSection}>
            <Text style={styles.mainTitle}>Recuperar contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña.
            </Text>
          </View>

          {/* Error general */}
          {errors.general && (
            <Text style={styles.generalError}>{errors.general}</Text>
          )}

          {/* Formulario */}
          <View style={styles.stepContainer}>
            <CustomInput
              label="Correo Electrónico"
              placeholder="Ingresa tu correo electrónico"
              value={email}
              onChangeText={handleEmailChange}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              error={errors.email}
            />

            {/* Botones */}
            <View style={styles.buttonContainer}>
              <CustomButton
                text={
                  isLoading ? "Enviando..." : "Enviar enlace de recuperación"
                }
                onPress={handleSubmit}
                variant="primary"
                icon={!isLoading ? "arrow-forward" : null}
                disabled={isLoading}
                style={styles.fullButton}
              />
            </View>

            <View style={styles.footer}>
              <View style={styles.footerLinks}>
                <Text style={styles.footerText}>
                  ¿Recordaste tu contraseña?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/login")}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>Inicia sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 40,
  },
  topSection: {
    marginBottom: 28,
  },
  mainTitle: {
    ...typography.bold.big,
    fontSize: 26,
    color: colors.text,
  },
  subtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  generalError: {
    ...typography.regular.regular,
    color: colors.error,
    marginBottom: 24,
    textAlign: "center",
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  stepContainer: {
    flex: 1,
    gap: 6,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  fullButton: {
    flex: 1,
  },
  footer: {
    paddingTop: 12,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    ...typography.regular.medium,
    color: colors.textSec,
    fontSize: 14,
  },
  linkText: {
    ...typography.semibold.regular,
    color: colors.secondary,
    fontSize: 14,
  },
});
