// app/(auth)/login.jsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { useSession } from "../../context/SessionContext";
import axiosPublic from "../../services/axiosPublic";
import { getPermissionsAsked } from "../../services/permissions";

const LAST_EMAIL_KEY = "@last_login_email_restpaid";

export default function LoginScreen() {
  const router = useRouter();

  const [emailOrDocument, setEmailOrDocument] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [rememberEmail, setRememberEmail] = useState(true);

  const { guardarSesionCompleta, decodificarToken } = useSession();

  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(LAST_EMAIL_KEY);
      if (savedEmail) {
        setEmailOrDocument(savedEmail);
        setRememberEmail(true);
      } else {
        setRememberEmail(true);
      }
    } catch (error) {
      console.log("Error cargando email guardado:", error);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const saveEmail = async (email) => {
    try {
      await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
    } catch (error) {
      console.log("Error guardando email:", error);
    }
  };

  const validateEmailOrDocument = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const documentRegex = /^\d{6,}$/;
    return emailRegex.test(input) || documentRegex.test(input);
  };

  const handleEmailOrDocumentChange = (value) => {
    setEmailOrDocument(value);
    if (errors.emailOrDocument) {
      setErrors((prev) => ({ ...prev, emailOrDocument: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  const handleLogin = async () => {
    if (isLoading) return;

    setErrors({});
    setIsLoading(true);

    if (!emailOrDocument.trim()) {
      setErrors({ emailOrDocument: "Email o documento requerido" });
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setErrors({ password: "Contraseña requerida" });
      setIsLoading(false);
      return;
    }

    if (!validateEmailOrDocument(emailOrDocument)) {
      setErrors({ emailOrDocument: "Email o documento inválido" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosPublic.post("/users/login", {
        email_or_document_number: emailOrDocument.trim(),
        password: password,
      });

      const { access_token, refresh_token, token_type, user } = response.data;

      if (!access_token) {
        setErrors({ general: "Error: No se recibió token del servidor" });
        setIsLoading(false);
        return;
      }

      if (rememberEmail) {
        await saveEmail(emailOrDocument.trim());
      } else {
        await AsyncStorage.removeItem(LAST_EMAIL_KEY);
      }

      const tokenPayload = decodificarToken(access_token);
      const userId = tokenPayload?.user_id || user?.id;
      const username = user?.email || user?.username || emailOrDocument.trim();

      await guardarSesionCompleta({
        token: access_token,
        refreshToken: refresh_token,
        tokenType: token_type || "bearer",
        userId: userId,
        username: username,
      });

      // ⭐ NUEVA LÓGICA: Verificar si ya se pidieron los permisos
      const permissionsAsked = await getPermissionsAsked();

      if (permissionsAsked) {
        // Si ya se pidieron, ir directamente a la app
        router.replace("/(tabs)/welcome");
      } else {
        // Si no se han pedido, ir a la pantalla de permisos
        router.replace("/permissions");
      }
    } catch (err) {
      console.error("Error en login:", err);
      console.error("Detalles del error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      let errorMessage;

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else {
        switch (err.response?.status) {
          case 401:
            errorMessage = "Credenciales incorrectas";
            break;
          case 404:
            errorMessage = "Usuario no encontrado";
            break;
          case 400:
            errorMessage = "Datos inválidos";
            break;
          case 422:
            errorMessage = "Datos de entrada incorrectos";
            break;
          case 500:
            errorMessage = "Error interno del servidor";
            break;
          default:
            if (
              err.message?.includes("Network Error") ||
              err.code === "NETWORK_ERROR"
            ) {
              errorMessage = "Error de conexión. Verifica tu internet";
            } else if (err.message?.includes("timeout")) {
              errorMessage = "Tiempo de espera agotado. Intenta nuevamente";
            } else {
              errorMessage = "Error inesperado. Intenta nuevamente";
            }
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEmail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.topSection}>
            <Text style={styles.mainTitle}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>
              Ingresa tus credenciales para acceder
            </Text>
          </View>

          {errors.general && (
            <Text style={styles.generalError}>{errors.general}</Text>
          )}

          <View style={styles.stepContainer}>
            <CustomInput
              label="Email o Documento"
              placeholder="Ingresa tu email o documento"
              value={emailOrDocument}
              onChangeText={handleEmailOrDocumentChange}
              icon="person-outline"
              keyboardType="default"
              autoCapitalize="none"
              editable={!isLoading}
              error={errors.emailOrDocument}
            />

            <CustomInput
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={handlePasswordChange}
              icon="lock-closed-outline"
              secureTextEntry={true}
              showPasswordToggle={true}
              editable={!isLoading}
              error={errors.password}
            />

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberEmail(!rememberEmail)}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={rememberEmail ? "checkbox" : "square-outline"}
                  size={20}
                  color={rememberEmail ? colors.secondary : colors.textSec}
                />
                <Text style={styles.rememberText}>Recordarme</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/forgotPassword")}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <CustomButton
                text={isLoading ? "Ingresando..." : "Iniciar Sesión"}
                onPress={handleLogin}
                variant="primary"
                icon={!isLoading ? "arrow-forward" : null}
                disabled={isLoading}
                style={styles.fullButton}
              />
            </View>
          </View>
          <View style={styles.footer}>
            <View style={styles.footerLinks}>
              <Text style={styles.footerText}>¿No tienes cuenta? </Text>
              <TouchableOpacity
                onPress={() => router.replace("/register")}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Regístrate</Text>
              </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.regular.medium,
    color: colors.textSec,
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
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 0,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.textSec,
    ...typography.regular.medium,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: colors.secondary,
    textAlign: "right",
    ...typography.semibold.regular,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  fullButton: {
    flex: 1,
  },
  footer: {
    paddingTop: 32,
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
