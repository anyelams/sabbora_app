// app/profile/changePassword.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
import axiosPrivate from "../../services/axiosPrivate";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { cerrarSesion } = useSession();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#\-_])[A-Za-z\d@$!%*?&.#\-_]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Contraseña actual es requerida";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Nueva contraseña es requerida";
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword =
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirmar contraseña es requerida";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      newErrors.newPassword =
        "La nueva contraseña debe ser diferente a la actual";
    }

    return newErrors;
  };

  const handleChangePassword = async () => {
    if (isLoading) return;

    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosPrivate.post("/users/change-password", {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });

      Alert.alert(
        "¡Contraseña actualizada!",
        "Por seguridad, debes iniciar sesión nuevamente.",
        [
          {
            text: "Continuar",
            onPress: async () => {
              await cerrarSesion();
              router.replace("/(auth)/login");
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      console.error("Error en cambio de contraseña:", err);

      let errorMessage = "Error inesperado. Intenta nuevamente";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else {
        switch (err.response?.status) {
          case 400:
            errorMessage = "Datos inválidos";
            break;
          case 401:
            errorMessage = "Contraseña actual incorrecta";
            break;
          case 422:
            errorMessage = "La nueva contraseña no cumple los requisitos";
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
            <Text style={styles.mainTitle}>Cambiar contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu contraseña actual y luego tu nueva contraseña para
              actualizar tu cuenta.
            </Text>
          </View>

          {/* Error general */}
          {errors.general && (
            <Text style={styles.generalError}>{errors.general}</Text>
          )}

          {/* Formulario */}
          <View style={styles.stepContainer}>
            <CustomInput
              label="Contraseña actual *"
              placeholder="Ingresa tu contraseña actual"
              value={formData.currentPassword}
              onChangeText={(value) =>
                handleInputChange("currentPassword", value)
              }
              icon="lock-closed-outline"
              secureTextEntry={true}
              showPasswordToggle={true}
              editable={!isLoading}
              error={errors.currentPassword}
            />

            <CustomInput
              label="Nueva contraseña *"
              placeholder="Mínimo 8 caracteres"
              value={formData.newPassword}
              onChangeText={(value) => handleInputChange("newPassword", value)}
              icon="lock-closed-outline"
              secureTextEntry={true}
              showPasswordToggle={true}
              editable={!isLoading}
              error={errors.newPassword}
            />

            <CustomInput
              label="Confirmar nueva contraseña *"
              placeholder="Repite tu nueva contraseña"
              value={formData.confirmPassword}
              onChangeText={(value) =>
                handleInputChange("confirmPassword", value)
              }
              icon="lock-closed-outline"
              secureTextEntry={true}
              showPasswordToggle={true}
              editable={!isLoading}
              error={errors.confirmPassword}
            />

            {/* Requisitos de contraseña */}
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={colors.primary}
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>
                  Requisitos de la contraseña
                </Text>
                <Text style={styles.infoText}>
                  • Al menos 8 caracteres{"\n"}• Una letra mayúscula (A-Z)
                  {"\n"}• Una letra minúscula (a-z){"\n"}• Un número (0-9)
                  {"\n"}• Un carácter especial (@$!%*?&)
                </Text>
              </View>
            </View>

            {/* Botones */}
            <View style={styles.buttonContainer}>
              <CustomButton
                text={isLoading ? "Cambiando..." : "Cambiar contraseña"}
                onPress={handleChangePassword}
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
                  onPress={() => router.back()}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>Volver</Text>
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
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "flex-start",
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 4,
    fontSize: 14,
  },
  infoText: {
    ...typography.regular.small,
    color: colors.textSec,
    lineHeight: 18,
    fontSize: 13,
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
